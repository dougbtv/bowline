module.exports = function(opts,bot,release) {

	var Builder = require("./Builder.js"); 

	// Initialize our jobs hash
	var jobs = {};

	this.initializeActiveSearches = function(callback) {

		release.getActive(function(err,rels){

			if (!err) {

				// Alright, we're going to create a Builder for each job, and track the job.
				if (rels.length) {

					for (var i = 0; i < rels.length; rels++) {

						var rel = rels[i];

						// console.log("!trace each rel: ",rel);

						// We need a slug for this job.
						jobs[rel.slug] = new Builder(opts,bot);
						jobs[rel.slug].start(rel,function(){
							console.log("!trace release " + rel.slug + "started");
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