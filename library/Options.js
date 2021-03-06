module.exports = function() {

	var CONFIG_FILE_DEFAULT = __dirname + '/../includes/config.json';

	var fs = require('fs');

	// These are required values? for now.
	var required = [
		"docker_user",
		"docker_email",
		"docker_password",
	];

	// We read our config from a json file.
	this.loadConfig = function(callback) {

		configfile = CONFIG_FILE_DEFAULT;
		// console.log("!trace config? ",configfile);

		fs.exists(configfile,function(exists){
		
			if (exists) {

				fs.readFile(configfile, 'utf8', function (err, data) {

					var configs = {};

					if (!err) {
						var configs = JSON.parse(data);

						callback(null,configs);


					} else {

						callback(err);
						// throw '!ERROR: FATAL, READING FILE FAILED: ' + err;
					}

				});

			} else {

				// Unconfigured.
				// which is kind of expected.
				callback(null,{});

			}

		});

	}

	this.parse = function(callback) {

		this.loadConfig(function(err,configs){

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
			.option('git_setemail', {
				// default: "auto@builder.com",
				help: 'The IRC network to connect to'
			})
			.option('logfile', {
				help: 'Instead of logging to stdout, log to this file'
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
				help: 'Skip building docker files'
			})
			.option('skipdockerpush', {
				flag: true,
				help: 'Do not push to dockerhub'
			})
			.option('logdisable', {
				flag: true,
				help: 'Disable logging (for unit tests, usually)'
			})
			.option('skipautostart', {
				flag: true,
				help: 'Skip starting up all releases (for unit tests, usually)'
			})
			.option('forceupdate', {
				flag: true,
				help: 'Force an update automatically.'
			})
			.option('cli', {
				abbr: 'c',
				flag: true,
				help: 'Enable the CLI'
			})
			.parse();

			// console.log("!trace input PRE-CONFIG: ",configs);

			// Alright now that we have those, let's override just what's specified.
			Object.keys(opts).forEach(function (key) {

				// Alright if they're set here, they override the config.
				configs[key] = opts[key];

				// target[key];

			});

			// console.log("!trace input RECONFIG: ",configs);

			// Now, cycle through the required, and see if they're OK.
			Object.keys(required).forEach(function (key) {
				if (typeof configs[required[key]] === 'undefined') {
					// That's an error.
					throw "Hey man, you're missing a required config: " + required[key];
				}
			});

			// Lastly, we override anything that's found in the environment as an option
			// ...with those.
			console.log(configs,"%j");
			Object.keys(configs).forEach(function (key) {

				// Skip anything that begins with an underscore
				if (!key.match(/^_/)) {
					if (typeof process.env[key] !== 'undefined') {
						// Ok, it has been defined in the environment
						var thevalue = process.env[key];
						
						// replace booleans.
						if (thevalue === 'true' || thevalue === 'false') {
							// Ok, replace those bools.
							if (thevalue === 'true') {
								thevalue = true;
							} else {
								thevalue = false;
							}
						}
						
						console.log('environmental override, ' + key + ' has been overridden as "' + thevalue + '"');
						configs[key] = thevalue;
					}
				}

			});

			callback(err,configs);

		});

	}.bind(this);	

};