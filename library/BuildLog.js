module.exports = function(mongoose,log) {

	var moment = require('moment');
	var async = require('async');

	var buildLogScheme = mongoose.Schema({
		release: mongoose.Schema.Types.ObjectId,
		success: Boolean,
		startdate: Date,
		enddate: Date,
		log: String,
	}, { collection: 'buildlogs' });

	var BuildLog = mongoose.model('BuildLog', buildLogScheme);

	this.addBuildLog = function(releaseid,start,end,log,success,callback) {

		var build = new BuildLog;

		build.release = mongoose.Types.ObjectId(releaseid);
		build.success = success;
		build.log = log;
		build.startdate = start;
		build.enddate = end;

		build.save(function(err){
			if (err) {
				log.error("save_build_mongoerr",err);
			}
			callback(err);
		});
		
	}
	
}