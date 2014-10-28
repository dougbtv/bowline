bowlineApp.controller('knotsController', ['$scope', '$location', '$http', 'loginModule', 'releaseModule', 'ENV', function($scope,$location,$http,login,release,ENV) {

  	console.log("!trace knots controller");

  	release.getReleases(function(err,rels){

  		if (!err) {
  			$scope.releases = rels;
  			console.log("!trace checking releases: ",rels);
  		} else {
  			$scope.error = err;
  		}
  		

  	})

}]);
