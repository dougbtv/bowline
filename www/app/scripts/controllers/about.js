'use strict';

/**
 * @ngdoc function
 * @name bowlineApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the bowlineApp
 */
angular.module('bowlineApp')
  .controller('AboutCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
