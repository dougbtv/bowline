module.exports = function(opts,bot,release,log) {

	var Builder = require("./Builder.js"); 

	// Initialize our jobs hash
	var jobs = {};

	
	// We'll log into dockerhub
	var exec = require('child_process').exec;
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
		});

	// We'll log into our local registry server
	// note: we are the local registry server, this is... kinda meta.
	// let's take a little delay because of that.
	setTimeout(function(){
		var exec = require('child_process').exec;
		var cmd_login = 'docker login --email=\"doesnt@matter.com\"' +
			' --username=\"' + opts.docker_localuser + '\"' +
			' --password=\'' + opts.docker_localpassword + '\' ' +
			' https://' + opts.docker_localhost + '/';
		exec(cmd_login,
			function(err,stdout,stderr){
				// Uhhh, you don't wanna log with tooo much info.
				console.log("!trace login error: ",stdout,stderr);
				if (!err) {
					log.it("dockerlocal_login",{successful: true});
				} else {
					log.it("dockerlocal_login",{successful: false});
				}
			});
	},2000);
	
	this.initializeActiveSearches = function(callback) {

		release.getActive(function(err,rels){

			if (!err) {

				// Alright, we're going to create a Builder for each job, and track the job.
				if (rels.length) {

					for (var i = 0; i < rels.length; i++) {

						var rel = rels[i];

						// console.log("!trace each rel: ",rel);

						// We need a slug for this job.
						jobs[rel.slug] = new Builder(opts,bot,log,release);
						jobs[rel.slug].start(rel,function(){
							
						});

					}

				} else {
					console.log("!NOTICE: Hey we didn't have any jobs to start... typically bad, unless you're testing an empty bot.");
				}

				callback(err);

			} else {

				console.log("ERROR: initializeActiveSearches: " + err);
				callback(err);

			}
			

		});

	}

	// Let's compile a list of properties about this job.
	this.jobProperties = function(findslug,callback) {

		this.jobExists(findslug,function(exists){
			
			if (exists) {

				eachjob = jobs[findslug];

				// Great, let's start that update.
				props = {
					exists: true,
					active: eachjob.started,
					error: eachjob.last_error,
					in_progress: eachjob.in_progress,
				};

				// See if it's been checked.
				if (eachjob.last_check) {
					props.last_check = eachjob.last_check.toDate();
				}

				// console.log("!trace job props??? ",props);

				callback(null,props);

			} else {
				callback(null,{
					exists: false,
					active: false,
				});
			}
		});

	}

	this.startJob = function(releaseid,callback) {

		release.getSlug(releaseid,function(err,findslug){
			
			if (!err) {

				// Now let's find that job.
				this.jobExists(findslug,function(exists){
					if (!exists) {
						// Great, let's create this job.
						release.getReleases({_id: releaseid},function(rels){

							jobs[findslug] = new Builder(opts,bot,log,release);
							jobs[findslug].start(rels[0],function(){
								callback(null);
							});

						});
						
					} else {
						callback("You can't start a job that already exists: " + findslug);
					}
				});

			} else {
				log.warn("jobStop_noslug",{releaseid: releaseid});
				callback("error no slug for id " + releaseid);
			}

		}.bind(this));

	}

	this.stopJob = function(releaseid,callback) {

		release.getSlug(releaseid,function(err,findslug){
			
			if (!err) {

				// Now let's find that job.
				this.jobExists(findslug,function(exists){
					if (exists) {
						// Great, let's start that update.
						delete jobs[findslug];
						callback(null);
					} else {
						callback("no job found for slug: " + findslug);
					}
				});

			} else {
				log.warn("jobStop_noslug",{releaseid: releaseid});
				callback("error no slug for id " + releaseid);
			}

		}.bind(this));

	}

	this.jobExists = function(findslug,callback) {
		
		var found = false;

		// Pull out all the slugs.
		Object.keys(jobs).forEach(function (key) {
			if (key == findslug) {
				found = true;
			}
		});

		callback(found);

	}

	this.startUpdate = function(findslug,callback) {

		this.jobExists(findslug,function(exists){
			if (exists) {
				// Great, let's start that update.
				jobs[findslug].performUpdate();
			}
		});

		callback();

	}

	this.validateJob = function(releaseid,callback) {

		release.getSlug(releaseid,function(err,findslug){

			this.verifyRelease(findslug,function(err,validated){
				callback(err,validated);
			});

		}.bind(this));

	}

	// Call a way to verify the releases.
	this.verifyRelease = function(findslug,callback) {

		this.jobExists(findslug,function(exists){
			if (exists) {
				jobs[findslug].verifyRelease(function(err){
					callback(err);
				});
			}
		});

	}


	this.listJobs = function(callback) {

		var joblist = [];

		// Pull out all the slugs.
		Object.keys(jobs).forEach(function (key) {
			joblist.push({
				slug: key,
				in_progress: jobs[key].in_progress,
				last_check: jobs[key].last_check,
			});
		});

		callback(joblist);

	}


}