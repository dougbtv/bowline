/* global bowlineApp */
function releaseModule($rootScope,$http,$timeout,login,ENV) {

	console.log("!trace releaseModule instantiated, login status: ",login.status);

	this.validator = {};

	// This just gets all releases.
	this.getReleases = function(mine,username,search,callback) {

		var loginpack = {};
		if (login.status) {
			loginpack = login.sessionpack;
		}

		$http.post(ENV.api_url + '/api/getReleases', { session: loginpack, username: username, mineonly: mine, search: search })
			.success(function(data){

				// console.log("!trace getReleases data",data);
				callback(null,data);

			}.bind(this)).error(function(data){

				callback("Had trouble with getReleases from API");

			}.bind(this));

	};

	this.editRelease = function(release,add_release,callback) {

		if (add_release) {

			$http.post(ENV.api_url + '/api/addRelease', { release: release, session: login.sessionpack })
				.success(function(addresult){

					// console.log("!trace addRelease data",release);
					callback(addresult.error,addresult.releaseid);

				}.bind(this)).error(function(data){

					callback("Had trouble with addRelease from API");

				}.bind(this));

		} else {

			$http.post(ENV.api_url + '/api/editRelease', { release: release, session: login.sessionpack })
				.success(function(release){

					// console.log("!trace editRelease data",release);
					callback(release.error,release.releaseid);

				}.bind(this)).error(function(data){

					callback("Had trouble with editRelease from API");

				}.bind(this));

		}

	};

	this.searchCollaborators = function(searchstring,callback) {

		$http.post(ENV.api_url + '/api/searchCollaborators', { session: login.sessionpack, search: searchstring })
			.success(function(users){

				// console.log("!trace searchCollaborators release",release);
				callback(null,users);

			}.bind(this)).error(function(data){

				callback("Had trouble with searchCollaborators from API");

			}.bind(this));

	};

	// This just gets all releases.
	this.getSingleRelease = function(id,callback) {

		$http.post(ENV.api_url + '/api/getSingleRelease', { id: id, session: login.sessionpack })
			.success(function(release){

				// console.log("!trace getReleases release",release);
				callback(null,release);

			}.bind(this)).error(function(data){

				callback("Had trouble with getSingleRelease from API");

			}.bind(this));

	};

	// Get the tags for a release.
	this.getTags = function(id,callback) {

		$http.post(ENV.api_url + '/api/getTags', { releaseid: id, session: login.sessionpack })
			.success(function(tags){

				console.log("!trace getTags tags",tags);
				callback(null,tags);

			}.bind(this)).error(function(data){

				callback("Had trouble with getTags from API");

			}.bind(this));

	};

	// Get the validator for releases.
	this.getReleaseValidator = function(callback) {

		$http.post(ENV.api_url + '/api/getReleaseValidator', { session: login.sessionpack })
			.success(function(data){

				// console.log("!trace getReleaseValidator data",data);
				callback(null,data);

				this.validator = data;

			}.bind(this)).error(function(data){

				callback("Had trouble with getReleaseValidator from API");

			}.bind(this));

	};

	this.forceUpdate = function(id,callback) {

		$http.post(ENV.api_url + '/api/forceUpdate', { id: id, session: login.sessionpack })
			.success(function(data){

				var err = null;
				if (data.error) {
					err = data.error;
				}

				// console.log("!trace forceUpdate data",data);
				callback(err,data);

			}.bind(this)).error(function(data){

				callback("Had trouble with forceUpdate from API");

			}.bind(this));

	};

	this.getLogText = function(releaseid,logid,callback) {

		$http.post(ENV.api_url + '/api/getLogText', { releaseid: releaseid, logid: logid, session: login.sessionpack })
			.success(function(data){

				var err = null;
				if (data.error) {
					err = data.error;
				}

				// console.log("!trace getLogText data",data);
				callback(err,data.log);

			}.bind(this)).error(function(data){

				callback("Had trouble with getLogText from API");

			}.bind(this));

	};

	this.getLogs = function(id,startpos,endpos,callback){

		$http.post(ENV.api_url + '/api/getLogs', { id: id, session: login.sessionpack, startpos: startpos, endpos: endpos })
			.success(function(data){

				var err = null;
				if (data.error) {
					err = data.error;
				}

				// console.log("!trace getLogs data",data);
				callback(err,data);

			}.bind(this)).error(function(data){

				callback("Had trouble with getLogs from API");

			}.bind(this));

	};

	this.getFamily = function(id,callback){

		$http.post(ENV.api_url + '/api/getFamily', { id: id, session: login.sessionpack })
			.success(function(data){

				var err = null;
				if (data.error) {
					err = data.error;
				}

				// console.log("!trace getFamily data",data);
				callback(err,data);

			}.bind(this)).error(function(data){

				callback("Had trouble with getFamily from API");

			}.bind(this));

	};

	this.validateJob = function(id,callback){

		$http.post(ENV.api_url + '/api/validateJob', { id: id, session: login.sessionpack })
			.success(function(data){

				var err = null;
				if (data.error) {
					err = data.error;
				}

				// console.log("!trace validateJob data",data);
				callback(err,data);

			}.bind(this)).error(function(data){

				callback("Had trouble with validateJob from API");

			}.bind(this));

	};

	this.startJob = function(id,callback){

		$http.post(ENV.api_url + '/api/startJob', { id: id, session: login.sessionpack })
			.success(function(data){

				var err = null;
				if (data.error) {
					err = data.error;
				}

				// console.log("!trace startJob data",data);
				callback(err,data);

			}.bind(this)).error(function(data){

				callback("Had trouble with startJob from API");

			}.bind(this));

	};

	this.stopJob = function(id,callback){

		$http.post(ENV.api_url + '/api/stopJob', { id: id, session: login.sessionpack })
			.success(function(data){

				var err = null;
				if (data.error) {
					err = data.error;
				}

				// console.log("!trace stopJob data",data);
				callback(err,data);

			}.bind(this)).error(function(data){

				callback("Had trouble with stopJob from API");

			}.bind(this));

	};

}

bowlineApp.factory('releaseModule', ["$rootScope", "$http", "$timeout", 'loginModule', 'ENV', function($rootScope,$http,$timeout,login,ENV) {
	return new releaseModule($rootScope,$http,$timeout,login,ENV);
}]);