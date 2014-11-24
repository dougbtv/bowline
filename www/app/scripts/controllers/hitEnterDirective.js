/* global bowlineApp, moment, Spinner */
// Great idea from: http://stackoverflow.com/questions/15417125/submit-form-on-pressing-enter-with-angularjs
// Use it like:
/*
	<input type="text" ng-enter="doSomething()">    
*/
bowlineApp.directive('ngEnter', function() {
	return function(scope, element, attrs) {
		element.bind("keydown keypress", function(event) {
			if(event.which === 13) {
				scope.$apply(function(){
					scope.$eval(attrs.ngEnter, {'event': event});
				});

				event.preventDefault();
			}
		});
	};
});