'use strict';

/**
 * @ngdoc function
 * @name bowlineApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the bowlineApp
 */
angular.module('bowlineApp')
  .controller('MainCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
