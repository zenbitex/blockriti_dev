"use strict";

angular.module("taurus.buysellModule").directive("fileUpload", function () {
return {
    restrict: 'A',
    link: function (scope, elem, attrs) {
        elem.bind('click', function() {
              angular.element(document.querySelector('#' + attrs.chooseFileButton))[0].click();
              });
            }
      };
});