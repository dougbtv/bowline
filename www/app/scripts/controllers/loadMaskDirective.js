/* global bowlineApp */
/* global moment */

bowlineApp.directive('loadMask', function () {
		return {
		restrict: 'A',
		replace: true,
		transclude: true,
		scope: {
			loaded: '=loadMask'
		},
		templateUrl: 'views/loadMask.html',
		controller: function($scope, $element, $attrs, $timeout) {

			var MINIMUM_SPINNER_TIME_MS = 250;

			$scope.show_it = false;

			var started = 0;
			var ended = 0;

			$scope.$watch('loaded',function(before,after){
				// console.log("!trace loaded watch: %s | millis: %s",$scope.loaded,);
				if ($scope.loaded) {
					// Check it's time.
					ended = moment().valueOf();
					if (ended - started >= MINIMUM_SPINNER_TIME_MS) {
						// We can show it.
						$scope.show_it = true;
					} else {
						// Ok, what's left?
						var left = MINIMUM_SPINNER_TIME_MS - (ended - started);
						$timeout(function(){
							$scope.show_it = true;		
						},left);
					}
				} else {
					// Ok, it's not loaded yet, let's figure when we started.
					started = moment().valueOf();
				}
			});

			/*

				// Ahhh too bad, spin.js gave me fits. Went back to a spinner gif.

				var spinner_opts = {
					lines: 13, // The number of lines to draw
					length: 20, // The length of each line
					width: 5, // The line thickness
					radius: 10, // The radius of the inner circle
					corners: 0, // Corner roundness (0..1)
					rotate: 0, // The rotation offset
					direction: 1, // 1: clockwise, -1: counterclockwise
					color: '#3beb7e', // #rgb or #rrggbb or array of colors
					speed: 1, // Rounds per second
					trail: 60, // Afterglow percentage
					shadow: false, // Whether to render a shadow
					hwaccel: false, // Whether to use hardware acceleration
					className: 'spinner', // The CSS class to assign to the spinner
					zIndex: 2e9, // The z-index (defaults to 2000000000)
					top: '33%', // Top position relative to parent
					left: '50%' // Left position relative to parent
				};
			
				var spinner = new Spinner(spinner_opts).spin();
				var loadingContainer = angular.element.find('.my-loading-spinner-container')[0];
				loadingContainer.appendChild(spinner.el);
			*/

		}
	};
});