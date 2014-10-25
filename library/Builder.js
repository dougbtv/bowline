module.exports = function(opts,bot) {

	// Our requirements.
	var fs = require('fs');
	var http = require('http');
	var moment = require('moment');
	var async = require('async');
	var schedule = require('node-schedule');
	var pasteall = require("pasteall"); 		// wewt, I wrote that module!
	var exec = require('child_process').exec;
	var GitHubApi = require("github");

	// Our constants
	var AUTOBUILD_ENVVAR = "AUTOBUILD_UNIXTIME";

	var github = new GitHubApi({
		// required
		version: "3.0.0",
	});
	
	// OAuth2 Key/Secret
	github.authenticate({
		type: "basic",
		username: opts.gituser,
		password: opts.gitpassword
	});

	// Is there a build in progress?
	this.in_progress = false;

	// for Breaking up the repo options
	var repo_username = "";
	var repo_name = "";

	// Our job
	var job;

	// The this.release we're associated with
	this.release;

	// When did we last check?
	this.last_check = false;

	// Our properties
	this.last_modified = new moment();	// When was the file on server last updated?
	this.last_pullrequest = 0;

	// Our virtual constructor.
	// We can also start(), but that kicks off a job.
	// ...sometimes we might want to pick out things a la carte
	// (say, testing when you save a new release.)
	this.instantiate = function(initial_release) {
		
		// We're passed in a this.release object.
		this.release = initial_release;
		console.log("!trace this.release @ Builder start: ",this.release);

		// Let's set it's local variables.
		this.release.clone_path = "/tmp/" + this.release.slug + "/";
		this.release.log_docker = "/tmp/" + this.release.slug + ".docker.log";

		// Ok, we need to do a little work on those git repo names to break it apart.
		repo_username = this.release.git_repo.replace(/^(.+)\/.+$/,"$1");
		repo_name = this.release.git_repo.replace(/^.+\/(.+)$/,"$1");


		// For an update if we've asked for one.
		if (opts.forceupdate) {
			this.last_modified = new moment().subtract(20, "years");
			this.logit("Forcing an update on start, set date to: ",this.last_modified.toDate());
		}

		return;

	}

	// Alright, let's start this job.
	this.start = function(initial_release,callback) {

		// First instantiate with the passed in release.
		this.instantiate(initial_release);

		// Check for update once, then, once it's updated, schedule the job to recur.
		this.checkForUpdate(function(initialupdate){

			if (initialupdate) {
				this.performUpdate();
			}

			// Create a range
			// that runs every other unit.
			var rule = new schedule.RecurrenceRule();
			// rule.hour = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
			rule.minute = this.release.check_minutes;
			

			job = schedule.scheduleJob(rule, function(){

				// Update the last time we checked.
				this.last_check = new moment();

				this.logit("Checking for an update @ " + moment().format("YYYY-MM-DD HH:mm:ss"));

				this.checkForUpdate(function(updated){

					if (updated) {
						// Ok, kick it off!
						this.performUpdate();
					}

				}.bind(this));
			
			}.bind(this));

		}.bind(this));

	}.bind(this);

	this.verifyRelease = function(callback) {

		// We'll need these paths.
		var relative_gitpath = this.release.git_path.replace(/^\/(.+)$/,"$1");
		var path_dockerfile = this.release.clone_path + relative_gitpath;

		if (!this.in_progress) {

			// Alright, so, let's check that this release is OK.
			async.series({

				clone: function(callback) {

					this.gitClone(function(err){
						callback(err);
					});

				}.bind(this),

				check_dockerfile_exists: function(callback) {

					// Ok, see if the file exists.
					fs.exists(path_dockerfile, function(exists){
						if (exists) {
							callback(null,path_dockerfile);
						} else {
							callback("Dockerfile path is wrong, didn't find " + this.release.git_path);
						}
					}.bind(this));

				}.bind(this),

				has_env_var: function(callback) {

					// Ok, check that it has the env var.
					// AUTOBUILD_ENVVAR
					// console.log("!trace path_dockerfile: ",path_dockerfile);

					fs.readFile(path_dockerfile, 'utf8', function (err, filecontents) {
						if (!err) {

							// Ok let's check that they have the environment variable.
							if (filecontents.indexOf(AUTOBUILD_ENVVAR) > -1) {
								callback(null);
							} else {
								callback("Your dockerfile needs to container the environment variable '" + AUTOBUILD_ENVVAR + "'");
							}

						} else {
							callback("Damn, couldn't read the dockerfile when looking for environment variable.");
						}
					});

				}.bind(this),

			},function(err,result){

				if (!err) {

					console.log("!trace done with verifyRelease, success.");
					callback(null,true);

				} else {
					console.log("!trace done with verifyRelease, err: " + err);
					callback("Couldn't verify release: " + err);
				}

			});

		} else {

			callback("Sorry, you can't test a release while a build is in progress");

		}

	}.bind(this);

	this.performUpdate = function() {

		if (!this.in_progress) {

			// Set that we have a running job.
			this.in_progress = true;

			// Ok, let's handle a new build.
			// Steps:
			// update the git repo
			// pull the dockers
			// build the docker image
			// push the docker image
			this.logit("We're starting to perform an update");

			// Let's make a build time for this.
			var buildstamp = new moment().unix();

			async.series({

				clone: function(callback) {

					this.gitClone(function(err){
						callback(err);
					});

				}.bind(this),

				update_clone: function(callback){
					// Let's update our git repository.
					if (opts.skipclone) {
						this.logit("NOTICE: CLONE (which is really modify and branch) IS SKIPPED, typically for development.");
						callback(null);
					} else {
						this.gitModifyAndBranch(buildstamp,function(err){
							callback(err);
						});
					}
				
				}.bind(this),

				do_docker_build: function(callback){

					if (!opts.skipbuild) {
						// Ok, now, we can perform the docker build.
						this.dockerBuild(function(err){
							callback(err);	
						});
					} else {
						this.logit("We skipped the build, by a debug flag.");
						callback(null);
					}
					
					
				}.bind(this)

			},function(err,result){
				// We're done with this running job.
				this.in_progress = false;
				if (!err) {
					this.logit("Looking good -- appears we have a successful build!");
				} else {
					this.logit("ERROR: Failed to performUpdate -- " + err);
				}
			}.bind(this));

		} else {
			// There's nothing to do, usually.

		}

	}

	var execlog = function(cmd,callback){
		exec('echo "=>======== ' + cmd + ' (@ ' + moment().format("YYYY-MM-DD HH:mm:ss") + ')" >> ' + this.release.log_docker,function(){
			exec(cmd + ' >> ' + this.release.log_docker + ' 2>&1 ',function(err,stdout,stderr){
				callback(err,stdout,stderr);
			});
		}.bind(this));
	}.bind(this);

	this.lastCommandLog = function(callback) {

		exec('cat ' + this.release.log_docker + ' | grep \'=>========\' | tail -n 1',function(err,stdout,stderr){
			callback(stdout);
		}.bind(this));

	}.bind(this);

	this.tailCommandLog = function(callback) {

		exec('tail -n 3 ' + this.release.log_docker,function(err,stdout,stderr){
			callback(stdout);
		});

	}.bind(this);


	this.dockerBuild = function(callback) {

		async.series({
			clear_log: function(callback) {
				exec('> ' + this.release.log_docker,function(err){
					callback(err);
				});
			}.bind(this),

			docker_login: function(callback) {
				// Uhhh, you don't wanna log this.
				var cmd_login = 'docker login --email=\"' + opts.docker_email + '\"' +
					' --username=\"' + opts.docker_user + '\"' +
					' --password=\'' + opts.docker_password + '\' ';
				exec(cmd_login,
					function(err,stdout,stderr){
						// this.logit();
						callback(err,{stdout: stdout, stderr: stderr});
					});
			}.bind(this),

			docker_pull: function(callback) {
				this.logit("Beginning docker pull");
				execlog('docker pull ' + this.release.docker_tag,function(err,stdout,stderr){
					callback(err,{stdout: stdout, stderr: stderr});
				});
			}.bind(this),

			docker_build: function(callback) {
				var relative_gitpath = this.release.git_path.replace(/^\/(.+)Dockerfile$/,"$1");
				var path_dockerfile = this.release.clone_path + relative_gitpath;

				this.logit("And we begin the docker build");
				execlog('docker build -t ' + this.release.docker_tag + ' ' + path_dockerfile,function(err,stdout,stderr){
					callback(err,{stdout: stdout, stderr: stderr});
				});
				
			}.bind(this),

			docker_show_images: function(callback) {
				execlog('docker images',function(err,stdout,stderr){
					callback(err,{stdout: stdout, stderr: stderr});
				});
			}.bind(this),

			docker_kill: function(callback) {
				execlog('docker kill $(docker ps -a -q) || true',function(err,stdout,stderr){
					callback(err,{stdout: stdout, stderr: stderr});
				});
			}.bind(this),

			docker_clean: function(callback) {
				execlog('docker rm $(docker ps -a -q) || true',function(err,stdout,stderr){
					callback(err,{stdout: stdout, stderr: stderr});
				});
			}.bind(this),

			docker_remove_untagged: function(callback) {
				execlog('docker images | grep -i "none" | awk \'{print \$3}\' | xargs docker rmi || true',function(err,stdout,stderr){
					callback(err,{stdout: stdout, stderr: stderr});
				});
			}.bind(this),
			
			docker_push: function(callback) {
				if (!opts.skipdockerpush) {
					this.logit("And we've started pushing it");
					execlog('docker push ' + this.release.docker_tag,function(err,stdout,stderr){
						callback(err,{stdout: stdout, stderr: stderr});
					});
				} else {
					this.logit("NOTICE: No docker push (by options)");
					callback(null);
				}
			}.bind(this),

			
		},function(err,results){

			if (!err) { 
				this.logit("Grreeeat! Docker build & push successful");
			} else {
				this.logit("Docker build failed with: " + err);
			}

			// Let's read the log file, and post to pasteall
			fs.readFile(this.release.log_docker, 'utf8', function (readlogerr, logcontents) {
				if (readlogerr) throw readlogerr;

				if (!opts.skipdockerpush) {
					pasteall.paste(logcontents,"text",function(err,url){
						if (!err) {
							this.logit("Build results posted @ " + url);

							// last_pullrequest
							if (!opts.skipclone) {
								github.issues.createComment({
									user: repo_username,
									repo: repo_name,
									body: "Build complete, log posted @ " + url,
									number: this.last_pullrequest,
								},function(err,result){
									if (err) {
										console.log("Oooops, somehow the github issue comment failed: " + err);
									}
									// console.log("!trace PULL REQUEST err/result: ",err,result);
									// callback(err,result);
								}.bind(this));
							} else {
								// callback(null);					
							}

						} else {
							this.logit("pasteall errored: " + err);
						}
					}.bind(this));
				}
				

			}.bind(this));
			
			// console.log("!trace results: %j",results);

			// Let's collect the output, and put it on a paste bin.
			/* 
			var output = "";
			for (var key in results) {
				if (results.hasOwnProperty(key)) {
					output += "====================== " + key + "\n\n";
					output += "-- stdout\n";
					output += results[key].stdout + "\n\n";
					output += "-- stderr\n";
					output += results[key].stderr + "\n\n";
					// console.log(key + " -> " + results[key]);
				}
			}
			console.log("!trace collected output: \n\n",output);
			
			*/

			callback(err);

			
		}.bind(this));
		
	}

	this.gitClone = function(callback) {

		async.series({

			// Remove the tempdir if necessary
			rmdir: function(callback){
				exec("rm -Rf " + this.release.clone_path,function(err){
					callback(err);
				});
			}.bind(this),

			// Set your git config user items.
			
   			// 1. Branch from master
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

			// Clone with git.
			clone: function(callback){
				// this.logit("Beginning git clone.");
				var cmd_gitclone = 'git clone https://' + opts.gituser + ':' + opts.gitpassword + '@github.com/' + this.release.git_repo + ".git " + this.release.clone_path;
				// console.log("!trace cmd_gitclone: ",cmd_gitclone);
				exec(cmd_gitclone,function(err,stdout,stderr){
					callback(err,stdout);
				});
			}.bind(this),

		},function(err,results){

			if (err) {
				this.logit("!ERROR: Clone failed " + err);
			}

			callback(err);

		});
		
	}

	this.gitModifyAndBranch = function(buildstamp,callback) {

		// Ok, let's clone the repo, and update it.
		branch_name = this.release.slug + "-" + buildstamp;
		
		async.series({
			
			// 1. Branch from master
			branch: function(callback){
				exec('git checkout -b ' + branch_name, {cwd: this.release.clone_path}, function(err,stdout){
					// console.log("!trace branch stdout: ",stdout);
					callback(err,stdout);
				});
			}.bind(this),

			branch_verbose: function(callback){
				exec('git branch -v', {cwd: this.release.clone_path}, function(err,stdout){
					// console.log("!trace branch -v stdout: \n",stdout);
					callback(err,stdout);
				});
			}.bind(this),

			branch_verbose: function(callback){

				var cmd_sed = 'sed -i -e "s|.*' + AUTOBUILD_ENVVAR + '.*|ENV ' + AUTOBUILD_ENVVAR + ' ' + buildstamp + '|" Dockerfile';
				exec(cmd_sed, {cwd: this.release.clone_path}, function(err,stdout){
					// Ok, after this point, if we're not updating the clone...
					// We exit with an error.
					if (!opts.skipclone) {-
						callback(err,stdout);
					} else {
						callback("We've skipped updating the clone.");
					}

				});

			}.bind(this),

			git_add: function(callback){
				exec('git add Dockerfile', {cwd: this.release.clone_path}, function(err,stdout){ callback(err,stdout); });
			}.bind(this),

			git_commit: function(callback){
				exec('git commit -m "[autobuild] Updating @ ' + buildstamp + '"', {cwd: this.release.clone_path}, function(err,stdout){ callback(err,stdout); });
			}.bind(this),

			git_push: function(callback){
				exec('git push origin ' + branch_name, {cwd: this.release.clone_path}, function(err,stdout){ callback(err,stdout); });
			}.bind(this),

			pull_request: function(callback) {

				console.log("!trace @ pull_request: " + this.release);

				// console.log("!trace PLAIN REPO: |" + repo_name + "|");

				github.pullRequests.create({
					user: repo_username,
					repo: repo_name,
					title: "[autobuild] Updating Asterisk @ " + buildstamp,
					body: "Your friendly builder bot here saying that we're updating @ " + buildstamp,
					base: this.release.branch_master,
					head: branch_name,
				},function(err,result){
					if (!err) {
						// Keep our last pull request.
						this.last_pullrequest = result.number;
					}
					// console.log("!trace PULL REQUEST err/result: ",err,result);
					callback(err,result);
				}.bind(this));

			}.bind(this),

			// Alright, that's great, all we need to do is simply.
			
			// 2. Edit the file.
			// 3. Stage changes.
			// 4. commit
			// 5. Push.

		},function(err,result){
			if (!err) {

				// console.log("!trace gitCloneAndUpdate RESULTS");
				// console.log(JSON.stringify(result, null, 2));

				this.logit("Repo cloned & updated, pull request @ " + result.pull_request.html_url);
				callback(null);

			} else {
				var errtxt = "ERROR with the gitCloneAndUpdate: " + err
				this.logit(errtxt);
				callback(errtxt);
			}
		}.bind(this));

	}

	this.checkForUpdate = function(callback) {

		var options = {method: 'HEAD', host: this.release.host, port: 80, path: this.release.url_path};
		var req = http.request(options, function(res) {

			// console.log(JSON.stringify(res.headers));
			var raw_modified = res.headers['last-modified'];
			// console.log("!trace raw_modified: ",raw_modified);

			// Ok, let's parse that date.
			// Thu, 18 Sep 2014 18:40:20
			var pts = raw_modified.split(" ");
			// console.log("!trace pts: ",pts);

			var day = pts[1];
			var mon = pts[2];
			var year = pts[3];

			var tpts = pts[4].split(":");
			var hour = tpts[0];
			var minute = tpts[1];
			var second = tpts[2];

			var last_modified = new moment().year(year).month(mon).date(day).hour(hour).minute(minute).second(second).add(4,"hours");
			// console.log("!trace last-modified: ",last_modified.toDate());

			// Do we have an update?
			var is_update = false;

			// Is it different from the last date?
			if (last_modified.unix() > this.last_modified.unix()) {
				// console.log("!trace IT'S GREATER.");
				is_update = true;
			}

			// Set the update.
			this.last_modified = last_modified;

			
			callback(is_update);

		}.bind(this));
		req.end();

	}.bind(this);

	this.logit = function(message) {
		// Let's give a time.
		var displaytime = new moment().format("YYYY-MM-DD HH:mm:ss");
		console.log("[ " + displaytime + " ] [" + this.release.slug + "] " + message);
		bot.say(message);
	}

}