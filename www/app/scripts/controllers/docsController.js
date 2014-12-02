/* global Flatdoc */
/* global bowlineApp */
'use strict';

/**
 * @ngdoc function
 * @name bowlineApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the bowlineApp
 */

bowlineApp.controller('docsController', ['$scope', '$location', '$http', '$routeParams', 'loginModule', 'ENV', function($scope,$location,$http,$routeParams,login,ENV) {


	var REPO = 'dougbtv/bowline';
	$scope.mode = "started";
	var markdown = {
		"started": 'docs/GettingStarted.md',
		"runninglocal": 'docs/RunningLocally.md',
		"usinghooks": 'docs/UsingGitHooks.md',
	};

	if ($routeParams.specificdoc) {
		$scope.mode = $routeParams.specificdoc;
	}

	Flatdoc.run({
		fetcher: Flatdoc.github(REPO, markdown[$scope.mode])
	});

	// This just sets the location, and we let that do the magic, since it will re-instantiate this mother.
	$scope.clickDocs = function(mode) {
		$location.path("/docs/" + mode);
	};

	$scope.docsTab = function(mode) {
		if (mode === $scope.mode) {
			return "active";
		} else {
			return "";
		}
	};

}]);
