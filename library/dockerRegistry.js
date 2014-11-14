module.exports = function(bowline, opts, log) {

	// console.log("!trace dockerRegistry instantiated");

	this.route = function(headers,username,callback) {

		var url = headers['x-original-uri'];
		var method = headers['x-original-method'];

		// console.log("!trace dockerRegistry >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ");
		// console.log("!trace dockerRegistry, headers: ", headers);
		// console.log("!trace dockerRegistry, url: ", url);


		// Ok, so now we have the URL and the method, let's route it accordingly.
		var routes = url.split("/");

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
				this.repositories(username,method,namespace,repo_name,function(err){
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

	this.repositories = function(username,method,namespace,repo_name,callback) {

		// Is this an admin?
		// ...we always allow an admin.
		if (username == opts.docker_localuser) {

			// They're good to go.
			callback(null);

		} else {

			// This ain't no good if we don't have this stored as a release.
			// ...you've gotta make that first.
			bowline.release.exists(namespace,repo_name,function(exists){

				if (exists) {

					// Ok, let's think about the methods
					switch (method) {
						// These are modifications
						case "DELETE":
						case "PUT":
							if (username == namespace) {
								// That's great.
								callback(null);
							} else {
								callback("User not authorized for method of repositories");
							}
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

}