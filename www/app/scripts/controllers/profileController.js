/* global bowlineApp, moment, Spinner, Flatdoc, io, $, lil */

bowlineApp.controller('profileController', 
	['$scope', '$sce', '$location', '$http', '$routeParams', 'loginModule', 'releaseModule', '$timeout', 'ENV', 
	function($scope,$sce,$location,$http,$routeParams,login,release,$timeout,ENV) {

		// console.log("!trace profileController init (routeParams)",$routeParams);

		// Is it edit mode?
		$scope.edit = false;

		// Any errors?
		$scope.error = "";
		$scope.save_error = "";
		$scope.save_success = false;

		// How about that profile?
		$scope.profile = {};


		// virtual constructor, called at bottom.
		this.initializer = function() {

			// Are we requesting a specific user?
			// ...if we are, this is a public view, not an edit.
			$scope.username = "";
			if ($routeParams.username) {
				$scope.username = $routeParams.username;
				$scope.getPublicProfile();
			} else {
				if (login.status) {
					// It's this user.
					$scope.username = login.username;
					$scope.edit = true;
					$scope.getProfile();
				} else {
					$scope.error = "You need to be logged in to do that.";
				}
			}


		};

		$scope.viewProfile = function() {
			$location.path('/profile/' + $scope.username);
		}

		$scope.getPublicProfile = function() {

			$http.post(ENV.api_url + '/api/getPublicProfile', { username: $scope.username, session: login.sessionpack })
				.success(function(profile){

					// console.log("!trace getPublicProfile data",profile);
					$scope.profile = profile;
					
				}.bind(this)).error(function(data){

					console.log("ERROR: Had trouble with getPublicProfile from API");

				}.bind(this));

		};

		$scope.getProfile = function() {

			$http.post(ENV.api_url + '/api/getProfile', { username: $scope.username, session: login.sessionpack })
				.success(function(profile){

					// console.log("!trace getProfile data",profile);
					$scope.profile = profile;
					
				}.bind(this)).error(function(data){

					console.log("ERROR: Had trouble with getProfile from API");

				}.bind(this));

		};

		$scope.saveProfile = function() {

			$http.post(ENV.api_url + '/api/setProfile', { profile: $scope.profile, session: login.sessionpack })
				.success(function(saveresult){

					if (!saveresult.error) {
						
						// That's good.
						$scope.save_success = true;
						$scope.save_error = "";

						$timeout(function(){
							$scope.save_success = false;
						},5000);

					} else {
						$scope.save_error = saveresult.error;
					}
					
				}.bind(this)).error(function(data){

					console.log("ERROR: Had trouble with setProfile from API");

				}.bind(this));

		};

		// and instantiate it.
		this.initializer();

	}
]);
