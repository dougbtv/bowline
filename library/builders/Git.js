module.exports = function(inrelease,gitcommon,bowline,opts,log) {

	// an instance of the applicable release.
	this.release = inrelease;

	// our working head commit
	this.commit = '';


	// our deps.
	var moment = require('moment');
	var async = require('async');
	var exec = require('child_process').exec;

	this.clone = function(callback) {
		
		gitcommon.clone(this.release,this.release.git_url,function(err,commitish){
			if (err) {
				log.warn("vanilla_git_clone","err with that: " + err);
				callback(err);
			} else {
				this.commit = commitish;
				callback(err,commitish);
			}
		}.bind(this));
	}

	this.verify = function(callback) {
		// Let's just see if we can clone...
		this.clone(function(err){
			callback(err);
		});

	}

	this.success = function(callback) {
		log.it("vanilla_git_success","durrrr I am always success! like my brother, though.");
		// callback("Bummer ehn... not built yet");
	}

	this.branchCommitPushPR = function(buildstamp,callback) {
		// these aren't modifiable, so it's never an error.
		callback(null);
	}	

}