/* global bowlineApp, moment, Spinner, Flatdoc, jQuery */

// Thank you kindly to: http://www.yearofmoo.com/2013/08/remastered-animation-in-angularjs-1-2.html
// just add class "getfaded" to any element for ng-show / ng-hide

bowlineApp.animation('.getfaded', function() {
	return {
		beforeAddClass : function(element, className, done) {
			if(className == 'ng-hide') {
				jQuery(element).animate({
					opacity:0
				}, done);
			}
			else {
				done();
			}
		},
		removeClass : function(element, className, done) {
			if(className == 'ng-hide') {
				element.css('opacity',0);
				jQuery(element).animate({
					opacity:1
				}, done);
			}
			else {
				done();
			}
		}
	};
});