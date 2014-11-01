module.exports = function(mongoose,manager) {

	// We instantiate builders for each specification.
	var moment = require('moment');
	var async = require('async');
	var Builder = require("./Builder.js"); 
	//	var builder = new Builder(opts,irc);

	var validator = {
		slug: '^[\\w\S]+$',
		method: '^(http|http|http)$',
		docker_tag: '^[a-zA-Z0-9\:\\/\-_.]+$',
		git_repo: '^[\\w\\-]+\\/[\\w\\-]+$',
		git_path: '^[\\w\\/\\.\\-\\@\\~]+$',
		host: '^(([a-zA-Z]{1})|([a-zA-Z]{1}[a-zA-Z]{1})|([a-zA-Z]{1}[0-9]{1})|([0-9]{1}[a-zA-Z]{1})|([a-zA-Z0-9][a-zA-Z0-9-_]{1,61}[a-zA-Z0-9]))\\.([a-zA-Z]{2,6}|[a-zA-Z0-9-]{2,30}\\.[a-zA-Z]{2,3})$',
	};

	// Setup a schema.
	var releaseSchema = mongoose.Schema({

		// -------------- Over arching.
		owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 				// Who owns this?
		active: Boolean,											  				// Is this currently active?
		method: {type: String, match: new RegExp(validator.method) },  				// Update method -- For now, just "http", other methods, later.
		slug: { type: String, unique: true, match: new RegExp(validator.slug) }, 	// An index/slug to refer to.
		docker_tag: {type: String, match: new RegExp(validator.docker_tag) },		// What's the name of the docker image tag?

		// --------------- Method: http
		host: {type: String, match: new RegExp(validator.host) },					// [http] What's the host to look at with http method?
		url_path: String,															// [http] What's the path from there?
		check_minutes: [Number], 													// At which minutes on the clock do we check?

		// ----------- Git variables.
		git_enabled: Boolean,														// Do we use git to update?
		git_repo: { type: String, match: new RegExp(validator.git_repo) },			// What's the git repo?
		git_path: {type: String, match: new RegExp(validator.git_path) },			// This is the path to the dockerfile in the git repo
		branch_name: String,														// What's the NEW branch name you'd like?
		branch_master: String,														// What's your master branch name?

		// ------------ Job properties.
		job: {						// Here's our associate job.
			exists: Boolean,		// Is there a job at all?
			active: Boolean,		// Is the job checking for updates?
			last_check: Date,		// When did it last check?
			error: String,			// Is there an error?
			in_progress: Boolean, 	// Is a build in progress?
		},

	}, { collection: 'releases' });

	// We want virtuals when we export to json.
	// releaseSchema.set('toObject', { virtuals: true });

	// An array of available hours for comparison.
	/* 

	  releaseSchema.virtual('hoursarray')
		.get(function () {
			var hoursarray = [];
			for (var i = this.playstart; i <= this.playend; i++) {
				hoursarray.push(i);
			}
			return hoursarray;
		});

	*/

	// Compile it to a model.
	var Release = mongoose.model('Release', releaseSchema);
	
	// The method is enumerated, so we'll enforce that.
	Release.schema.path('method').validate(function (value) {
	  
	  if (value === '' || typeof value === 'undefined') {
	  	return true;
	  }

	  // It's only http right now... Later... We'll have other methods like: github PR's and stuff like that.
	  return /http|http|http/.test(value);

	}, 'Invalid release method');

	// the check minutes must be a list, and all values must be between 0 and 59.
	Release.schema.path('check_minutes').validate(function (value) {

		if (value.length) {
			for (var i = 0; i < value.length; i++) {
				if (typeof value[i] == 'number') {
					if (value[i] < 0 || value[i] > 59) {
						return false;
					}
				} else {
					return false;
				}
			}

			return true;
		} else {
			return false;			
		}

	}, 'check_minutes must have at least one value, and all values must be between 0 and 59');

	// Allow a dependency to be injected after instantiation.
	// ...for now we need the manager.
	this.inject = function(in_manager) {
		manager = in_manager;
	}

	this.isOwner = function(userid,releaseid,callback) {
		Release.findOne({
			owner: userid,
			_id: releaseid
		},function(err,rel){
			if (!err) {


				if (rel) {
					callback(null,true);
				} else {
					callback(null,false);
				}

			} else {
				callback("Mongo error, couldn't check isOwner: " + err);
			}
		});
	}

	this.getActive = function(callback) {

		Release.find({active: true},function(err,rels){

			if (!err) {

				// console.log("!trace your active searches: ",rels);
				callback(null,rels);

			} else {
				callback("Mongo error, couldn't init: " + err);
			}

		});

	}

	this.getReleases = function(filter,callback) {

		if (!filter) {
			filter = {};
		}

		// console.log("!trace filter : ",filter);

		// TODO: This will be filtered in the future.
		Release.find(filter,function(err,rels){
		
			if (!err) {

				async.map(rels, function(item,callback){

					manager.jobProperties(item.slug,function(err,props){
						item.job = props;
						// console.log("!trace jobProperties full: ",item);
						callback(err,item);
					});

				}, function(err, results){
				    // results is now an array of stats for each file
				    callback(results);

				});


			} else {
				callback("Mongo error, couldn't getReleases: " + err);
			}

		});

	}

	this.getSlug = function(releaseid,callback) {

		Release.findOne({_id: releaseid},function(err,rel){
			if (!err) {
				if (rel) {
					callback(null,rel.slug);
				} else {
					callback("Release, couldn't getSlug for id: " + releaseid);	
				}
			} else {
				callback("Mongo error, couldn't getSlug: " + err);	
			}
		});

	}

	this.getValidator = function(callback) {

		callback(validator);

	}



}
