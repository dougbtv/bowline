/* global bowlineApp */
bowlineApp.directive('validator', function(){

	return {
		restrict: 'E',
		scope: {
			variable: '=variable',
			regex: '=regex',
			message: '=message',
			required: '=required',
			emptyok: '=emptyok',
		},
		templateUrl: 'views/validator.html',
		controller: ['$scope','$http','$attrs','$location','ENV', 'loginModule', function ($scope,$http,$attrs,$location,ENV,login) {

			if (typeof $scope.required !== 'undefined') {
				// console.log("!trace is required in validator");
				$scope.required = true;
			}

			$scope.show_required = false;
			$scope.show_failedvalid = false;

			$scope.validateIt = function() {
				if (typeof $scope.variable !== 'undefined') {
					// console.log("!trace validator instantiated: ",$scope.variable);

					if (typeof $scope.variable === 'string') {

						// console.log("!trace variable in: >>%s<<",$scope.variable,$scope.required);

						if ($scope.variable === '' && $scope.required) {
							$scope.show_required = true;
							$scope.show_failedvalid = false;
						} else {

							if ($scope.emptyok && $scope.variable === '') {

								// That's OK.
								$scope.show_required = false;
								$scope.show_failedvalid = false;

							} else {

								$scope.show_required = false;
								if ($scope.regex) {
							
									// It passes if it tests against the provided regex
									var re = new RegExp($scope.regex);
									$scope.show_failedvalid = !(re.test($scope.variable));
									// console.log("!trace show_failedvalid",re.test($scope.variable),$scope.variable,$scope.regex);

								} else {
									// If regex is unset, it can never fail.
									$scope.show_failedvalid = false;
								}

							}

						}
						
					} else {

						// ??? todo?	
					}
					
				} else {
					if ($scope.required) {
						$scope.show_failedvalid = false;
						$scope.show_required = true;
					}
				}
			};

			$scope.$watch('variable',function(newval,oldval){
				$scope.validateIt($scope.variable);
				// console.log("!trace changed to: ",newval);
			});

			
		}],
	};

});