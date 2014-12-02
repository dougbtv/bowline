module.exports = function(bowline,opts,log) {

	var exec = require('child_process').exec;

	this.login = function(callback) {

		if (typeof callback == 'undefined') {
			callback = function(){};
		}

		if (!opts.disable_docker_hub) {

			// We'll log into dockerhub
			var cmd_login = 'docker login --email=\"' + opts.docker_email + '\"' +
				' --username=\"' + opts.docker_user + '\"' +
				' --password=\'' + opts.docker_password + '\' ';
			
			exec(cmd_login,
				function(err,stdout,stderr){
					// Uhhh, you don't wanna log with tooo much info.
					if (!err) {
						log.it("dockerhub_login",{successful: true});
					} else {
						log.it("dockerhub_login",{successful: false});
					}
					callback(err);
				});

		} else {
			// That's ok, we just don't use docker hub.
			callback(null);
		}

	};

	// We login upon instantiation.
	this.login();

}