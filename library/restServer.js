module.exports = function(bowline, opts, log) {

	// user, release, manager, dockerRegistry

	// --------------------------------------------------------------------
	// -- myConstructor : Throws the constructor into a method.
	// ...Because javascript wants the methods to be defined before referencing them.

	// So you want to interoperate with Apache?
	// Try a directive like so:
	// ProxyPass /api/ http://localhost:8001/api/

	var fs = require('fs');
	var io = require('socket.io');
	var async = require('async');

	var restify = require('restify');
	var server = restify.createServer();
	server.use(restify.bodyParser());

	// We access this from socketio
	this.server = server;

	this.myConstructor = function() {

		// Set an error handler for the server
		// This helps when there's a deeper error.

		server.on('uncaughtException', function (req, res, route, err) {
			log.error("api_crash",{ stack: err.stack, route: route.spec.path });
			// We wanna see that crash in development
			// console.log("!tracerround API ERROR: ",err.stack);
			// console.log("!trace uncaughtException route: ",route);
			
			res.send(500, err);
			// return next();
		});

		// When a client request is sent for a URL that does not exist, restify will emit this event. 
		// Note that restify checks for listeners on this event, and if there are none, responds with a default 404 handler. 
		// It is expected that if you listen for this event, you respond to the client.
		server.on('NotFound', function (req, res, callback) {

			
			// Always handy if you don't know the URL.
			//console.log("!trace API CALL NOT FOUND, url: ",req.url);

			//console.log("!trace API CALL NOT FOUND, headers: ",req.headers);
			//console.log("!trace API CALL NOT FOUND, method: ",req.method);
			//console.log("!trace API CALL NOT FOUND, input: ",req.params);

			// res.contentType = 'json';
			// res.send({foo: "bar"});

		});


		// Tell the server to send a CORS request.
		// refernce: http://stackoverflow.com/questions/14338683/how-can-i-support-cors-when-using-restify

		server.use(
			function crossOrigin(req,res,next){
				res.header("Access-Control-Allow-Origin", "*");
				res.header("Access-Control-Allow-Headers", "X-Requested-With");
				return next();
			}
		);

		server.use(restify.authorizationParser());

		var endpoints = [
			{ route: '/auth/', 							method: this.dockerAuthProxy },
			// ------------------ Release methods
			{ route: '/api/getReleases', 				method: this.getReleases },
			{ route: '/api/getSingleRelease', 			method: this.getSingleRelease },
			{ route: '/api/getReleaseValidator', 		method: this.getReleaseValidator },
			{ route: '/api/editRelease', 				method: this.editRelease },
			{ route: '/api/addRelease', 				method: this.addRelease },
			{ route: '/api/deleteRelease', 				method: this.deleteRelease },
			{ route: '/api/searchCollaborators', 		method: this.searchCollaborators },
			{ route: '/api/forceUpdate', 				method: this.forceUpdate },
			{ route: '/api/gitHookUpdate/:hook_secret', method: this.gitHookUpdate },
			{ route: '/api/getLogs', 					method: this.getLogs },
			{ route: '/api/getFamily', 					method: this.getFamily },
			{ route: '/api/getTags', 					method: this.getTags },
			{ route: '/api/getLogText', 				method: this.getLogText },
			{ route: '/api/stopJob', 					method: this.stopJob },
			{ route: '/api/startJob', 					method: this.startJob },
			{ route: '/api/validateJob', 				method: this.validateJob },
			{ route: '/api/foo', 						method: this.testFunction },
			// ----------------- Social calls.
			{ route: '/api/getPublicProfile', 			method: this.getPublicProfile },
			{ route: '/api/getProfile', 				method: this.getProfile },
			{ route: '/api/setProfile', 				method: this.setProfile },
			// ----------------- Registration calls.
			{ route: '/api/register', 					method: this.register },
			{ route: '/api/setpassword', 				method: this.setpassword },
			{ route: '/api/forgotpassword', 			method: this.forgotpassword },
			{ route: '/api/resetPasswordParameters', 	method: this.resetPasswordParameters },
			// ----------------- Login & Session calls.
			{ route: '/api/login', 						method: this.userLogin },
			{ route: '/api/validateSession', 			method: this.validateSession },
		];

		endpoints.forEach(function(point){

			server.get(point.route, point.method);
			server.post(point.route, point.method);
			server.head(point.route, point.method);

		}.bind(this));
		
	};

	/*

		-------------- your handy stub!
		this.theStub = function(req, res, next) {

			var input = req.params;

			bowline.user.validateSession(input.session,function(isvalid){

				res.contentType = 'json';

				if (isvalid) {
		
					res.send({});

				} else {

					res.send({error: "Invalid Login"});

				}

			});

		}


	*/

	this.dockerAuthProxy = function(req, res, next) {

		// console.log("!trace dockerProxy >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ");
		// console.log("!trace dockerAuthProxy, headers: ",req.headers);
		// console.log("!trace dockerProxy, url: ",req.url);
		// console.log("!trace dockerProxy, authorization: ",req.authorization);
		// console.log("!trace dockerProxy, method: ",req.method);
		// console.log("!trace dockerProxy, dockermethod: ",req.params.dockermethod);
		// console.log("!trace dockerProxy, input: ",req.params);

		// If no credentials are provided, we must ask for credentials.
		if (!req.authorization.basic) {

			var auth = req.headers['authorization'];
			res.statusCode = 401;
			res.setHeader('WWW-Authenticate', 'Basic realm="Auth Required"');
			res.end('Auth Required');

		} else {

			// If credentials are provided...
			// we need to verify that they're OK.
			bowline.user.authenticate(req.authorization.basic.username,req.authorization.basic.password,false,function(auth){

				if (auth) {
					
					bowline.dockerRegistry.route(req.headers,auth.fulluser.username,auth.fulluser._id,function(err){

						if (!err) {

							// That looks legit.
							res.contentType = 'json';
							res.send({bowline: "is_the_knot"});
		
						} else {

							// Errored, huh, just ask them to auth.
							res.statusCode = 401;
							res.setHeader('WWW-Authenticate', 'Basic realm="Auth Required"');
							res.end('Auth Required');

						}
						
					});

				} else {

					// Nope, no good, login is bad.
					res.statusCode = 401;
					res.setHeader('WWW-Authenticate', 'Basic realm="Auth Required"');
					res.end('Auth Required');

				}

			});

		}

	}

	this.searchCollaborators = function(req, res, next) {

		var input = req.params;

		bowline.user.validateSession(input.session,function(validpack){
			if (validpack.isvalid) {

				bowline.user.searchCollaborators(input.search,function(err,users){
					res.contentType = 'json';
					if (err) {
						res.send({error: err});
					} else {
						res.send(users);
					}
				});

			} else {
				callback(false);
				res.send({error: "Invalid credentials"});
			}
		});
	}

	this.ownsRelease = function(releaseid,session,res,callback) {

		bowline.user.validateSession(session,function(validpack){

			if (validpack.isvalid) {

				bowline.release.isOwner(validpack.fulluser._id,releaseid,function(err,owner){
					callback(owner);
					if (!owner) {
						res.send({error: "Invalid credentials, tisk tsk [attempt logged]"});
					}
				});

			} else {
				callback(false);
				res.send({error: "Invalid credentials"});
			}

		});
	}

	this.addRelease = function(req, res, next) {

		var input = req.params;

		bowline.user.validateSession(input.session,function(validpack){
			if (validpack.isvalid) {
				bowline.release.addRelease(input.release,validpack.fulluser._id,function(err,releaseid){
					// console.log("!trace ADD RELEASE??? ",releaseid);
					res.contentType = 'json';
					if (err) {
						res.send({error: err});
					} else {
						res.send({releaseid: releaseid});
					}
					
				});
			}
		});

	}.bind(this);

	this.editRelease = function(req, res, next) {

		var input = req.params;

		this.ownsRelease(input.release._id,input.session,res,function(releaseowner){
			if (releaseowner) {
				bowline.release.editRelease(input.release,function(err,releaseid){
					// console.log("!trace RETURN editRelease: ",err,releaseid);
					res.contentType = 'json';
					if (err) {
						res.send({error: err});
					} else {
						res.send({releaseid: releaseid});
					}
					
				});
			}
		});

	}.bind(this);

	this.deleteRelease = function(req, res, next) {

		var input = req.params;

		this.ownsRelease(input.releaseid,input.session,res,function(releaseowner){
			if (releaseowner) {
				bowline.release.deleteRelease(input.releaseid,function(err){
					res.contentType = 'json';
					if (err) {
						res.send({error: err});
					} else {
						// console.log("!trace RETURN RELEASEID: ",releaseid);
						res.send({});
					}
					
				});
			}
		});

	}.bind(this);
	
	this.getReleaseValidator = function(req, res, next) {

		var input = req.params;

		bowline.release.getValidator(function(validator){
			res.contentType = 'json';
			res.send(validator);
		});

	}

	this.validateJob = function(req, res, next) {

		var input = req.params;

		this.ownsRelease(input.id,input.session,res,function(jobowner){
			if (jobowner) {
				bowline.manager.validateJob(input.id,function(err,validated){
					res.contentType = 'json';
					if (err) {
						res.send({error: err});
					} else {
						res.send({validated: validated});
					}
					
				});
			}
		});

	}.bind(this);

	this.startJob = function(req, res, next) {

		var input = req.params;

		this.ownsRelease(input.id,input.session,res,function(jobowner){
			if (jobowner) {
				bowline.manager.startJob(input.id,function(err){
					// console.log("!trace START JOB IS BACK");
					res.contentType = 'json';
					res.send({});
				});
			}
		});

	}.bind(this);

	this.gitHookUpdate = function(req, res, next) {

		log.it("git_hook_update",req.params);

		var input = req.params;

		bowline.manager.updateByHook(input.hook_secret,function(err){
			res.contentType = 'json';
			if (!err) {
				res.send({});
			} else {
				res.send({error: err});
			}
		});

	}.bind(this);

	this.forceUpdate = function(req, res, next) {

		var input = req.params;

		this.ownsRelease(input.id,input.session,res,function(jobowner){
			if (jobowner) {
				bowline.manager.forceUpdate(input.id,function(err){
					res.contentType = 'json';
					res.send({});
				});
			}
		});

	}.bind(this);

	this.getLogText = function(req, res, next) {

		var input = req.params;

		this.ownsRelease(input.releaseid,input.session,res,function(jobowner){
			if (jobowner) {
				bowline.release.getLogText(input.releaseid,input.logid,function(err,logtext){
					res.contentType = 'json';
					res.send({log: logtext});
				});
			}
		});

	}.bind(this);

	this.getTags = function(req, res, next) {

		var input = req.params;

		bowline.user.validateSession(input.session,function(validpack){
			if (validpack.isvalid) {
				bowline.dockerRegistry.getTags(input.releaseid,function(err,tags){
					res.contentType = 'json';
					res.send(tags);
				});
			} else {
				res.contentType = 'json';
				res.send({error: "invalid creds"});
			}
		});

	}.bind(this);

	this.getFamily = function(req, res, next) {

		var input = req.params;

		bowline.release.getFamily(input.id,function(err,family){
			res.contentType = 'json';
			res.send(family);
		});

	}.bind(this);

	this.getLogs = function(req, res, next) {

		var input = req.params;

		this.ownsRelease(input.id,input.session,res,function(jobowner){
			if (jobowner) {
				bowline.release.getLogs(input.id,input.startpos,input.endpos,function(err,logs){
					res.contentType = 'json';
					res.send(logs);
				});
			}
		});

	}.bind(this);


	this.stopJob = function(req, res, next) {

		var input = req.params;

		this.ownsRelease(input.id,input.session,res,function(jobowner){
			if (jobowner) {
				bowline.manager.stopJob(input.id,function(err){
					res.contentType = 'json';
					res.send({});
				});
			}
		});

	}.bind(this);

	this.getReleases = function(req, res, next) {

		var input = req.params;

		// console.log("!trace getReleases input: ",input);

		var userid = null;

		async.series({

			check_session: function(callback){
				// If it's for mine only...
				// That overrides all.
				if (input.session && input.mineonly) {
					bowline.user.validateSession(input.session,function(validpack){
						if (validpack.isvalid) {
							userid = validpack.fulluser._id;
						}
						callback(null);
					});
				} else {
					// Do we have a specific username set?
					if (input.username) {
						// That's great, let's pick up their id.
						// we can do it via public profile?
						// TODO: This doesn't account for privacy (as with a lot)
						bowline.user.existsUsername(input.username,function(exists){
							// Exists, great!
							// Doesn't exist? doesn't matter. just show public.
							if (exists) {
								userid = exists;
							}
							callback(null);
						});
					} else {
						// Finally, it can be the public list.
						callback(null);
					}
				}
			}

		},function(err,result){

			bowline.release.getReleaseList(userid,input.search,function(rels){
				// console.log("!trace getReleaseList: ",rels);
				res.contentType = 'json';
				res.send(rels);
			});

		});

	}

	this.getSingleRelease = function(req, res, next) {

		var input = req.params;

		if (input.session) {
			
			bowline.user.validateSession(input.session,function(validpack){

				bowline.release.isOwner(validpack.fulluser._id,input.id,function(err,owner){

					bowline.release.getReleases(owner,{_id: input.id},function(rels){
						// log.it("restserver_debug_singlerelease",{release: rels[0]});
						res.contentType = 'json';
						res.send(rels[0]);
					});

				});

			});

		} else {

			bowline.release.getReleases(false,{_id: input.id},function(rels){
				// console.log("!trace rels from single release",rels);
				res.contentType = 'json';
				res.send(rels[0]);
			});
			
		}


	}

	this.validateSession = function(req, res, next) {

		var input = req.params;

		bowline.user.validateSession(input.session,function(validpack){

			res.contentType = 'json';
			res.send({valid: validpack.isvalid, fulluser: validpack.fulluser});

		});


	}

	this.getPublicProfile = function(req, res, next) {

		var input = req.params;

		bowline.user.getPublicProfile(input.username,function(err,profile){
			res.send(profile);
		});
		
	}

	this.getProfile = function(req, res, next) {

		var input = req.params;

		bowline.user.validateSession(input.session,function(validpack){
			res.contentType = 'json';
			if (validpack.isvalid) {
				bowline.user.getProfile(validpack.fulluser._id,function(err,profile){
					res.send(profile);
				});
			} else {
				res.send({error: "invalid login"});
			}
		});

	}

	this.setProfile = function(req, res, next) {

		var input = req.params;

		bowline.user.validateSession(input.session,function(validpack){
			res.contentType = 'json';
			if (validpack.isvalid) {
				bowline.user.setProfile(validpack.fulluser._id,input.profile,function(err){
					var result = {};
					if (err) {
						result.error = err;
					}
					res.send(result);
				});
			} else {
				res.send({error: "invalid login"});
			}
		});

	}



	this.userLogin = function(req, res, next) {

		var input = req.params;

		// log.trace("user login params: ",input);

		// Now check it with the user module.
		bowline.user.authenticate(input.email,input.password,true,function(auth){

			res.contentType = 'json';

			if (auth) {

				// Great, send it back to 'em.
				res.send({session: auth.sessionid, fulluser: auth.fulluser});


			} else {

				// That failed.
				res.send({session: auth, failed: true});

			}


		});

	}



	this.setpassword = function(req, res, next) {

		var input = req.params;

		// Ok, make a request to the user object.
		bowline.user.setPassword(input.email.trim(),input.password,input.resetkey,function(auth){

			res.contentType = 'json';
			res.send(auth);

		});

	}

	this.resetPasswordParameters = function(req, res, next) {

		var input = req.params;

		bowline.user.validateSession(input.session,function(validpack){
			res.contentType = 'json';
			if (validpack.isvalid) {
				bowline.user.getPasswordResetURL(validpack.fulluser._id,function(err,params){
					res.send(params);
				});
			} else {
				res.send({error: "invalid login"});
			}
		});

	}

	this.forgotpassword = function(req, res, next) {

		var input = req.params;

		// Ok, make a request to the user object.
		bowline.user.forgotPassword(input.email.trim(),function(err){

			var sendjson = {};

			// Ship an error if we have one.
			if (err) {
				sendjson = {error: err};			
			}

			res.contentType = 'json';
			res.send(sendjson);

		});

	}

	this.register = function(req, res, next) {

		var input = req.params;

		// Ok, make a request to the user object.
		bowline.user.registerUser(
			input.user.email.trim(),
			input.user.username.trim(),
			function(err,resetdata){

			var sendjson = {};

			// Ship an error if we have one.
			if (err) {
				sendjson = {error: err};				
			}

			if (resetdata) {
				sendjson.resetkey = resetdata.resetkey;
				sendjson.email = resetdata.email;
			}

			res.contentType = 'json';
			res.send(sendjson);

		});

	}

	this.serverStart = function() {

		// And then fire up the server.
		server.listen(opts.SERVER_PORT, function() {
			log.it(server.name + ' listening at ' + server.url);
		});

	}

	this.testFunction = function(req, res, next) {

		// console.log(req.params);

		log.it("test log: ",req.params);

		var return_json = [
			{text: "this and that"},
			{text: "the other thing"},
			{text: "final"}
		];
		
		// Return a JSON result.
		res.contentType = 'json';
		res.send(return_json);

	}.bind(this);

	// Call the constructor (after defining all of the above.)

	this.myConstructor();

	
}