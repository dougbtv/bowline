module.exports = function(inrelease,bowline,opts,log) {

	// an instance of the applicable release.
	this.release = inrelease;

	// our working head commit
	this.commit = '';


	// our deps.
	var moment = require('moment');
	var async = require('async');
	var exec = require('child_process').exec;

	this.clone = function(callback) {
		callback("nopez... clone isn't build yet.");
	}

	this.verify = function(callback) {
		callback("sorry, no, verify for vanilla is not built yet");
	}

	this.success = function(callback) {
		callback("Bummer ehn... not built yet");
	}

	this.branchCommitPushPR = function(buildstamp,callback) {
		// these aren't modifiable, so it's never an error.
		callback(null);
	}	

}