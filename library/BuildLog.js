module.exports = function(mongoose,log) {

	var moment = require('moment');
	var async = require('async');

	var buildLogScheme = mongoose.Schema({
		release: mongoose.Schema.Types.ObjectId,
		success: Boolean,
		startdate: Date,
		enddate: Date,
		commit: String,
		log: String,
	}, { collection: 'buildlogs' });

	var BuildLog = mongoose.model('BuildLog', buildLogScheme);

	this.addBuildLog = function(releaseid,commit,start,end,log,success,callback) {

		var build = new BuildLog;

		build.release = mongoose.Types.ObjectId(releaseid);
		build.success = success;
		build.commit = commit;
		build.log = log;
		build.startdate = start;
		build.enddate = end;

		build.save(function(err){
			if (err) {
				log.error("save_buildlog_mongoerr",err);
			}
			callback(err);
		});
		
	}

	this.getLogText = function(releaseid,logid,callback) {

		// console.log("!trace getLogText",releaseid,logid);

		BuildLog.findOne({_id: mongoose.Types.ObjectId(logid)},'log',function(err,blog){

			if (!err) {
				callback(null,blog.log);
			} else {
				log.error("buildlog_getlogtext",err);
				callback(err);	
			}

		});

	}

	// Get a list of logs, minus the actual log text (it can be huuuuuge)
	this.getLogs = function(releaseid,callback) {

		BuildLog.find({release: releaseid},'-log')
			.sort({enddate: -1})
			.exec(function(err,logs){

				if (err) {
					log.error("get_buildlog_mongoerr",err);
				}

				callback(err,logs);

			});

	}
	
}