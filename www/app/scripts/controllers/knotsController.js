bowlineApp.controller('knotsController', ['$scope', '$location', '$http', 'loginModule', 'releaseModule', 'ENV', function($scope,$location,$http,login,release,ENV) {

  	$scope.params = $location.search();

    if ($scope.params.details) {

      $scope.is_owner = false;

      release.getSingleRelease($scope.params.details,function(err,single){

        if (!err) {

          $scope.single = single;
          // console.log("!trace checking single release owner: ",single.owner,login.fulluser._id,(single.owner == login.fulluser._id));
          
          if (single.owner == login.fulluser._id) {
            $scope.is_owner = true;
          }

        } else {
          $scope.error = err;
        }
        

      });

    } else {

      release.getReleases(function(err,rels){

        if (!err) {

          $scope.releases = rels;
          console.log("!trace checking releases: ",rels);
        } else {
          $scope.error = err;
        }
        

      });

    }

    $scope.ago = function(indate) {
      if (indate) {
        return new moment(indate).fromNow();
      } else {
        return "Never";
      }
      
    }

    // Ok bring up the details link.
    $scope.showDetails = function(id) {
      $location.search('details', id);
    }

}]);
