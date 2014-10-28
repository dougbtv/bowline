'use strict';

/**
 * @ngdoc function
 * @name bowlineApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the bowlineApp
 */
angular.module('bowlineApp')
  .controller('docsController', function ($scope) {

  	var REPO = 'dougbtv/bowline';

	Flatdoc.run({
		fetcher: Flatdoc.github(REPO, 'README.md')
	});

	var markdown = {
		"readme": 'README.md',
		"started": 'README.md',
	};

	$scope.mode = "readme";

	$scope.clickDocs = function(mode) {

		$scope.mode = mode;

		Flatdoc.run({
			fetcher: Flatdoc.github(REPO, markdown[mode])
		});

	}

	$scope.docsTab = function(mode) {
		if (mode == $scope.mode) {
			return "active";
		} else {
			return "";
		}
	}

  });
