module.exports = function(opts,bot,release,manager) {

	// We instantiate builders for each specification.
	var moment = require('moment');

	var prompt = require('prompt');
	var readline = require('readline');

	manager.initializeActiveSearches(function(err){
		console.log("!trace back to Bowline handler.");
	});

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
					this.logit("No prob, I'm kicking off an update for you.");
					this.performUpdate();
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

}