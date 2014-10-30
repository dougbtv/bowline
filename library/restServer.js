module.exports = function(log, opts, bowline, user, release, manager) {

	// --------------------------------------------------------------------
	// -- myConstructor : Throws the constructor into a method.
	// ...Because javascript wants the methods to be defined before referencing them.

	// So you want to interoperate with Apache?
	// Try a directive like so:
	// ProxyPass /api/ http://localhost:8001/api/

	var fs = require('fs');

	var restify = require('restify');
	var server = restify.createServer();
	server.use(restify.bodyParser());
	
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

		// Tell the server to send a CORS request.
		// refernce: http://stackoverflow.com/questions/14338683/how-can-i-support-cors-when-using-restify

		server.use(
			function crossOrigin(req,res,next){
				res.header("Access-Control-Allow-Origin", "*");
				res.header("Access-Control-Allow-Headers", "X-Requested-With");
				return next();
			}
		);

		// Release methods
		
		server.get('/api/getReleases', this.getReleases);
		server.post('/api/getReleases', this.getReleases);
		server.head('/api/getReleases', this.getReleases);

		server.get('/api/getSingleRelease', this.getSingleRelease);
		server.post('/api/getSingleRelease', this.getSingleRelease);
		server.head('/api/getSingleRelease', this.getSingleRelease);

		server.get('/api/stopJob', this.stopJob);
		server.post('/api/stopJob', this.stopJob);
		server.head('/api/stopJob', this.stopJob);



		// infamous test method.

		server.get('/api/foo', this.testFunction);
		server.post('/api/foo', this.testFunction);
		server.head('/api/foo', this.testFunction);

		// ----------------- Registration calls.

		server.get('/api/register', this.register);
		server.post('/api/register', this.register);
		server.head('/api/register', this.register);

		server.get('/api/setpassword', this.setpassword);
		server.post('/api/setpassword', this.setpassword);
		server.head('/api/setpassword', this.setpassword);

		server.get('/api/forgotpassword', this.forgotpassword);
		server.post('/api/forgotpassword', this.forgotpassword);
		server.head('/api/forgotpassword', this.forgotpassword);

		// -------------------- Login & Session calls.

		server.get('/api/login', this.userLogin);
		server.post('/api/login', this.userLogin);
		server.head('/api/login', this.userLogin);

		server.get('/api/validateSession', this.validateSession);
		server.post('/api/validateSession', this.validateSession);
		server.head('/api/validateSession', this.validateSession);
		
	};

	/*

		-------------- your handy stub!
		this.theStub = function(req, res, next) {

			var input = req.params;

			user.validateSession(input.session,function(isvalid){

				res.contentType = 'json';

				if (isvalid) {
		
					res.send({});

				} else {

					res.send({error: "Invalid Login"});

				}

			});

		}


	*/

	this.isJobOwner = function(releaseid,session,res,callback) {

		user.validateSession(session,function(validpack){

			if (validpack.isvalid) {

				release.isOwner(validpack.fulluser._id,releaseid,function(err,owner){
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

	this.validateJob = function(req, res, next) {

		var input = req.params;

		this.isJobOwner(input.id,input.session,res,function(jobowner){
			if (jobowner) {
				manager.validateJob(input.id,function(err,validated){
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

	this.stopJob = function(req, res, next) {

		var input = req.params;

		this.isJobOwner(input.id,input.session,res,function(jobowner){
			if (jobowner) {
				manager.stopJob(input.id,function(err){
					res.contentType = 'json';
					res.send({});
				});
			}
		});

	}.bind(this);

	this.getReleases = function(req, res, next) {

		var input = req.params;

		release.getReleases(false,function(rels){
			res.contentType = 'json';
			res.send(rels);
		});

	}

	this.getSingleRelease = function(req, res, next) {

		var input = req.params;

		release.getReleases({_id: input.id},function(rels){
			res.contentType = 'json';
			res.send(rels[0]);
		});

	}

	this.validateSession = function(req, res, next) {

		var input = req.params;

		user.validateSession(input.session,function(validpack){

			res.contentType = 'json';
			res.send({valid: validpack.isvalid, fulluser: validpack.fulluser});

		});


	}

	this.userLogin = function(req, res, next) {

		var input = req.params;

		// log.trace("user login params: ",input);

		// Now check it with the user module.
		user.authenticate(input.email,input.password,function(auth){

			res.contentType = 'json';

			if (auth) {

				// Great, send it back to 'em.
				res.send({session: auth.sessionid, fulluser: auth.fulluser});


			} else {

				// That failed.
				res.send({session: auth});

			}


		});

	}



	this.setpassword = function(req, res, next) {

		var input = req.params;

		// Ok, make a request to the user object.
		user.setPassword(input.email.trim(),input.password,input.resetkey,function(auth){

			res.contentType = 'json';
			res.send(auth);

		});

	}

	this.forgotpassword = function(req, res, next) {

		var input = req.params;

		// Ok, make a request to the user object.
		user.forgotPassword(input.email.trim(),function(err){

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
		user.registerUser(
			input.user.email.trim(),
			function(err){

			var sendjson = {};

			// Ship an error if we have one.
			if (err) {
				sendjson = {error: err};				
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