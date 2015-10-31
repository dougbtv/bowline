module.exports = function(bowline,opts,log) {

	var async = require('async');
	var exec = require('child_process').exec;

	// -- constants
	var DEPTH = 15; 		// how deep?

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

				// I'm not so hot on getting one anymore...
				// git clone --depth 1 --branch develop git@github.com:dougbtv/bowline.git

				// And maybe not tracking a branch exactly....
				// ' --branch ' + release.branch_master + 

				// TODO: We need some depth control. But to get all the active branches... full clone is nice for right now.
				// --depth ' + DEPTH + '
				
				var cmd_gitclone = 'git clone ' + giturl + ' ' + release.clone_path;
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

			show_branches: function(callback) {

				exec('git branch -a',
					{cwd: release.clone_path},
					function(err,stdout,stderr){
						if (!err) {
							
							// log.it("gitcommon_showbranches",{stdout: stdout});
							
							parseBranches(stdout,function(branches){
								callback(err,branches);
							});

						} else {
							log.warn("gitcommon_show_branches_failed",{release: release});
							callback("gitcommon show branches failed");
						}
					}.bind(this));

			},

			checkout: function(callback) {

				var cmd_checkout = 'git checkout ';
				callback(false);

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

			// Ship back the head commit.
			callback(err,{
				commit: results.get_headcommit,
				branches: results.show_branches,
			});

		}.bind(this));

	}

	this.parseBranches = function(raw_gitbranch_output,callback) {

		// We'll collect the branches
		var branches = [];
		
		// And we'll need to parse those branches...
		var lines = raw_gitbranch_output.split(/\n/);
		// with each line...
		lines.forEach(function(line){
			line = line.trim();

			// for lines that have content...
			if (line.length) {

				var branch_name;

				// pick up the remote names, plus master.
				var clean = line.replace(/^[\*\s]*(\S+).*$/gim,'$1');
				if (line.match(/\//)) {
					// split on the slashes, and grab the lash piece
					var slashes = clean.split(/\//);
					branch_name = slashes[(slashes.length -1)];
				} else {
					// that's master.
					branch_name = clean;
				}

				switch(branch_name) {
					// Omit these branches...
					case 'HEAD': 
						break;
					// Warn when empty...
					case '':
						log.warn("gitcommon_branchname_empty",{msg: 'Did not quite match our branch name expectations', original: line});
						break;
					default:
						// We'll collect these.
						if (branches.indexOf(branch_name) == -1) {
							branches.push(branch_name);
						}
						break;	
				}

				// log.it("branches_parse",{clean: clean, original: line});
			
			}
		});
		
		// log.it("gitcommon_branches_found",{branches: branches});
		callback(branches);

	}

	var parseBranches = this.parseBranches;

}