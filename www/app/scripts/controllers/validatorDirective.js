/* global bowlineApp */
bowlineApp.directive('validator', function(){

	return {
		restrict: 'E',
		scope: {
			variable: '=variable',
			regex: '=regex',
			required: '=required',
		},
		templateUrl: 'views/validator.html',
		controller: ['$scope','$http','$attrs','$location','ENV', 'loginModule', function ($scope,$http,$attrs,$location,ENV,login) {

			$scope.validateIt = function() {
				console.log("!trace validator instantiated: ",$scope.variable);
			};

			$scope.validateIt($scope.variable);

			$scope.$watch('variable',function(newval,oldval){
				console.log("!trace changed to: ",newval);
			});

			
		}],
	};

});