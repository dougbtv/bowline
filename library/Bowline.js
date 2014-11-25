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


	// We instantiate builders for each specification.
	var moment = require('moment');

	/*

	// ------------------- DISABLED DURING REFACTOR.
	// ...CLI disabled after refactor.

	// start up a cli if need be
	if (opts.cli) {

		var prompt = require('prompt');
		var readline = require('readline');

		// Create our readline interface.
		rl = readline.createInterface(process.stdin, process.stdout);

		// Set the prompt, and launch it.
		rl.setPrompt('bowline cli> '.cyan);
		rl.prompt();

		// Act on the line input from the readline.
		rl.on('line', function(line) {

			// parse the CLI input.
			this.parseRaw(line.trim(),function(cmd){

				this.commandHandler(cmd,true,function(){
					// And start again.
					rl.prompt();	
				});

			}.bind(this));

		}.bind(this)).on('close', function() {

			// console.log('Have a great day!');
			console.log("\n");
			process.exit(0);

		}.bind(this));

	}


	this.commandHandler = function(cmd,authorized,callback) {

		switch (cmd.command) {
			case "foo":
				this.logit("W00t, foo command");
				break;

			case "help":
				this.logit("I know these commands: !build !lastcmd !tail");
				break;

			// List the current jobs
			case "list":
				manager.listJobs(function(jobs){
					console.log("!trace joblist: ",jobs);
				});
				break;

			// Test if a git repo has the correct dockerfile, etc
			case "test":
				this.requireSlug(cmd,function(err,slug){
					if (!err) {
						this.logit("Checking out the requirements for '" + slug + "' (could take a second)");
						manager.verifyRelease(slug,function(err){
							if (!err) {
								this.logit("Great, the '" + slug + "' release looks clean for a build.");
							} else {
								this.logit("Bummer dude '" + slug + "' release is too dirty for a build, errored with: '" + err + "'");								
							}
						}.bind(this));
					}
				}.bind(this));
				break;

			case "lastcmd":
				this.lastCommandLog(function(last){
					this.logit("Last command: " + last);
				}.bind(this));
				break;

			case "tail":
				this.tailCommandLog(function(last){
					this.logit("Log tail: " + last);
				}.bind(this));
				break;

			case "build":
				if (authorized) {
					this.requireSlug(cmd,function(err,slug){
						if (!err) {
							this.logit("No prob, I'm kicking off an update for you.");
							manager.startUpdate(slug,function(){});
						}
					}.bind(this));
					
				} else {
					this.logit("You're not my master, ask " + opts.irc_authuser + " to do this");
				}
				break;

			case "":
				// That's ok, don't do anything.
				break;

			default:
				this.logit("Sorry, I don't know the command !" + cmd.command);
				break;
		}

		callback();

	}

	this.requireSlug = function(cmd,callback) {
		// Ok, we need to look at the slug.
		if (cmd.args.length) {
			
			var slug = cmd.args[0];
			// Ok, check if it exists.
			manager.jobExists(slug,function(found){
				if (found) {

					callback(null,slug);

				} else {
					console.log("Sorry I can't find '" + slug + "' as a job.");
					callback(true);
				}
			}.bind(this));
		} else {
			this.logit("Sorry, !" + cmd.command + " requires your release slug as a parameter, e.g. '!" + cmd.command + " foo'");	
			callback(true);
		}
		// this.performUpdate();
	}

	this.ircHandler = function(text,from,message) {

		// Let's parse the command.
		// console.log("text",text);
		// console.log("from",from);
		// console.log("message",message);

		// Let's check if they're authorized.
		var authorized = false;

		// Sometimes, in dev you don't care about auth.
		if (opts.authdisabled) {
			authorized = true;
		}
		
		if (message.nick == opts.irc_authuser && message.host == opts.irc_authhost) {
			authorized = true;
		}

		this.parseIRC(text,function(cmd){
			// "!foo bar quux" returns: 
			// { command: "foo", args: ["bar","quux"]}
			if (cmd) {
				this.commandHandler(cmd,authorized,function(){
					// No need to handle anything here.
				});
			}
		}.bind(this));

	}.bind(this);

	this.parseIRC = function(message,callback) {
		if (/^!/.test(message)) {
			// That's a command
			// Replace that bang, and split by spaces
			var raw = message.replace(/^\!/,"");
			var pts = raw.split(" ");
			var command = pts.shift();
			callback({
				command: command,
				args: pts,
			});
		} else {
			callback(false);
		}
	}

	this.parseRaw = function(message,callback) {
		// That's a command
		// Replace that bang, and split by spaces
		var pts = message.split(" ");
		var command = pts.shift();
		callback({
			command: command,
			args: pts,
		});
	}

	this.logit = function(message) {
		// Let's give a time.
		var displaytime = new moment().format("YYYY-MM-DD HH:mm:ss");
		console.log("[ " + displaytime + " ] " + message);
		bot.say(message);
	}

	*/

}