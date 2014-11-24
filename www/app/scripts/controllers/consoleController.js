/* global bowlineApp */
'use strict';

/**
 * @ngdoc function
 * @name bowlineApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the bowlineApp
 */
bowlineApp.controller('consoleController', ['$scope', '$location', '$http', 'loginModule', 'ENV', function($scope,$location,$http,login,ENV) {

  	// console.log("!trace console controller");

  	$scope.resetPasswordLink = function() {

  		$http.post(ENV.api_url + '/api/resetPasswordParameters', { session: login.sessionpack })
			.success(function(data){

				// console.log("!trace resetPasswordParameters data",data);
				$location.path('/register');
				$location.search('resetpass',data.resetpass);
				$location.search('email',data.email);
				$location.search('localchange','true');
				
			}.bind(this)).error(function(data){

				console.log("ERROR: Had trouble with resetPasswordParameters from API");

			}.bind(this));

  	};
  	

}]);
