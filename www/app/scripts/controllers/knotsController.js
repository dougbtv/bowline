bowlineApp.controller('knotsController', ['$scope', '$location', '$http', 'loginModule', 'releaseModule', 'ENV', function($scope,$location,$http,login,release,ENV) {

  	console.log("!trace knots controller");

    $scope.params = $location.search();

    if ($scope.params.details) {

      release.getSingleRelease($scope.params.details,function(err,single){

        if (!err) {

          // Associate a moment with each rel.
          if (single.job.last_check) {
            single.job.check_ago = new moment(single.job.last_check).fromNow();
          }

          $scope.single = single;
          console.log("!trace checking single release: ",single);

        } else {
          $scope.error = err;
        }
        

      });

    } else {

      release.getReleases(function(err,rels){

        if (!err) {

          for (var i = 0; i < rels.length; i++) {
            // Associate a moment with each rel.
            if (rels[i].job.last_check) {
              rels[i].job.check_ago = new moment(rels[i].job.last_check).fromNow();
            }

          }

          $scope.releases = rels;
          console.log("!trace checking releases: ",rels);
        } else {
          $scope.error = err;
        }
        

      });

    }

    // Ok bring up the details link.
    $scope.showDetails = function(id) {
      $location.search('details', id);
    }

}]);
