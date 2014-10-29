/* global bowlineApp */
bowlineApp.directive('menu', function(){

	return {
		restrict: 'E',
		scope: {
			// onbehalf: '=onbehalf',
		},
		templateUrl: 'views/menu.html',
		controller: ['$scope','$http','$attrs','$location','ENV', 'loginModule', function ($scope,$http,$attrs,$location,ENV,login) {

			
			
		}],
	};

});