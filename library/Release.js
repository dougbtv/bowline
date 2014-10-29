module.exports = function(mongoose,manager) {

	// We instantiate builders for each specification.
	var moment = require('moment');
	var async = require('async');
	var Builder = require("./Builder.js"); 
	//	var builder = new Builder(opts,irc);


	// Setup a schema.
	var releaseSchema = mongoose.Schema({

		active: Boolean,		// Is this currently active?
		method: String,			// Update method -- For now, just "http", other methods, later.

		slug: String,			// An index/slug to refer to.

		host: String,			// [http] What's the host to look at with http method?
		url_path: String,		// [http] What's the path from there?
		
		check_minutes: [Number], // At which minutes on the clock do we check?

		git_repo: String,		// What's the git repo?
		git_path: String,		// This is the path to the dockerfile in the git repo
		branch_name: String,	// What's the NEW branch name you'd like?
		branch_master: String,	// What's your master branch name?
		
		docker_tag: String,		// What's the name of the docker image tag?

		job: {
			active: Boolean,
			last_check: Date,
		},		// Here's our associate job.

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

	// Check out the docker path for validation
	Release.schema.path('docker_tag').validate(function (value) {

		var re = new RegExp("[a-zA-Z0-9\:\\/\-_.]");
		return re.test(value);

	}, 'Docker tag must match [a-zA-Z0-9:/-_.]');

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

		// It's only http right now... Later... We'll have other methods like: github PR's and stuff like that.
		return /http|http|http/.test(value);

	}, 'check_minutes must have at least one value, and all values must be between 0 and 59');

	// Allow a dependency to be injected after instantiation.
	// ...for now we need the manager.
	this.inject = function(in_manager) {
		manager = in_manager;
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

	this.getReleases = function(callback) {

		// TODO: This will be filtered in the future.
		Release.find({},function(err,rels){
		
			if (!err) {

				async.map(rels, function(item,callback){

					manager.jobProperties(item.slug,function(err,props){
						// console.log("!trace jobProperties: ",props);
						item.job = props;
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



}
