module.exports = function(bowline,opts,log) {

	var async = require('async');
	var exec = require('child_process').exec;

	// -- constants
	var DEPTH = 1; 		// how deep?

	this.clone = function(release,giturl,callback) {

		async.series({

			// Remove the tempdir if necessary
			rmdir: function(callback){
				exec("rm -Rf " + release.clone_path,function(err){
					callback(err);
				});
			}.bind(this),

			// Set your git config user items.
			
			// TODO: This is wonked out. I'm not sure what to do with it, yet.
			/*
			git_set_email: function(callback){
				exec('git config --global user.email "' + opts.git_setemail + '"', function(err,stdout){
					// console.log("!trace branch stdout: ",stdout);
					callback(err,stdout);
				});
			},

			git_set_email: function(callback){
				exec('git config --global user.name "' + opts.git_setname + '"', function(err,stdout){
					// console.log("!trace branch stdout: ",stdout);
					callback(err,stdout);
				});
			},
			*/

			// Clone with git.
			clone: function(callback){
				
				// what about tracking a branch?
				// git clone --depth 1 --branch develop git@github.com:dougbtv/bowline.git

				var cmd_gitclone = 'git clone --depth ' + DEPTH + ' --branch ' + release.branch_master + ' ' + giturl + ' ' + release.clone_path;
				// console.log("!trace cmd_gitclone: ",cmd_gitclone);
				exec(cmd_gitclone,function(err,stdout,stderr){
					if (err) {
						log.warn("gitcommon_clone_fail",{release: release, stdout: stdout, stderr: stderr});
						callback("gitcommon clone failed");
					} else {
						callback(err,stdout);	
					}
				});
			}.bind(this),

			get_headcommit: function(callback){
				
				// console.log("!trace cmd_gitclone: ",cmd_gitclone);
				exec('git rev-parse HEAD',
					{cwd: release.clone_path},
					function(err,stdout,stderr){
						if (err) {
							log.warn("gitcommon_get_headcommit_failed",{release: release});
							callback("gitcommon get head commit failed");
						} else {
							var commit = stdout.trim();
							callback(err,commit);
						}
					}.bind(this));
			}.bind(this),

		},function(err,results){

			if (err) {
				log.error("gitcommon_clone",err);
			}

			callback(err);

		}.bind(this));

	}

}