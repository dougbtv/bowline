module.exports = function() {

	var CONFIG_FILE_DEFAULT = __dirname + '/../includes/config.json';

	var fs = require('fs');

	// These are required values? for now.
	var required = [
		"gituser",
		"gitrepo",
		"gitpassword",
		"docker_user",
		"docker_email",
		"docker_password",
	];

	// We read our config from a json file.
	this.loadConfig = function(callback) {

		configfile = CONFIG_FILE_DEFAULT;
		console.log("!trace config? ",configfile);

		fs.exists(configfile,function(exists){
		
			if (exists) {

				fs.readFile(configfile, 'utf8', function (err, data) {

					var configs = {};

					if (!err) {
						var configs = JSON.parse(data);

						console.log("Configuration loaded successfully",configs.CONFIG_NAME);

						callback(configs);

						// console.log("!trace configs: ",configs);

						// -- Connect to mongo.

						/*
							mongoose.connect(configs.MONGO_CONNECT_STRING);

							var db = mongoose.connection;
							
							db.on('error', function(){
								log.error("mongo_connect",{server: configs.MONGO_CONNECT_STRING });
							});

							db.once('open', function callback () {

								// We're connected to mongo, now.
								log.it("mongo_connect",{server: configs.MONGO_CONNECT_STRING });

								// Now that we're connected to mongo, we can continue along.
								// The Condor object, the meat of our dealings.
								var Condor = require("./library/Condor.js"); 
								var condor = new Condor(mongoose,db,log,constants,configs);

							});
						*/

					} else {
						throw '!ERROR: FATAL, READING FILE FAILED: ' + err;
					}

				});

			} else {

				// Unconfigured.
				callback({});
			}

		});

	}

	this.parse = function(callback) {

		this.loadConfig(function(configs){

			var opts = require("nomnom")
			.option('gituser', {
				abbr: 'u',
				help: 'Github user',
				// required: true
			})
			.option('gitpassword', {
				abbr: 'p',
				help: 'Github password',
				// required: true
			})
			.option('docker_user', {
				help: 'Dockerhub user.',
				// required: true
			})
			.option('docker_email', {
				help: 'Dockerhub user.',
				// required: true
			})
			.option('docker_password', {
				help: 'Dockerhub password',
				// required: true
			})
			.option('docker_image', {
				// default: "dougbtv/asterisk",
				help: 'The docker image that we update'
			})
			.option('gitrepo', {
				abbr: 'r',
				// default: GITHUB_REPO,
				help: 'Github repo url in format: user/project'
			})
			.option('irc_channel', {
				// default: "##asterisk-autobuilder",
				help: 'The bots chanel on IRC'
			})
			.option('irc_nick', {
				// default: "ast-autobuild",
				help: 'The bots nick on IRC'
			})
			.option('irc_realname', {
				// default: "asterisk-autobuilder",
				help: 'The bots "real name" on IRC'
			})
			.option('irc_server', {
				// default: "chat.freenode.net",
				help: 'The IRC network to connect to'
			})
			.option('irc_authuser', {
				// default: "protocoldoug",
				help: 'The IRC network to connect to'
			})
			.option('irc_authhost', {
				// default: "unaffiliated/protocoldoug",
				help: 'The IRC network to connect to'
			})
			.option('irc_debug', {
				flag: true,
				help: 'Show IRC debug output'
			})
			.option('irc_disabled', {
				flag: true,
				help: 'Do not connect to IRC'
			})
			.option('git_setemail', {
				// default: "auto@builder.com",
				help: 'The IRC network to connect to'
			})
			.option('git_setname', {
				// default: "Your loyal autobuilder",
				help: 'The IRC network to connect to'
			})
			.option('authdisabled', {
				flag: true,
				help: 'Do not authenticate users to use commands'
			})
			.option('skipclone', {
				flag: true,
				help: 'Skip updating the github repo.'
			})
			.option('skipbuild', {
				flag: true,
				help: 'Skip updating the github repo.'
			})
			.option('forceupdate', {
				flag: true,
				help: 'Force an update automatically.'
			})
			.parse();

			console.log("!trace input PRE-CONFIG: ",configs);

			// Alright now that we have those, let's override just what's specified.
			Object.keys(opts).forEach(function (key) {

				// Alright if they're set here, they override the config.
				configs[key] = opts[key];

				// target[key];

			});

			console.log("!trace input RECONFIG: ",configs);

			// Now, cycle through the required, and see if they're OK.
			Object.keys(required).forEach(function (key) {
				if (typeof configs[required[key]] === 'undefined') {
					// That's an error.
					throw "Hey man, you're missing a required config: " + required[key];
				}
			});

			callback(configs);

		});

	}.bind(this);	

};