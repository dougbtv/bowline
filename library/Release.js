module.exports = function(mongoose) {

		// Setup a schema.
	var releaseSchema = mongoose.Schema({

		method: String,

		host: String,
		url_path: String,
		clone_path: String,
		branch_name: String,
		brach_master: String,

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

	



}
