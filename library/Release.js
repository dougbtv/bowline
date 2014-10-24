module.exports = function(mongoose) {

	// We instantiate builders for each specification.
	var moment = require('moment');
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

		branch_name: String,	// What's the NEW branch name you'd like?
		branch_master: String,	// What's your master branch name?

		docker_tag: String,		// What's the name of the docker image tag?
		git_repo: String,		// What's the git repo?
		git_path: String,		// What's the git repo?


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

		// It's only http right now... Later... We'll have other methods like: github PR's and stuff like that.
		return /http|http|http/.test(value);

	}, 'check_minutes must have at least one value, and all values must be between 0 and 59');


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



}
