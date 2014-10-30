/* global bowlineApp, moment, Spinner */

bowlineApp.controller('knotsController', ['$scope', '$location', '$http', 'loginModule', 'releaseModule', 'ENV', function($scope,$location,$http,login,release,ENV) {


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
