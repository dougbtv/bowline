bowlineApp.directive('menu', function(){

	return {
		restrict: 'E',
		scope: {
			// onbehalf: '=onbehalf',
		},
		templateUrl: 'views/menu.html',
		controller: ['$scope','$http','$attrs','$location','ENV', 'loginModule', function ($scope,$http,$attrs,$location,ENV,login) {

			$scope.loggedin = login.status;

			$scope.$on("loginStatus",function(event,status){
				// console.log('hey, loginStatus has changed!', status);
				$scope.loggedin = status;
			});

			$scope.navClass = function (page) {
		
				// Get the route.
				var currentRoute = $location.path().substring(1) || 'home';

				// Set the onPage if it's wrong.
				if (currentRoute != $scope.onPage) {
					$scope.onPage = currentRoute;
				}

				
				return page === currentRoute ? 'active' : '';
			};
			
		}],
	}

})