/* global bowlineApp */
bowlineApp.directive('navbar', function(){

	return {
		restrict: 'E',
		scope: {
			loggedin: '=loggedin',
		},
		templateUrl: 'views/navbar.html',
		controller: ['$scope','$http','$attrs','$location','ENV', 'loginModule', function ($scope,$http,$attrs,$location,ENV,login) {

			// console.log("!trace woot NAVBAR directive.");

			$scope.navClass = function (page) {
	
				// Get the route.
				var currentRoute = $location.path().substring(1) || 'home';

				// Set the onPage if it's wrong.
				if (currentRoute !== $scope.onPage) {
					$scope.onPage = currentRoute;
				}

				
				return page === currentRoute ? 'active' : '';
			};

			// Ok it's been opened.
			$scope.toggledAlerts = function(open) {
				// console.log("!trace opened? ",open);
			}
			
		}],
	};

});