/* global bowlineApp, moment, Spinner */

bowlineApp.controller('knotsController', ['$scope', '$location', '$http', 'loginModule', 'releaseModule', '$timeout', 'ENV', function($scope,$location,$http,login,release,$timeout,ENV) {


		$scope.params = $location.search();
		$scope.is_owner = false;

		$scope.form_edit = false;

		$scope.loading = true;

		$scope.methods = [
			'foo',
			'http',
		];

		$scope.selected_method = $scope.methods[0];

		$scope.validator = {};

		release.getReleaseValidator(function(err,validator){
			console.log("!trace validator",validator);
			$scope.validator = validator;
		});

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

		$scope.cancelChanges = function() {
			$scope.loading = true;
			$scope.form_edit = false;
			$scope.getSingleRelease();
		}

		$scope.addMinute = function(minute) {

			// reset input field.
			$scope.enter_minute = "";

			// operate only if non empty.
			if (minute != '') {
				// operate only if minute on the clock
				if (/^([0-5][0-9]|[0-9])$/.test(minute)) {
					// ok, let's push it in the array.
					// dedupe it.
					// and sort it.
					$scope.single.check_minutes.push(parseInt(minute));

					// Now make it unique.
					var uniqueArray = $scope.single.check_minutes.filter(function(item, pos) {
					    return $scope.single.check_minutes.indexOf(item) == pos;
					});

					// And set it.
					$scope.single.check_minutes = uniqueArray;

					// Now sort it.
					$scope.single.check_minutes.sort(function(a, b){return a-b});

				}
			}

		}

		$scope.deleteMinute = function(minute) {

			// Keep everything but this minute.

			var keeper = [];

			for (var i = 0; i < $scope.single.check_minutes.length; i++) {
				if ($scope.single.check_minutes[i] != minute) {
					keeper.push($scope.single.check_minutes[i]);
				}
			}

			$scope.single.check_minutes = keeper;

			// Now sort it.
			$scope.single.check_minutes.sort(function(a, b){return a-b});

		}

		$scope.showCloseMinute = function() {
			return ($scope.is_owner && $scope.form_edit);
		}

		$scope.padZero = function(n) {
		    return (n < 10) ? ("0" + n) : n;
		}

		$scope.enableForm = function() {

			// hack for re-draw
			var keep = $scope.single.check_minutes;
			$scope.single.check_minutes = [];
			$timeout(function(){
				$scope.single.check_minutes = keep;	
			},100);
			
			

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
