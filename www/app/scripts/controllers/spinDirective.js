/* global bowlineApp, Spinner */

// Rather nice article:
// http://ankursethi.in/2013/07/loading-spinners-with-angularjs-and-spin-js/

bowlineApp.directive('spinner', function() {
	return {
		restrict: 'A',
		replace: true,
		transclude: true,
		scope: {
			loading: '=spinner'
		},
		template: '<div style="position: relative;"><div ng-show="loading" class="my-loading-spinner-container" style="margin-top: 8px;"></div><div ng-hide="loading" ng-transclude></div></div>',
		
		link: function(scope, element, attrs) {

			var opts = {
			  lines: 11, // The number of lines to draw
			  length: 2, // The length of each line
			  width: 3, // The line thickness
			  corners: 1, // Corner roundness (0..1)
			  radius: 6, // The radius of the inner circle
			  rotate: 0, // The rotation offset
			  direction: 1, // 1: clockwise, -1: counterclockwise
			  color: '#000', // #rgb or #rrggbb or array of colors
			  speed: 0.8, // Rounds per second
			  trail: 40, // Afterglow percentage
			  shadow: false, // Whether to render a shadow
			  hwaccel: false, // Whether to use hardware acceleration
			  className: 'spinner', // The CSS class to assign to the spinner
			  zIndex: 2e9, // The z-index (defaults to 2000000000)
			  top: '50%', // Top position relative to parent
			  left: '50%' // Left position relative to parent
			};

			var spinner = new Spinner(opts).spin();
			var loadingContainer = element.find('.my-loading-spinner-container')[0];
			loadingContainer.appendChild(spinner.el);
		}
		
	};
});