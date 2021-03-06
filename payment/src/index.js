'use strict';

console.log('Starting payment gateway...');
const assert = require('assert');
const uuid = require('uuid/v4');
const sleep = require('sleep-promise');
const qrcode = require('qrcode');
const bodyParser = require('body-parser');
const express = require('express');
const request = require('request-promise-native');
const ioredis = require('ioredis');
const config = require('../config.json');
const db = new ioredis({
    host: config.localRedisHost,
    port: config.localRedisPort,
    db: config.localRedisDB,
    password: config.localRedisAuth,
});
const remoteDb = new ioredis({
    host: config.remoteRedisHost,
    port: config.remoteRedisPort,
    db: config.remoteRedisDB,
    password: config.remoteRedisAuth,
});
const app = express();

let firebaseAdmin, testnetAddr;
// we have separate jwtShit and isDev because sometimes we want livenet without jwt
let jwtShit = false;
if(process.argv[2] === 'dev') {
    if(!process.argv[3]) {
        console.log('Please provide testnet address as cmd line arg!');
        process.exit();
    }
    console.log('WARNING! RUNNING IN DEV MODE! IF YOU SEE THIS IN PRODUCTION YOU WILL SOON WISH YOU HAD A STAKE THROUGH YOUR HEAD! IM NOT FUCKING KIDDING!');
    testnetAddr = process.argv[3];
    jwtShit = true;
    app.set('env', 'development');
} else if(process.argv[2] === 'semi') {
    jwtShit = true;
    app.set('env', 'production');
    console.log('Running in semi-production mode');
} else {
    firebaseAdmin = require('firebase-admin');
    firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(require(config.firebaseKeyPath)),
        databaseURL: config.firebaseDatabaseURL,
    });
    console.log('Running in production mode. All is well in the world.');
    app.set('env', 'production');
}
const isDev = app.get('env') === 'development';
app.use(bodyParser.json());

// verify config is ok
assert.deepEqual(Object.keys(config).sort(), [
    'port',
    'merchantFields',
    'localRedisHost',
    'localRedisPort',
    'localRedisDB',
    'localRedisAuth',
    'remoteRedisHost',
    'remoteRedisPort',
    'remoteRedisDB',
    'remoteRedisAuth',
    'createAddressHost',
    'pinVerificationHost',
    'pollLimit',
    'pollFrequency',
    'firebaseKeyPath',
    'firebaseDatabaseURL',
    'brokerageHost',
].sort());
// and DB config
db.exists('gatewayConfig:fee')
.then(feeExists => {
    if(!feeExists) {
        console.log('FATAL: fee not set in DB')
        process.exit();
    }
})

const checkParams = requiredParams => (req, res, next) => {
    if(!requiredParams.every(c => c in req.body)){
        next({
            code: 400,
            message: 'You must include all of the following POST parameters: ' + requiredParams.join(' '),
        });
    } else {
        next();
    }
}

const authenticate = (req, res, next) => {
    if(jwtShit) {
        req.userId = +req.body.jwt;
        next();
        return;
    }

    firebaseAdmin.auth().verifyIdToken(req.body.jwt)
    .then(userId => {
        if(userId) {
            req.userId = userId.slice(5);
            next();
        } else {
            next({
                code: 401,
                message: 'Authentication failed',
            });
        }
    });
}

app.post('/createMerchant', checkParams(['jwt', 'info', 'authorizedDomains']), authenticate, (req, res, next) => {
    if(!config.merchantFields.every(c => c in req.body.info)) {
        next({
            code: 400,
            message: 'Must have one one of each of the following in info: ' + config.merchantFields.join(' '),
        });
        return;
    }
    if(!(req.body.authorizedDomains instanceof Array && req.body.authorizedDomains.every(c => typeof c === 'string'))) {
        next({
            code: 400,
            message: 'authorized domains must be a list of strings'
        });
        return;
    }
    const keyMerchant = `merchants:${req.userId}`;
    db.exists(`${keyMerchant}:info`)
    .then(merchantExists => {
        if(!merchantExists) {
            const apiSecret = uuid();
            const apiPublic = uuid();
            return db.pipeline()
            .set(`${keyMerchant}:autoSettle`, false)
            .set(`${keyMerchant}:apiSecret`, apiSecret)
            .set(`${keyMerchant}:apiPublic`, apiPublic)
            .set(`apiSecrets:${apiSecret}`, req.userId)
            .set(`apiPublics:${apiPublic}`, req.userId)
            .exec();
        }
    })
    .then(() => db.set(`${keyMerchant}:authorizedDomains`, /* ah fuck it */ JSON.stringify(req.body.authorizedDomains)))
    .then(() => db.set(`${keyMerchant}:info`, JSON.stringify(req.body.info)))
    .then(c => res.json({ status: 'success' }));
});

app.post('/getMerchantInfo', checkParams(['jwt']), authenticate, (req, res, next) => {
    const keyMerchant = `merchants:${req.userId}`;
    db.exists(`${keyMerchant}:info`)
    .then(exists => {
        if(!exists) {
            next({
                code: 404,
                message: 'merchant does not exist',
            });
        } else {
            db.pipeline()
            .get(`${keyMerchant}:info`)
            .get(`${keyMerchant}:apiSecret`)
            .get(`${keyMerchant}:apiPublic`)
            .get(`${keyMerchant}:authorizedDomains`)
            .get(`${keyMerchant}:autoSettle`)
            .exec()
            .then(merchantData => {
                res.json({
                    status: 'success',
                    info: JSON.parse(merchantData[0][1]),
                    apiSecret: merchantData[1][1],
                    apiPublic: merchantData[2][1],
                    authorizedDomains: merchantData[3][1],
                    autoSettle: merchantData[4][1],
                });
            });
        }
    });
});

app.post('/autoSettle', checkParams(['jwt', 'autoSettle']), authenticate, (req, res, next) => {
    if(typeof req.body.autoSettle !== 'boolean') {
        next({
            code: 400,
            message: 'autoSettle param must be a bool',
        });
        return;
    }
    db.set(`merchants:${req.userId}:autoSettle`, req.body.autoSettle)
    .then(() => res.json({
        status: 'success',
    }))
    .catch(next);
});

app.post('/startTransaction', checkParams(['apiPublic', 'amount', 'info', 'confirmedCallback']), (req, res, next) => {
    if(typeof req.body.amount !== 'number' || isNaN(req.body.amount)) {
        next({
            code: 400,
            message: 'amount param must be numerical',
        });
        return;
    }
    let keyMerchant, merchantId, txId, keyTx, address, qrDataUrl;
    db.get(`apiPublics:${req.body.apiPublic}`)
    .then(userId => {
        if(!userId) {
            throw {
                code: 404,
                message: 'invalid public key',
            };
        } else {
            merchantId = userId;
            keyMerchant = `merchants:${userId}`;
        }
    })
    .then(() => db.get(`${keyMerchant}:authorizedDomains`))
    .then(authorizedDomainsStr => {
        if(!JSON.parse(authorizedDomainsStr).includes(req.get('origin'))) {
            throw {
                code: 403,
                message: `The origin header delivered with your request, "${req.get('origin')}", is not approved to use this public key.`,
            }
        }
    })
    .then(() => keyTx = `txs:${txId = uuid()}`)
    .then(() => {
        // get address to pay to
        if(isDev) {
            address = testnetAddr;
        } else {
            return request.get(`${config.createAddressHost}/create_address`)
            .then(response => address = JSON.parse(response).address);
        }
    })
    .then(() => new Promise((resolve, reject) => {
        qrcode.toDataURL(`bitcoin:${address}?amount=${req.body.amountSatoshis / 100000000}`, (err, dataUrl) => {
            if(err) {
                reject(err);
                return;
            }
            qrDataUrl = dataUrl;
            resolve();
        })
    }))
    .then(() => db.get(`${keyMerchant}:info`))
    .then(merchantInfo =>
        db.multi()
        .set(`${keyTx}:merchantInfo`, merchantInfo)
        .set(`${keyTx}:merchant`, merchantId)
        .set(`${keyTx}:purchaseInfo`, JSON.stringify(req.body.info))
        .set(`${keyTx}:requestOriginHeader`, req.get('origin'))
        .set(`${keyTx}:confirmedCallback`, req.body.confirmedCallback)
        .set(`${keyTx}:requestedAmount`, req.body.amount)
        .set(`${keyTx}:paidAmount`, 0)
        .set(`${keyTx}:sellerReceived`, 0)
        .set(`${keyTx}:feeReceived`, 0)
        .set(`${keyTx}:status`, 'pending')
        .set(`${keyTx}:address`, address)
        .set(`${keyTx}:qr`, qrDataUrl)
        .set(`${keyTx}:startTime`, Date.now())
        .lpush(`${keyMerchant}:txs`, txId)
        .sadd('pendingTxs', txId)
        .exec()
    )
    .then(() => res.json({
        status: 'success',
        txId,
        address,
        qr: qrDataUrl,
    }))
    // this is so cool
    .catch(next);
});

app.post('/getTransactionInfo', checkParams(['txId']), (req, res, next) => {
    let keys;
    db.keys(`txs:${req.body.txId}:*`)
    .then(keysArg => {
        if(keysArg.length === 0) {
            throw {
                code: 404,
                message: 'Transaction does not exist',
            }
        }
        // there's some stuff we don't want in here
        keys = keysArg.filter(curKey => [
            'confirmedCallback',
        ].every(curFilter => !curKey.includes(curFilter)));
        const pipe = db.pipeline();
        keys.forEach(c => pipe.get(c));
        return pipe.exec();
    })
    .then(txInfo => {
        const boop = {};
        keys.forEach((curKey, index) => boop[curKey.slice(curKey.lastIndexOf(':') + 1)] = txInfo[index][1]);
        boop.state = boop.status;
        boop.status = 'success';
        res.json(boop);
    })
    .catch(next);
});

app.post('/listTransactions', checkParams(['jwt']), authenticate, (req, res, next) => {
    db.lrange(`merchants:${req.userId}:txs`, 0, -1)
    .then(txList => {
        const pipey = db.pipeline();
        txList.forEach(tx => {
            pipey.get(`txs:${tx}:status`);
            pipey.get(`txs:${tx}:startTime`);
        });
        pipey.exec()
        // nesting it for easy access to txList
        .then(txData => {
            res.json({
                status: 'success',
                // sometimes i hate this syntax
                txs: txList.map((tx, i) => {
                    return {
                        txId: tx,
                        state: txData[i * 2][1],
                        startTime: txData[i * 2 + 1][1],
                    };
                }),
            });
        });
    })
    .catch(next);
});

app.post('/refundTransaction', checkParams(['jwt', 'txId']), authenticate, (req, res, next) => {
    const keyTx = `txs:${tx}`;
    db.get(`${keyTx}:status`)
    .then(status => {
        if(status !== 'complete') {
            throw {
                code: 400,
                message: 'You may only refund a "complete" transaction',
            };
        }
        return db.set(`${keyTx}:status`, 'refunded');
    })
    .then(() => res.json({
        status: 'success',
    }))
    .catch(next);
});

const paySeller = tx =>
    db.pipeline()
    .get(`txs:${tx}:merchant`)
    .get(`txs:${tx}:requestedAmount`)
    .get('gatewayConfig:fee')
    .exec()
    .then(stuff => {
        const feeReceives = stuff[2][1] / 100 * stuff[1][1];
        const sellerReceives = stuff[1][1] - feeReceives;
        return db.pipeline()
        .set(`txs:${tx}:feeReceived`, feeReceives)
        .set(`txs:${tx}:sellerReceived`, sellerReceives)
        .exec()
        .then(() => db.get(`merchants:${stuff[0][1]}:autoSettle`))
        .then(autoSettle => {
            if(autoSettle === 'true') {
                return request.get(`${config.brokerageHost}/api/brokerage`)
                .then(brokerageRes => remoteDb.hincrbyfloat(`user:${stuff[0][1]}:balances`, 'cad', JSON.parse(brokerageRes).sell * (sellerReceives / 100000000)));
            }
            return remoteDb.hincrbyfloat(`user:${stuff[0][1]}:balances`, 'btc', sellerReceives / 100000000);
        })
    });

const completeTransaction = tx =>
    db.pipeline()
    .set(`txs:${tx}:status`, 'complete')
    .srem('pendingTxs', tx)
    .get(`txs:${tx}:confirmedCallback`)
    .get(`txs:${tx}:merchant`)
    .get(`txs:${tx}:requestedAmount`)
    .exec()
    .then(stuff =>
        // manage payment
        request({
            url: stuff[2][1],
            method: 'POST',
            json: {
                txId: tx,
            }
        })
    )
    .catch(console.log);

app.post('/payWithPrepaid', checkParams(['txId', 'cardNum', 'pin']), (req, res, next) => {
    const keyTx = `txs:${req.body.txId}`;
    db.exists(`${keyTx}:merchant`)
    .then(txExists => {
        if(!txExists) {
            throw {
                code: 404,
                message: 'Transaction does not exist',
            };
        }
        return db.get(`${keyTx}:paidAmount`);
    })
    .then(paidAmount => {
        if(paidAmount > 0) {
            throw {
                code: 400,
                message: 'Already paid',
            };
        }
        // production code
        return db.pipeline()
        .get(`${keyTx}:merchant`)
        .get(`${keyTx}:requestedAmount`)
        .exec()
        .then(txData =>
            // idk why we're doing it like this, too lazy to do it better
            db.get(`merchants:${txData[0][1]}:autoSettle`)
            .then(autoSettle =>
                request({
                    url: `${config.pinVerificationHost}/api/pay`,
                    method: 'POST',
                    json: {
                        uid1: req.body.cardNum,
                        pin: req.body.pin,
                        uid2: txData[0][1],
                        amount: txData[1][1] / 100000000,
                        autoset: autoSettle,
                    },
                })
            )
        )
        .then(pinResponse => {
            switch(pinResponse.code) {
                case 151:
                    return;
                case 152:
                    throw {
                        code: 400,
                        message: 'Invalid code/pin',
                    };
                    break;
                case 153:
                    throw {
                        code: 400,
                        message: 'Insufficient funds',
                    };
                    break;
                default:
                    throw {
                        code: 500,
                        message: `Unrecognized return code from internal pin API: ${pinResponse.code}`,
                    };
            }
        })
    })
    .then(() => db.get(`${keyTx}:requestedAmount`))
    .then(requestedAmount =>
        db.set(`${keyTx}:paidAmount`, requestedAmount)
    )
    .then(() => completeTransaction(req.body.txId))
    .then(() => res.json({
        status: 'success',
    }))
    .catch(next);
});

// error handling
app.use((err, req, res, next) => {
    if(err instanceof Error) {
        console.error(err);
        res.json({
            status: 'error',
            errorMessage: 'Internal error; see console for more details',
        });
    } else {
        res.status(err.code).json({
            status: 'error',
            errorMessage: err.message,
        });
    }
});

app.listen(config.port);

// poll for payment (confirmed callback)
const pollPayments = () => {
    const startTime = Date.now();
    db.smembers('pendingTxs')
    .then(txs => {
        let basePromise = sleep(1)
        txs.forEach(tx => {
            const keyTx = `txs:${tx}`;
            let unconfirmed, confirmed;
            basePromise = basePromise // to be continued...
            .then(() => sleep(config.pollLimit))
            .then(() => db.get(`${keyTx}:address`))
            .then(address => {
                return request.get(`https://${isDev ? 'test-insight' : 'insight'}.bitpay.com/api/addr/${address}`)
                .then(notParsed => {
                    const addrInfo = JSON.parse(notParsed);
                    unconfirmed = addrInfo.balanceSat + addrInfo.unconfirmedBalanceSat;
                    confirmed = addrInfo.balanceSat;
                });
            })
            .then(() => db.get(`${keyTx}:requestedAmount`))
            .then(requestedAmount => {
                if(confirmed >= requestedAmount) {
                    return completeTransaction(tx)
                    .then(() => paySeller(tx));
                }
                if(unconfirmed >= requestedAmount) {
                    return db.set(`${keyTx}:status`, 'unconfirmed');
                }
            })
            .then(() => db.set(`${keyTx}:paidAmount`, unconfirmed));
        });
        return basePromise;
    })
    .then(() => sleep(config.pollFrequency - (Date.now() - startTime)))
    .then(() => pollPayments())
    .catch(console.log);
}

pollPayments();

console.log('Gateway running!');
