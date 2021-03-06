<?php  if (!defined('BASEPATH')) exit('No direct script access allowed');

// Errors
$lang['e_required']              = 'Required field';
$lang['e_min_length']            = 'Too short (min %2$s characters)';
$lang['e_max_length']            = 'Too long (max %2$s characters)';
$lang['e_exact_length']          = 'Should be %2$s chars long';
$lang['e_matches']               = 'Mismatch';
$lang['e_invalid']               = 'Invalid';
$lang['e_less_than']             = 'Too high';
$lang['e_greater_than']          = 'Too low';
$lang['e_is_unique']             = 'Already in use';
$lang['e_email_in_use']          = 'Email already in use';
$lang['e_invalid_date']          = 'Invalid Date';
$lang['e_insufficient_balance']  = 'Insufficient %1$s Balance';
$lang['e_appears_to_be_valid']   = 'Appears to be invalid';
$lang['e_your_pin_is_incorrect'] = 'Your PIN is incorrect';
$lang['e_incorrect']             = 'Incorrect';
$lang['e_incorrect_code']        = 'Incorrect code';
$lang['e_incorrect_phone']       = 'Phone number is not valid';
$lang['e_limit_at_sms_token']    = 'Limit does not allow you to add more Sms-tokens';
$lang['e_greaterThan']           = 'Too low';
$lang['e_incorrect_currency']    = 'Incorrect currency: %1$s';
$lang['e_over_daily_limit']      = 'Over the daily limit';
$lang['e_address_in_use']        = 'Address is in use by another user!';
$lang['e_address_invalid']       = 'Address Invalid.';
$lang['e_invalid_voucher_code']  = 'Invalid voucher code';
$lang['e_invalid_captcha']       = 'Invalid Captcha Code';
$lang['e_appears_invalid']       = 'Appears to be invalid';
$lang['e_incorrect_pin']         = 'Incorrect Transaction PIN';
$lang['e_only_digits']           = 'Only digits accepted';
$lang['e_invalid_characters']    = 'Invalid characters detected';
$lang['e_invalid_url']           = 'Invalid url';
$lang['e_invalid_country']       = 'Incorrect country';
$lang['e_invalid_country_no_us'] = 'Incorrect country - Unfortunately we cannot accept United States residents at this time';
$lang['e_incorrect_coupon_code'] = 'Invalid coupon code';
$lang['e_used_expired_coupon_code'] = 'This coupon code has already been used or has expired.';
$lang['e_incorrect_settings_form']  = 'Incorrect settings in the form';

// Labels
$lang['l_amount']                = 'Amount';
$lang['l_current_balance']       = 'Current Balance';
$lang['l_exchange_to']           = 'Exchange To';
$lang['l_exchange_rate']         = 'Exchange Rate';
$lang['l_city']                  = 'City';
$lang['l_country']               = 'Country';
$lang['l_address']               = 'Address';
$lang['l_voucher_code']          = 'Voucher Code';
$lang['l_bank_name']             = 'Bank Name';
$lang['l_bank_address']          = 'Bank Address';
$lang['l_account_number']        = 'Account Number';
$lang['l_branch_transit']        = 'Branch Transit';
$lang['l_name']                  = 'Fullname';
$lang['l_email']                 = 'Email Address';
$lang['l_message']               = 'Message';
$lang['l_captcha']               = 'Captcha (Verification Code)';
$lang['l_location']              = 'Location';
$lang['l_message_other']         = 'Other details';
$lang['l_funding_amount']        = 'Funding Amount';
$lang['l_sender_name']           = 'Sender\'s Fullname';
$lang['l_transaction_pin']       = 'Security PIN';
$lang['l_swift']                 = 'SWIFT Code';
$lang['l_beneficiary']           = 'Beneficiary ';
$lang['l_notes']                 = 'Notes';
$lang['l_financial_institution'] = 'Financial Institution';
$lang['l_card_number']           = 'Card Number';
$lang['l_instructions']          = 'Other Instructions';
$lang['l_postal_address']        = 'Postal Address';
$lang['l_account_name']          = 'Account Name';
$lang['l_holder_address']        = 'Account Holder\'s Address';
$lang['l_interac_email']         = 'Interac E-Transfer Account';
$lang['l_card_holder']           = 'Card Holder Name';
$lang['l_type']                  = 'Type';
$lang['l_type_digital']          = 'Digital';
$lang['l_type_physical']         = 'Physical';
$lang['l_receiver_name']         = 'Receiver\'s Fullname';
$lang['l_receiver_city']         = 'Receiver\'s City';
$lang['l_receiver_country']      = 'Receiver\'s Country';
$lang['l_password']              = 'Password';
$lang['l_new_password']          = 'New Password';
$lang['l_confirm_password']      = 'Confirm Password';
$lang['l_client_id']             = 'Client ID';
$lang['l_date_of_birth']         = 'Date of Birth';
$lang['l_country_of_residence']  = 'Country of residence';
$lang['l_new_password']          = 'New Password';
$lang['l_api_secret']            = 'API Secret';
$lang['l_api_hashseed']          = 'Hash Seed';
$lang['l_api_name']              = 'API Name';
$lang['l_2fa']                   = 'Google Authenticator';

// Placeholders
$lang['p_amount']                = 'Amount';
$lang['p_ripple_address']        = 'e.g. ~yourname or rG6FZ31hDHN1K5Dkbma3PSB5uVCuVVRzfn';
$lang['p_voucher_code']          = 'Voucher Code';
$lang['p_bank_name']             = 'Bank Name';
$lang['p_bank_address']          = 'Bank Full Address including Postcode, City and Country';
$lang['p_address']               = 'Full Address including Postcode, City and Country';
$lang['p_account_number']        = 'Account Number';
$lang['p_branch_transit']        = 'Branch Transit';
$lang['p_amount_min_max']        = 'Min %1$s, Max %2$s';
$lang['p_full_name']             = 'Your full name';
$lang['p_valid_email']           = 'Your email address';
$lang['p_phone_number']          = 'Your phone number including international code';
$lang['p_message']               = 'Your message or any other information';
$lang['p_local_trade_amount']    = 'Amount to purchase or sell';
$lang['p_location']              = 'Location (eg City, Country)';
$lang['p_message_other']         = 'Other relevant details you can think of';
$lang['p_bic_swift']             = 'BIC/SWIFT Code';
$lang['p_specific_instructions'] = 'Any Specific Instructions';
$lang['p_transaction_pin']       = 'Security PIN';
$lang['p_bank_example']          = 'eg. Santander';
$lang['p_receiver_city']         = 'Receiver\'s City';
$lang['p_financial_institution'] = 'Financial Institution or Bank Name';
$lang['p_interac_email']         = 'Your Interac E-Transfer email address';
$lang['p_card_number']           = '16-digit Visa Card Number';
$lang['p_bitcoin_address']       = 'Your Bitcoin Address';
$lang['p_ripple_address']        = 'Your Ripple Address or Name';
$lang['p_old_password']          = 'Current Password';
$lang['p_password']              = 'Password';
$lang['p_confirm_password']      = 'Password Confirmation';
$lang['p_client_id']             = 'Client ID (e.g., 12345)';
$lang['p_exchange_email_addr']   = 'Enter your %1$s Email Address';
$lang['p_exchange_client_id']    = 'Your %1$s Client ID';
$lang['p_api_secret']            = 'API Secret';
$lang['p_api_name']              = 'API Name';