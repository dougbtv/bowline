module.exports = function(bowline,opts,log) {

	// console.log("!trace it's the messenger");

	this.buildBegins = function(releaseid,callback) {

		bowline.release.getReleases({ _id: releaseid },function(rels){

			var rel = rels[0];

			if (rel) {

				console.log("!trace buildBegins rel: ",rel);
				// Ok, send a message for each user.
				this.getCollaborators(rel,function(collabs){

					collabs.forEach(function(collab){
						bowline.socketserver.buildBegins(rel.slug,collab.username,rel._id);
					});

				}.bind(this));
				

			} else {
				log.error("messenger_beginfail",{releaseid: releaseid, note: "not found"});
				callback("release not found for messaging");
			}

		}.bind(this));

	}

	this.getCollaborators = function(rel,callback) {

		var collabs = [];
		collabs.push(rel.owner.username);

		for (var i = 0; i < rel.collaborators.length; i++) {
			collabs.push(rel.collaborators[i]);
		}

		callback(collabs);

	}

}