module.exports = function(opts,bot) {

	// We instantiate builders for each specification.
	var moment = require('moment');
	var Builder = require("./Builder.js"); 
	//	var builder = new Builder(opts,irc);

	this.ircHandler = function(text,from,message) {

		// Let's parse the command.
		// console.log("text",text);
		// console.log("from",from);
		// console.log("from",message);

		// Let's check if they're authorized.
		var authorized = false;

		// Sometimes, in dev you don't care about auth.
		if (opts.authdisabled) {
			authorized = true;
		}
		if (message.nick == opts.irc_authuser && message.host == opts.irc_authhost) {
			authorized = true;
		}

		bot.parse(text,function(cmd){
			// "!foo bar quux" returns: 
			// { command: "foo", args: ["bar","quux"]}
			if (cmd) {
				switch (cmd.command) {
					case "foo":
						this.logit("W00t, foo command");
						break;
					case "help":
						this.logit("I know these commands: !build !lastcmd !tail");
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
					default:
						this.logit("Sorry, I don't know the command !" + cmd.command);
						break;
				}
			}
		}.bind(this));

	}.bind(this);

	this.logit = function(message) {
		// Let's give a time.
		var displaytime = new moment().format("YYYY-MM-DD HH:mm:ss");
		console.log("[ " + displaytime + " ] " + message);
		bot.say(message);
	}

}