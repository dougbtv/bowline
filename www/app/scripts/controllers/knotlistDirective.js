bowlineApp.directive('knotlist', function(){

	return {
		restrict: 'E',
		scope: {
			mine: '=mine',
			username: '=username',
		},
		templateUrl: 'views/knotlist.html',
		controller: ['$scope','$http','$attrs','$location','ENV', 'loginModule', 'releaseModule', function ($scope,$http,$attrs,$location,ENV,login,release) {

			// console.log("!trace knotlist init");

			// Ok bring up the details link.
			$scope.showDetails = function(id) {
				$location.search('add', null);
				$location.search('details', id);
			};

			$scope.getReleases = function() {
				release.getReleases($scope.mine,$scope.username,$scope.knot_search,function(err,rels){
					if (!err) {
						$scope.releases = rels;
						// console.log("!trace checking releases: ",rels);
					} else {
						$scope.error = err;
					}
				});
			};

			$scope.knotSearchFilter = function() {
				// If it's long enough, or if it's empty, kick off a search
				if ($scope.knot_search.length >= 3 || $scope.knot_search === "") {
					$scope.getReleases();
				}
			};

			$scope.ago = function(indate) {
				if (indate) {
					return moment(indate).fromNow();
				} else {
					return "Pending";
				}	
			};

			$scope.getReleases();

		}]
	}
});