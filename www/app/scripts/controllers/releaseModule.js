function releaseModule($rootScope,$http,$timeout,login,ENV) {

	console.log("!trace releaseModule instantiated, login status: ",login.status);

	// This just gets all releases.
	this.getReleases = function(callback) {

		$http.post(ENV.api_url + '/api/getReleases', { session: login.sessionpack })
			.success(function(data){

				// console.log("!trace getReleases data",data);
				callback(null,data);

			}.bind(this)).error(function(data){

				callback("Had trouble with getReleases from API");

			}.bind(this));

	}

	// This just gets all releases.
	this.getSingleRelease = function(id,callback) {

		$http.post(ENV.api_url + '/api/getSingleRelease', { id: id, session: login.sessionpack })
			.success(function(data){

				console.log("!trace getReleases data",data);
				callback(null,data);

			}.bind(this)).error(function(data){

				callback("Had trouble with getSingleRelease from API");

			}.bind(this));

	}

}

bowlineApp.factory('releaseModule', ["$rootScope", "$http", "$timeout", 'loginModule', 'ENV', function($rootScope,$http,$timeout,login,ENV) {
	return new releaseModule($rootScope,$http,$timeout,login,ENV);
}]);