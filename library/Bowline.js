module.exports = function(opts,log,mongoose) {

	// irc disabled during refactor.
	// Now that we're connected to mongo, we can continue along.
	// The Condor object, the meat of our dealings.
	// var IRC = require('./IRC.js');
	// this.irc = new IRC(opts);

	// Our users, for login/management purposes.
	var User = require('./User.js');
	this.user = new User(this,log,opts,mongoose);

	// Defines a "knot"
	var Release = require('./Release.js');
	this.release = new Release(this,opts,log,mongoose);

	var Images = require('./Images.js');
	this.images = new Images(this,opts,log,mongoose);

	var DockerHub = require('./DockerHub.js');
	this.dockerhub = new DockerHub(this,opts,log,mongoose);

	// We include the builder for imports (specifically the manager users this)
	this.Builder = require("./Builder.js");

	// The manager is the master of the builders.
	var Manager = require("./Manager.js"); 
	this.manager = new Manager(this,opts,log);

	// And our dockerRegistry proxy.
	var DockerRegistry = require("./dockerRegistry.js");
	this.dockerRegistry = new DockerRegistry(this,opts,log);

	var RestServer = require("./restServer.js"); 
	this.restserver = new RestServer(this,opts,log);
	this.restserver.serverStart();

	var SocketServer = require("./socketServer.js");
	this.socketserver = new SocketServer(this,opts,log);

	var Messenger = require("./Messenger.js");
	this.messenger = new Messenger(this,opts,log);

	
	/*
	// Connect the irc bot's listener to the builder
	irc.bot.addListener("message", function(from, to, text, message) {
		// Let's handle this command.
		bowline.ircHandler(text,from,message);
	});
	*/

	// We just want to instantiate this once.
	// ...because builders spawn up like crazaaay.
	// so we'll keep this around.

	if (!opts.disable_github) {

		var GitHubApi = require("github");
		this.github = new GitHubApi({
			// required
			version: "3.0.0",
		});

		// OAuth2 Key/Secret
		this.github.authenticate({
			type: "basic",
			username: opts.gituser,
			password: opts.gitpassword
		});

	}


	// We instantiate builders for each specification.
	var moment = require('moment');

}