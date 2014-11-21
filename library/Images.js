module.exports = function(bowline,opts,log,mongoose) {

	var moment = require('moment');
	var async = require('async');

	var imagesScheme = mongoose.Schema({
		imageid: String,
		indate: Date,
	}, { collection: 'images' });

	var Images = mongoose.model('Images', imagesScheme);

	this.add = function(imageid,callback) {

		var im = new Images;
		im.imageid = imageid;
		im.indate = new Date;

		im.save(function(err){
			if (err) {
				log.error("image_save",{err: err});
			}
			callback(err);
		});

	}

	this.getLastUpdate = function(imageid,callback) {

		Images.findOne({ imageid: imageid },function(err,im){

			if (!err && im) {

				callback(null,im.indate);

			} else {
				log.error("image_notfound",{err: err});
				callback("image_notfound");
			}

		});

	}

}