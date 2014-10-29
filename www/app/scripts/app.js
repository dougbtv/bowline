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
		.when('/docs', {
			templateUrl: 'views/docs.html',
			controller: 'docsController'
		})
		.when('/knots', {
			templateUrl: 'views/knots.html',
			controller: 'knotsController'
		})
		.when('/login', {
			templateUrl: 'views/login.html',
			controller: 'loginController'
		})
		.when('/console', {
			templateUrl: 'views/console.html',
			controller: 'consoleController'
		})
		.when('/register', {
			templateUrl: 'views/register.html',
			controller: 'registerController'
		})
		.otherwise({
			redirectTo: '/'
		});
});


bowlineApp.controller('bowlineMainController', 
	['$scope', '$location', '$http', '$cookies', '$route', '$interval','loginModule', 'ENV', 
	function($scope, $location, $http, $cookies, $route, $interval, login, ENV) {

		$scope.loggedin = login.status;

		$scope.$on("loginStatus",function(event,status){
			// console.log('hey, loginStatus has changed!', status);
			$scope.loggedin = status;
		});

		$scope.navClass = function (page) {
	
			// Get the route.
			var currentRoute = $location.path().substring(1) || 'home';

			// Set the onPage if it's wrong.
			if (currentRoute !== $scope.onPage) {
				$scope.onPage = currentRoute;
			}

			
			return page === currentRoute ? 'active' : '';
		};

		// always validate the session
		login.validateSession(function(){});	

	}]);
