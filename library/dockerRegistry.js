module.exports = function(bowline, opts, log) {

	// console.log("!trace dockerRegistry instantiated");
	var async = require('async');

	// Create a client to get stuff from the registry.
	var restify = require('restify');
	var client = restify.createJsonClient({
		version: '*',
		// connectTimeout: 500,
		// requestTimeout: 500,
		url: 'http://' + opts.docker_registryurl,
	});


	this.route = function(headers,username,userid,callback) {

		var url = headers['x-original-uri'];
		var method = headers['x-original-method'];

		// console.log("!trace dockerRegistry >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ");
		// console.log("!trace dockerRegistry, headers: ", headers);
		// console.log("!trace dockerRegistry, url: ", url);

		// Ok, so now we have the URL and the method, let's route it accordingly.
		var routes = url.split("/");

		var backref = {
			headers: headers,
			url: url,
			routes: routes
		};


		// does this start with a v1?
		if (/v[0-9]/.test(url)) {
			// First one is bogus, since it starts with a /
			routes.shift();
		}
		
		// console.log("!trace routes??? ",routes);

		var version = routes[0];
		var command = routes[1];

		switch (command) {
			case "repositories":
				var namespace = routes[2];
				var repo_name = routes[3];
				this.repositories(username,userid,method,namespace,repo_name,routes,backref,function(err){
					callback(err);
				});
				break;

			case "images":
				this.images(username,userid,method,routes,backref,function(err){
					callback(err);
				});
				break;

			default:
				log.it("unhandled_route",url);
				callback(null);
				// log.error("docker_unknown_command",headers);
				// callback("unknown route");
				break;

		}
		
	}

	this.images = function(username,userid,method,routes,backref,callback) {

		var imgid = routes[2];
		var command = routes[3];

		if (method == "PUT" && command == "layer") {
			// When we create a new layer, we're going to log this in the database.
			// We'll reference it when we pull tags from the registry later.
			// console.log("!trace -------------- IMAGES PUT: ",backref.url);
			bowline.images.add(imgid,function(err){
				callback(err);
			});

		} else {
			callback(null);
		}

	}

	this.repositories = function(username,userid,method,namespace,repo_name,routes,backref,callback) {

		// Is this an admin?
		// ...we always allow an admin.
		if (username == opts.docker_localuser) {

			// They're good to go.
			callback(null);

		} else {

			// This ain't no good if we don't have this stored as a release.
			// ...you've gotta make that first.
			bowline.release.exists(namespace,repo_name,function(releaseid){

				if (releaseid) {

					// Ok, let's think about the methods
					switch (method) {
						// These are modifications
						case "PUT":
						case "DELETE":
							// See if they're an owner.
							bowline.release.isOwner(userid,releaseid,function(err,isowner){
								if (!err) {
									// That's great.
									callback(null);
								} else {
									callback(err);
								}
							});
							break;

						// These are pulls and queries.
						// Should be available unless repo is private.
						default:
							callback(null);
							break;
					}

				} else {

					callback("Release does not exist, you should create it in the UI first");
					
				}


			});

		}

	}

	// Alright, let's pick up the tags for this release.

	this.getTags = function(releaseid,callback) {

		// First things first, we need the release docker tag.
		bowline.release.getReleases({ _id: releaseid },function(rels){

			if (rels) {
				var docker_tag = rels[0].docker_tag;

				console.log("!trace GOOOD DOCKER TAG: ",docker_tag);

				// curl -X GET http://localhost:5000/v1/repositories/dougbtv/testautobuilder/tags
				client.get('/v1/repositories/' + docker_tag + '/tags', function(err, req, res, data) {

					var rawtags = JSON.parse(res.body);

					// Let's make a list from those rawtags.
					var taglist = [];
					for (var k in rawtags){
						if (rawtags.hasOwnProperty(k)) {
							taglist.push({
								tag: k,
								imageid: rawtags[k]
							});
						}
					}

					// console.log("!trace taglist: ",taglist);

					if (!err) {
						
						log.it("gettags_raw",rawtags);

						// Alright, now, we're going to fix up these tags and associate them with images
						// ...so we can get when they're last updated.
						async.map(taglist,function(tag,callback){

							bowline.images.getLastUpdate(tag.imageid,function(err,lastupdate){
								tag.lastupdate = lastupdate;
								callback(err,tag);
							});

						},function(err,filledtags){

							// log.it("!trace FILLED TAGS: ",{filledtags: filledtags});

							// Now let's sort that by date.
							filledtags.sort(function(a,b){
								if (a.lastupdate < b.lastupdate) { return -1; }
								if (a.lastupdate > b.lastupdate) { return 1; }
								return 0;
							}).reverse();

							// log.it("!trace FILLED SORTED: ",{filledtags: filledtags});


							callback(err,filledtags);

						});
						
						

					} else {
						log.error("dockerregistry_api_gettag",{err: err});
						callback("api_failed");
					}

				});

			} else {
				callback("dockerreg_gettag_failed");
			}
			

		});

	}

}