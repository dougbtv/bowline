module.exports = function(opts,bot,release) {

	var Builder = require("./Builder.js"); 

	// Initialize our jobs.
	var jobs = [];

	this.initializeActiveSearches = function(callback) {

		release.getActive(function(err,rel){

			console.log("!trace back to builder initializeActiveSearches", rel);
			callback(err);

			// Alright, we're going to create a Builder for each job, and track the job.
			

		});

	}


}