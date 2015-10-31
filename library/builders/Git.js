module.exports = function(inrelease,gitcommon,bowline,opts,log) {

	// an instance of the applicable release.
	this.release = inrelease;

	// our working head commit
	this.commit = '';
	this.branches = {};


	// our deps.
	var moment = require('moment');
	var async = require('async');
	var exec = require('child_process').exec;

	this.clone = function(callback) {
		
		gitcommon.clone(this.release,this.release.git_url,function(err,clone){
			if (!err) {
				this.commit = clone.commit;
				this.branches = clone.branches;
				callback(err,clone);
			} else {
				log.warn("vanilla_git_clone","err with that: " + err);
				callback(err);
			}
		}.bind(this));
	}

	this.checkout = function(branch,callback) {
		gitcommon.checkout(branch,function(err){
			callback(err);
		});
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