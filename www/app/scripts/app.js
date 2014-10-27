'use strict';

/**
 * @ngdoc overview
 * @name bowlineApp
 * @description
 * # bowlineApp
 *
 * Main module of the application.
 */

 // condorFrontEnd = angular.module('condorFrontEnd', ['ngRoute','ngAnimate','ngCookies','angularFileUpload','google-maps','ui.bootstrap','toggle-switch','pageslide-directive','LocalStorageModule','config']);

var bowlineApp = angular
	.module('bowlineApp', [
		'ngAnimate',
		'ngCookies',
		'ngResource',
		'ngRoute',
		'ngSanitize',
		'ngTouch',
		'config',
		'LocalStorageModule'
	])
	.config(function ($routeProvider,ENV) {
		console.log("!trace env come through? ",ENV);

		$routeProvider
		.when('/', {
			templateUrl: 'views/main.html',
			controller: 'MainCtrl'
		})
		.when('/about', {
			templateUrl: 'views/about.html',
			controller: 'AboutCtrl'
		})
		.when('/login', {
			templateUrl: 'views/login.html',
			controller: 'loginController'
		})
		.otherwise({
			redirectTo: '/'
		});
});
