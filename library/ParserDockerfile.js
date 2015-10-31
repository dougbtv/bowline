module.exports = function(bowline,opts,log) {

	var fs = require('fs');

	this.readDockerfile = function(path_dockerfile,callback) {

		fs.readFile(path_dockerfile, 'utf8', function (err, dockerfile_contents) {
			if (!err) {

				getFrom(dockerfile_contents,function(err,dockerfile_from){
					if (!err) {
						callback(false,{
							from: dockerfile_from,
							contents: dockerfile_contents
						});
					} else {
						log.warn("parser_dockerfile_nofrom",{dockerfile_contents: dockerfile_contents});
						callback("Darn, there was no FROM line in the dockerfile");						
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

}