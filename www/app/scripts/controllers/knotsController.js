/* global bowlineApp, moment, Spinner */

bowlineApp.controller('knotsController', ['$scope', '$location', '$http', 'loginModule', 'releaseModule', 'ENV', function($scope,$location,$http,login,release,ENV) {

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
		var target = document.getElementById('spinneroo');
		var spinner = new Spinner(opts).spin(target);

		$scope.params = $location.search();
		$scope.is_owner = false;

		$scope.form_edit = false;

		$scope.loading = true;

		$scope.methods = [
			'foo',
			'http',
		];

		$scope.selected_method = $scope.methods[0];

		$scope.getSingleRelease = function() {

			$scope.is_owner = false;

			release.getSingleRelease($scope.params.details,function(err,single){

				if (!err) {

					$scope.single = single;
					// console.log("!trace checking single release owner: ",single.owner,login.fulluser._id,(single.owner == login.fulluser._id));
					
					// Are we the owner of this release?
					if (single.owner == login.fulluser._id) {
						$scope.is_owner = true;
					}

					// selects are a bummer, let's take the enumerated type of method and make it a reference to method.
					for (var i = 0; i < $scope.methods.length; i++) {
						if ($scope.methods[i] == $scope.single.method) {
							// console.log("!trace HIT THAT METHOD");
							$scope.selected_method = $scope.methods[i];
						}
					}

				} else {
					$scope.error = err;
				}

				$scope.loading = false;
				

			});

		};

		$scope.enableForm = function() {
			$scope.form_edit = true;
		};

		$scope.formEnabled = function() {
			return !$scope.form_edit;
		};

		$scope.validateJob = function(id) {
			$scope.loading = true;
			// console.log("!trace validateJob id: ",id);
			release.validateJob(id,function(err){
				$scope.getSingleRelease();
			});
		};

		$scope.startJob = function(id) {
			$scope.loading = true;
			// console.log("!trace startJob id: ",id);
			release.startJob(id,function(err){
				$scope.getSingleRelease();
			});
		};

		$scope.stopJob = function(id) {
			$scope.loading = true;
			// console.log("!trace stopJob id: ",id);
			release.stopJob(id,function(err){
				$scope.getSingleRelease();
			});
		};

		$scope.ago = function(indate) {
			if (indate) {
				return moment(indate).fromNow();
			} else {
				return "Pending";
			}
			
		};

		// Ok bring up the details link.
		$scope.showDetails = function(id) {
			$location.search('details', id);
		};

		// And instantiate.

		if ($scope.params.details) {

			$scope.getSingleRelease();

		} else {

			release.getReleases(function(err,rels){

				if (!err) {

					$scope.releases = rels;
					// console.log("!trace checking releases: ",rels);
				} else {
					$scope.error = err;
				}
				

			});

		}

}]);
