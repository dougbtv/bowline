module.exports = function(bowline,opts,log) {

	// Our children.
	var GitHub = require('./builders/GitHub.js');
	var Git = require('./builders/Git.js');

	// We create a common interface for those two git methods.
	this.git = null;

	// Our requirements.
	var fs = require('fs');
	var http = require('http');
	var moment = require('moment');
	var async = require('async');
	var schedule = require('node-schedule');
	var pasteall = require("pasteall"); 		// wewt, I wrote that module!
	var exec = require('child_process').exec;	
	var Tail = require('always-tail');

	// Our constants
	var AUTOBUILD_ENVVAR = "AUTOBUILD_UNIXTIME";
	var TMP_DIR = "/tmp/";

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

	// Our virtual constructor.
	// We can also start(), but that kicks off a job.
	// ...sometimes we might want to pick out things a la carte
	// (say, testing when you save a new release.)
	this.instantiate = function(initial_release) {
		
		// We're passed in a this.release object.
		this.release = initial_release;
		// console.log("!trace this.release @ Builder start: ",this.release);

		// Let's set it's local variables.
		this.release.clone_path = TMP_DIR + this.release.slug + "/";
		this.release.log_docker = TMP_DIR + this.release.slug + ".docker.log";

		// Ok, we need to do a little work on those git repo names to break it apart.
		repo_username = this.release.git_repo.replace(/^(.+)\/.+$/,"$1");
		repo_name = this.release.git_repo.replace(/^.+\/(.+)$/,"$1");

		// Alright, so... what's our git method?
		switch (this.release.git_method) {
			// use github.
			case "github":
				this.git = new GitHub(this.release,bowline,opts,log);
				break;

			// use a standard git repo.
			case "git":
				this.git = new Git(this.release,bowline,opts,log);
				break;

			// Hrmm, that's an error.
			// ...try github.
			default:
				log.warn("invalid_gitmethod",{releaseid: this.release._id});
				this.git = new GitHub(this.release,bowline,opts,log);
				break;

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

				git_verify: function() {

					this.git.verify(function(err){
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

							bowline.release.updateDockerfile(this.release._id,dockerfile_contents,function(err){
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

					this.git.clone(function(err){
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
					this.git.branchCommitPushPR(buildstamp,function(err){
						callback(err);
					});
				
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

		var tail = null;

		async.series({
			clear_log: function(callback) {
				if (tail) {
					tail.unwatch();
				}
				exec('> ' + this.release.log_docker,function(err){
					callback(err);
				});
			}.bind(this),

			tail_it: function(callback){

				var iserr = null;

				try {
					tail = new Tail(this.release.log_docker, '\n',{ interval: 1 });	
				} catch (err) {
					iserr = err.message;
				}

				callback(iserr);
				
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
						bowline.socketserver.sendBuildLog(this.release.slug,data);
					}
				}.bind(this));

				tail.watch();

				execlog('docker build -t ' + this.release.docker_tag + ' ' + path_dockerfile,function(err,stdout,stderr){
					callback(err,{stdout: stdout, stderr: stderr});
				});
				
			}.bind(this),

			docker_show_images: function(callback) {
				execlog('docker images | grep "' + this.release.docker_tag + '"',function(err,stdout,stderr){
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

			 bowline.release.addBuild(this.release._id,build_start,new Date(),logcontents,!is_error,function(err){

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

						} else {
							this.logit("pasteall errored: " + err);
						}
					}.bind(this));
				}
				

			}.bind(this));

			this.git.success(function(err){});
			
			// and you can just callback while this other stuff happens.
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
		// bot.say(message);
	}

}