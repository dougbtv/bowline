module.exports = function(opts,bot,log,release,socketserver) {

	// Our requirements.
	var fs = require('fs');
	var http = require('http');
	var request = require("request");
	var moment = require('moment');
	var async = require('async');
	var schedule = require('node-schedule');
	var pasteall = require("pasteall"); 		// wewt, I wrote that module!
	var exec = require('child_process').exec;
	var GitHubApi = require("github");
	var Tail = require('always-tail');

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

	// We can't start until we're validated.
	this.started = false;

	// What's the last error?
	this.last_error = false;

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
		// console.log("!trace this.release @ Builder start: ",this.release);

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

		this.verifyRelease(function(err){
			if (!err) {

				// Check for update once, then, once it's updated, schedule the job to recur.
				this.checkForUpdate(function(err,initialupdate){

					if (!err) {

						this.started = true;
						callback(null);
				

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

							log.it("release_check",{slug: this.release.slug});

							this.checkForUpdate(function(err,updated){

								if (updated) {
									// Ok, kick it off!
									this.performUpdate();
								}

							}.bind(this));
						
						}.bind(this));

					} else {

						log.warn("http_check_error",err);
						this.last_error = err;
						callback(err);

					}

				}.bind(this));

			} else {

				// There's an error verifying this release.
				log.warn("verification_error",err);
				this.last_error = err;
				callback(err);

			}

		}.bind(this));

	}.bind(this);

	// should be pretty simple to force....
	this.forceUpdate = function(callback) {
		this.performUpdate();
		callback(null);
	}

	this.verifyRelease = function(callback) {

		// We'll need these paths.
		var relative_gitpath = this.release.git_path.replace(/^\/(.+)$/,"$1");
		var path_dockerfile = this.release.clone_path + relative_gitpath;

		if (!this.in_progress) {

			// Alright, so, let's check that this release is OK.
			async.series({

				repo_exists: function(callback) {

					request({
						uri: "https://api.github.com/repos/" + this.release.git_repo,
						method: "GET",
						timeout: 10000,
						auth: {
							user: opts.gituser,
							pass: opts.gitpassword,
						
						},
						headers: { 
							'User-Agent': 'Bowline Autobuilder Bot',
						}
					}, function(err, response, body) {						

						if (!err) {

							var apireturns = JSON.parse(body);

							if (typeof apireturns.name != 'undefined') {
								// Great, looks good.
								callback(null);
							} else {
								callback("Sorry the github repo doesn't exist: '" + this.release.git_repo + "'");
							}

						} else {
							callback("Ack http error talking to github api when trying to repo_exists");
						}

					}.bind(this));

				}.bind(this),

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

				// Update the dockerfile for this release.
				update_dockerfile: function(callback) {

					fs.readFile(path_dockerfile, 'utf8', function (err, dockerfile_contents) {
						// !bang
						if (!err) {

							release.updateDockerfile(this.release._id,dockerfile_contents,function(err){
								callback(err);
							}.bind(this));

						} else {
							callback("Damn, couldn't read the dockerfile when looking for environment variable.");
						}
						

					}.bind(this));

				}.bind(this),

				rmdir: function(callback){
					exec("rm -Rf " + this.release.clone_path,function(err){
						callback(err);
					});
				}.bind(this),

			},function(err,result){

				if (!err) {
					callback(null,true);
				} else {
					callback(err);
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

				update_build_stamp: function(callback) {

					this.updateBuildStamp(buildstamp,function(err){
						callback(err);
					});

				}.bind(this),

				update_clone: function(callback){
					// Let's update our git repository.
					if (this.release.git_enabled) {
						this.gitModifyClone(buildstamp,function(err){
							callback(err);
						});
					} else {
						this.logit("NOTICE: modify and branch IS SKIPPED -- should be a-ok");
						callback(null);
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

	var build_start;
	var lastline = "__initialize_this";

	this.dockerBuild = function(callback) {

		var tail = new Tail(this.release.log_docker, '\n',{ interval: 1 });

		async.series({
			clear_log: function(callback) {
				tail.unwatch();
				exec('> ' + this.release.log_docker,function(err){
					callback(err);
				});
			}.bind(this),

			/*

			// TODO: I don't think this is necessary....
			// I can't see that a dockerfile that hasn't been locally honors a builds hash.

			docker_pull: function(callback) {
				this.logit("Beginning docker pull");
				execlog('docker pull ' + this.release.docker_tag,function(err,stdout,stderr){
					callback(err,{stdout: stdout, stderr: stderr});
				});
			}.bind(this),
			*/

			docker_build: function(callback) {
				
				// When did we start?
				build_start = new Date();

				var relative_gitpath = this.release.git_path.replace(/^\/(.+)Dockerfile$/,"$1");
				var path_dockerfile = this.release.clone_path + relative_gitpath;

				this.logit("And we begin the docker build");

				tail.on("line", function(data) {
					// sometimes we get dupes, omit those.
					if (data != lastline) {
						lastline = data;
						// console.log("!trace TAIL DATA: ",data);
						socketserver.sendBuildLog(this.release.slug,data);
					}
				}.bind(this));

				tail.watch();

				execlog('docker build -t ' + this.release.docker_tag + ' ' + path_dockerfile,function(err,stdout,stderr){
					callback(err,{stdout: stdout, stderr: stderr});
				});
				
			}.bind(this),

			docker_show_images: function(callback) {
				execlog('docker images',function(err,stdout,stderr){
					callback(err,{stdout: stdout, stderr: stderr});
				});
			}.bind(this),

			// TODO: So these aren't really atomic
			// so, we should do them less scoped to these atomic actions.
			/*
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
			*/
			
			docker_push_local: function(callback) {
				if (this.release.store_local) {
					this.logit("Pushing to bowling registry");
					var localtag = opts.docker_localhost + '/' + this.release.docker_tag;
					execlog('docker tag ' + this.release.docker_tag + ' ' + localtag,function(err,stdout,stderr){
						if (!err) {

							execlog('docker push ' + localtag,function(err,stdout,stderr){
								callback(err,{stdout: stdout, stderr: stderr});
							}.bind(this));

						} else {
							callback("docker tag error: " + err);
						}
					}.bind(this));
					
				} else {
					// this.logit("NOTICE: No docker push (by options)");
					callback(null);
				}
			}.bind(this),

			docker_push_dockerhub: function(callback) {
				if (this.release.store_dockerhub) {
					this.logit("Pushing to dockerhub");
					execlog('docker push ' + this.release.docker_tag,function(err,stdout,stderr){
						callback(err,{stdout: stdout, stderr: stderr});
					});
				} else {
					// this.logit("NOTICE: No docker push (by options)");
					callback(null);
				}
			}.bind(this),

			
		},function(err,results){

			tail.unwatch();

			if (!err) { 
				this.logit("Grreeeat! Docker build & push successful");
			} else {
				this.logit("Docker build failed with: " + err);
				console.log("!trace results for docker build: ",results);
			}

			// Let's read the log file, and post to pasteall
			fs.readFile(this.release.log_docker, 'utf8', function (readlogerr, logcontents) {
				if (readlogerr) throw readlogerr;

				// Ok, let's add a build
				var is_error = false;
				if (err) {
					is_error = true;
				}

				release.addBuild(this.release._id,build_start,new Date(),logcontents,!is_error,function(err){

					// Ok, let's see if this worked!
					log.it("build_complete",{
						slug: this.release.slug,
						id: this.release._id,
						start: build_start,
						end: new Date(),
						success: !is_error
					});

				}.bind(this));

				if (!opts.skippasteall) {
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
										log.it("Oooops, somehow the github issue comment failed: " + err);
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
					if (err) {
						callback("Git clone failed");
					} else {
						callback(err,stdout);	
					}
				});
			}.bind(this),

		},function(err,results){

			if (err) {
				this.logit("!ERROR: Clone failed " + err);
			}

			callback(err);

		}.bind(this));
		
	}

	this.updateBuildStamp = function(buildstamp,callback){

		var relative_gitpath = this.release.git_path.replace(/^\/(.+)$/,"$1");
		var path_dockerfile = this.release.clone_path + relative_gitpath;

		var cmd_sed = 'sed -i -e "s|.*' + AUTOBUILD_ENVVAR + '.*|ENV ' + AUTOBUILD_ENVVAR + ' ' + buildstamp + '|" ' + path_dockerfile;
		// console.log("!trace SED IT? >>%s<< (%s)",cmd_sed,path_dockerfile);
		exec(cmd_sed, {}, function(err,stdout){
			// Ok, after this point, if we're not updating the clone...
			// We exit with an console.
			// error.log("!trace sed result: ",err,stdout);
			callback(err,stdout);
			
		});

	}.bind(this);

	this.gitModifyClone = function(buildstamp,callback) {

		// Ok, let's clone the repo, and update it.
		var branch_name = this.release.slug + "-" + buildstamp;
		
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

			git_add: function(callback){
				exec('git add --all', {cwd: this.release.clone_path}, function(err,stdout){ callback(err,stdout); });
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

				// console.log("!trace gitModifyClone RESULTS");
				// console.log(JSON.stringify(result, null, 2));

				this.logit("Repo cloned & updated, pull request @ " + result.pull_request.html_url);
				callback(null);

			} else {
				var errtxt = "ERROR with the gitModifyClone: " + err
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

			if (raw_modified) {

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

				
				callback(null,is_update);

			} else {

				callback("There is no 'last-modified' header on your URL to check.");
				
			}


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