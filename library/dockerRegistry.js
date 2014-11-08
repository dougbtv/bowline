module.exports = function(log, opts, release) {

	// console.log("!trace dockerRegistry instantiated");

	this.route = function(headers,username,callback) {

		// console.log("!trace dockerRegistry >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ");
		// console.log("!trace dockerRegistry, headers: ", headers);

		var url = headers['x-original-uri'];
		var method = headers['x-original-method'];

		// Ok, so now we have the URL and the method, let's route it accordingly.
		var routes = url.split("/");
		// First one is bogus, since it starts with a /
		routes.shift();

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

		// This ain't no good if we don't have this stored as a release.
		// ...you've gotta make that first.
		release.exists(namespace,repo_name,function(exists){

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