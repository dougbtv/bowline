module.exports = function(bowline,opts,log) {

	var fs = require('fs');
	var async = require('async');

	this.readDockerfile = function(path_dockerfile,callback) {

		fs.readFile(path_dockerfile, 'utf8', function (err, dockerfile_contents) {
			if (!err) {

				async.series({
					from: function(callback){
						getFrom(dockerfile_contents,function(err,dockerfile_from){
							if (!err) {
								callback(false,dockerfile_from);
							} else {
								log.warn("parser_dockerfile_nofrom",{dockerfile_contents: dockerfile_contents});
								callback("Darn, there was no FROM line in the dockerfile");						
							}
						});
					},
					bowlinetag: function(callback){
						getBowlineTag(dockerfile_contents,function(err,bowlinetag){
							callback(false,bowlinetag);
						});
					},
				},function(err,results){
					if (!err) {
						callback(false,{
							from: results.from,
							contents: dockerfile_contents,
							bowlinetag: results.bowlinetag,
						});
					} else {
						callback(err);
					}
				});

				
			} else {
				log.warn("parser_readfile_error",{err: err});
				callback("Damn, couldn't read the dockerfile when looking for environment variable.");
			}			

		}.bind(this));

	}

	var readDockerfile = this.readDockerfile;

	this.getFrom = function(contents,callback) {

		// Let's parse the FROM out of the dockerfile
		var dockerfile_from = false;

		contents.split("\n").forEach(function(line){

			// make sure you trim that up...
			line = line.trim();

			// omit comments....
			if (!line.match(/^\s*#.+$/)) {

				// And we'll operate on only the first line.
				if (line.match(/FROM/i)) {
					if (!dockerfile_from) {
						// Parse out the field it's from
						dockerfile_from = line.replace(/^\s*FROM\s+([\S]+).*$/,"$1");
						// log.it("check_from",dockerfile_from);
					}
				}
			}

		}.bind(this));

		callback(!dockerfile_from,dockerfile_from);

	}

	var getFrom = this.getFrom;

	// formerly: parseDockerfileForTagging
	this.getBowlineTag = function(filecontents,callback) {

		// Set the release tag to null.
		var tag_result = null;
		
		// Split by new lines, and look for #bowline

		filecontents.split("\n").forEach(function(line){

			if (line.match(/\#bowline/)) {
				// Ok, it's got bowline, let's break it up.
				var pts = line.split(/\s+/);
				if (pts[0] == "#bowline" && pts[1] == "tag") {
					// Then use the third element.
					var tag = pts[2];
					if (tag.match(/^[\d\.\-]+$/)) {
						// Ok, we can use that tag.
						tag_result = tag;
						// log.it("parsed_tag",{tag: tag_result});
					}
				}
			}

		}.bind(this));

		callback(!tag_result,tag_result);

	}

	var getBowlineTag = this.getBowlineTag;

}