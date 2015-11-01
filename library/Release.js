module.exports = function(bowline,opts,log,mongoose) {

	var moment = require('moment');
	var async = require('async');
	
	// A child object is the build log.
	var BuildLog = require('./BuildLog.js');
	var buildlog = new BuildLog(mongoose,log);

	var validator = {
		slug: '^[\\w\S]+$',
		method: '^(http|hook|manual)$',
		hook_secret: '^[\\w\\-]+$',
		docker_tag: '^[a-zA-Z0-9\:\\/\\-_.]+$',
		git_repo: '^[\\w\\-]+\\/[\\w\\-]+$',
		git_url: '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$',
		git_path: '^[\\w\\/\\.\\-\\@\\~]+$',
		host: '^(([a-zA-Z]{1})|([a-zA-Z]{1}[a-zA-Z]{1})|([a-zA-Z]{1}[0-9]{1})|([0-9]{1}[a-zA-Z]{1})|([a-zA-Z0-9][a-zA-Z0-9-_]{1,61}[a-zA-Z0-9]))\\.([a-zA-Z]{2,6}|[a-zA-Z0-9-]{2,30}\\.[a-zA-Z]{2,3})$',
		branch_master: '^[\\w\\d-\\.\\/]+$', // see: http://tinyurl.com/buk567q
	};

	var branchSchema = new mongoose.Schema({
		name: String,
		dockerfile: String,
		from: String,
		bowlinetag: String,
		update_from: { type: Boolean, default: true},
	});

	branchSchema.virtual('dockerfile_array')
		.get(function () {
			if (this.dockerfile) {
				var dfa = this.dockerfile.split("\n");
				if (dfa[dfa.length-1] == "") {
					dfa.pop();
				}
				return dfa;
			} else {
				return [];
			}
			
		});

	// Setup a schema.
	var releaseSchema = mongoose.Schema({

		// -------------- Over arching.
		owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 				// Who owns this?
		active: Boolean,											  				// Is this currently active?
		slug: { type: String, unique: true, match: new RegExp(validator.slug) }, 	// An index/slug to refer to.
		docker_tag: {type: String, required: true, match: new RegExp(validator.docker_tag) },		// What's the name of the docker image tag?
		dockerfile: String,															// Yep that's the dockerfile
		from: String, 																// The dockerfile FROM base image
		
		// -------------- Colaborators
		collaborators: [
			{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		],

		private: Boolean,

		// --------------- Storage options
		store_dockerhub: Boolean,
		store_local: Boolean,

		// --------------- Family options
		upstream_update: Boolean,													// Update this release when base image has been updated

		// --------------- Branch settings
		branches: [ branchSchema ],

		// --------------- Update methods.
		method: {type: String, match: new RegExp(validator.method) },  				// Update method -- For now, just "http", other methods, later.
		
			// --------------- Method: http
			host: {type: String, match: new RegExp(validator.host) },				// [http] What's the host to look at with http method?
			url_path: String,														// [http] What's the path from there?
			check_minutes: [Number], 												// At which minutes on the clock do we check?

			// --------------- Method: git hook.
			hook_secret: {type: String, unique: true, match: new RegExp(validator.hook_secret) },	// A secret to be passed in git hook.


		// ----------- Git variables.
		git_method: String,																	// What git method do we use? (pure git or github)
		git_enabled: Boolean,																// Do we upate the git repo?
		git_repo: { type: String, required: false, match: new RegExp(validator.git_repo) },	// What's the git repo?
		git_path: { type: String, required: true, match: new RegExp(validator.git_path) },	// This is the path to the dockerfile in the git repo
		git_url: { type: String, required: false, match: new RegExp(validator.git_url) },
		branch_name: { type: String, required: true },										// What's the NEW branch name you'd like?
		branch_master: { type: String, required: true, match: new RegExp(validator.branch_master) }, // What's your master branch name?

		// github specific variables
		github_oauth: String,

		// temporal properties
		last_build: Date,
		last_commit: String,

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
	releaseSchema.set('toObject', { virtuals: true });

	releaseSchema.virtual('git_hookurl')
		.get(function () {
			return "http://" + opts.bowline_domain + "/api/gitHookUpdate/" + this.hook_secret;
		});
	
	releaseSchema.virtual('dockerfile_array')
		.get(function () {
			if (this.dockerfile) {
				var dfa = this.dockerfile.split("\n");
				if (dfa[dfa.length-1] == "") {
					dfa.pop();
				}
				return dfa;
			} else {
				return [];
			}
			
		});

	releaseSchema.options.toObject.transform = function (doc, ret, options) {
		if (options.hide) {
			options.hide.split(' ').forEach(function (prop) {
				delete ret[prop];
			});
		}
	};

	// Compile it to a model.
	var Release = mongoose.model('Release', releaseSchema);
	
	// git method is also enum.
	Release.schema.path('git_method').validate(function (value) {
	  
	  if (value === '' || typeof value === 'undefined') {
	  	return true;
	  }

	  return /github|git/.test(value);

	}, 'Invalid release method');

	

	// the check minutes must be a list, and all values must be between 0 and 59.
	Release.schema.path('check_minutes').validate(function (value) {

		// This only applies for http method.
		if (this.method != 'http') {
			return true;
		}

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

	this.updateReleaseProperties = function(source,dest,callback) {

		dest.slug = source.slug;
		dest.method = source.method;
		dest.docker_tag = source.docker_tag;
		dest.host = source.host;
		dest.url_path = source.url_path;
		dest.upstream_update = source.upstream_update;

		dest.hook_secret = source.hook_secret;
		dest.git_enabled = source.git_enabled;
		dest.git_method = source.git_method;
		dest.git_repo = source.git_repo;
		dest.git_url = source.git_url;
		dest.git_path = source.git_path;
		dest.branch_name = source.branch_name;
		dest.branch_master = source.branch_master;

		// Iteratively add collabs.
		dest.collaborators = [];
		if (source.collaborators) {
			if (source.collaborators.length) {
				for (var i = 0; i < source.collaborators.length; i++) {
					dest.collaborators.push(
						mongoose.Types.ObjectId(source.collaborators[i]._id)
					);
				}
			}
		}

		dest.store_dockerhub = source.store_dockerhub;
		dest.store_local = source.store_local;

		if (source.method == 'http') {

			dest.check_minutes = source.check_minutes;
			
		}

		dest.save(function(err){
			callback(err);
		});

	}

	this.getFamily = function(id,callback) {
		// Alright, we're going to create a little family tree here.
		// We'll look for:
		// The parent. (there's only ever one, and it's optional)
		// The children. (there could be none, one or many)
		// The siblings,. (there could be none, one or many)

		var family = {
			parent: false,
			children: [],
			siblings: [],
		};

		var selected_fields = 'docker_tag slug last_build _id upstream_update';

		// Pull up the release in question.
		Release.findOne({ _id: id },function(err,release){

			// Make sure it's legit.
			if (!err && release) {
				
				async.series({

					// Get the parent
					get_parent: function(callback){
						
						Release.findOne({ docker_tag: release.from }, selected_fields,function(err,parent){
							if (err) {
								console.log("getfamily_parent",err);
							}
							family.parent = parent;
							callback(err);
						});

					}.bind(this),

					// Get the children
					get_children: function(callback){
						
						Release.find({ from: release.docker_tag }, selected_fields,function(err,children){
							if (err) {
								console.log("getfamily_children",err);
							}
							family.children = children;
							callback(err);
						});

					}.bind(this),

					// Get the siblings
					get_siblings: function(callback){
						
						Release.find({ from: release.from, docker_tag: { $ne: release.docker_tag } }, selected_fields,function(err,siblings){
							if (err) {
								console.log("getfamily_siblings",err);
							}
							family.siblings = siblings;
							callback(err);
						});

					}.bind(this),
					

				},function(err){

					if (err) {
						log.error("release_getFamily",err);
					}

					callback(err,family);

				}.bind(this));

			} else {

				if (err) {
					log.err("release_getFamily_existance_check",err);
				}

				callback("Sorry, no release exited.");

			}

		});

		

	}

	// !bang
	this.getChildrenToUpdate = function(id,callback) {

		// Let's make a list of slugs.
		var slugs = [];

		// Pull up the whole family.
		this.getFamily(id,function(err,family){
			if (!err) {

				// Operate when there are children.
				if (family.children.length) {

					// Push members that are flagged for upstream update
					family.children.forEach(function(fmember){
						if (fmember.upstream_update) {
							slugs.push(fmember.slug);
						}
					});

				}

			} else {
				log.err("release_getchildrentoupdate",err);
			}

			callback(err,slugs);
			
		});


	}

	this.findByHookSecret = function(hook_secret,callback) {

		var searchpack = {hook_secret: hook_secret};
		// console.log("!trace findByHookSecret searchpack: ",searchpack);

		this.getReleases(true,searchpack,function(rels){

			if (rels) {
				callback(null,rels[0]);
			} else {
				log.it("hook_secret_notfound",{hook_secret: hook_secret});
				callback("hook_secret_notfound");
			}
			
		});

	}

	this.addRelease = function(inrelease,userid,callback) {

		// console.log("!trace addRelease: userid: %s | inrelease",userid,inrelease);

		var release = new Release;
		release.owner = mongoose.Types.ObjectId(userid);
		release.active = true;

		this.updateReleaseProperties(inrelease,release,function(err){

			if (err) {
				log.error("add_release",{err: err});
			}

			callback(err,release._id);

		});

	};

	this.editRelease = function(inrelease,callback) {

		// alright, we should find this release, then we'll edit it.
		Release.findOne({
			_id: inrelease._id
		},function(err,release){
			if (!err) {
				
				this.updateReleaseProperties(inrelease,release,function(err){

					callback(err,inrelease._id);

				});

			} else {
				callback("Mongo error, couldn't get editRelease: " + err);
			}
		}.bind(this));

	};

	this.deleteRelease = function(releaseid,callback) {

		Release.find({ _id: releaseid })
			.remove()
			.exec(function(err){
				if (err) {
					log.error("delete_release",{err: err});
				}
				callback(err);
			});

	}

	var getBranchIndex = function(release_branches,find_branch_name,callback) {

		// log.it("release_getbranchidx",{searching_for: find_branch_name, release_branches: release_branches});

		var exists = -1;
		if (release_branches.length) {
			release_branches.forEach(function(branch,idx){
				if (branch.name == find_branch_name) {
					exists = idx;
				}
			});
		}
		callback(false,exists);

	}

	// The gist of this is to make sure the datastructure of branches exists
	// given what's available in git.
	// so this is called when we clone -- basically.
	this.setupBranches = function(releaseid,branch_packs,callback) {

		// !bang
		// Alright, so let's pull up this guy...
		Release.findOne({_id: releaseid},function(err,release){

		if (!err && release) {
	
				var release_branches = release.branches;
	
				async.eachSeries(branch_packs,function(pack,callback){

					getBranchIndex(release_branches,pack.branch,function(err,branchidx){

						// log.it("release_setupbranch_branchidx",{branchidx: branchidx});
						// Update or add?
						var updated_branch = {
							name: pack.branch,
							dockerfile: pack.contents,
							from: pack.from,
							bowlinetag: pack.bowlinetag,
						};

						if (branchidx < 0) {

							// Here's where we do the setup... for a brand new branch.
							// log.it("release_setupbranches_new_branch",{pack: pack});
							release_branches.push(updated_branch);

						} else {

							// It's already there, update it.
							// log.it("release_setupbranches_update_branch",{pack: pack});
							release_branches[branchidx].dockerfile = pack.contents;
							release_branches[branchidx].from = pack.from;
							release_branches[branchidx].bowlinetag = pack.bowlinetag;
						
						}

						callback(false);

					});

				},function(err){
					// We'll just save every time, not super efficient, but, oh well.

					release.branches = release_branches;

					release.save(function(err){
						if (!err) {
							callback(false);
						} else {
							log.it("release_setupbranches_save_err",{err: err});
							callback(err);
						}
					});
				});

			} else {
				log.error("release_setupbranches_notfound",{err: err, releaseid: releaseid});
				callback("release_setupbranches_notfound");
			}

		});

	}

	this.updateDockerfile = function(releaseid,dockerfile,from,callback) {

		log.it("release_updatedockerfile",{releaseid: releaseid, dockerfile: dockerfile, from: from});

		Release.update(
			{ _id: releaseid },
			{ dockerfile: dockerfile, from: from  },
			function(err){

				if (err) {
					log.error("mongo_update_dockerfile",err);
				}

				callback(err);

			});

	}

	this.addBuild = function(releaseid,commit,start,end,log,success,callback) {

		buildlog.addBuildLog(releaseid,commit,start,end,log,success,function(err){
			callback(err);
		});

	}

	this.getLogs = function(releaseid,startpos,endpos,callback) {

		buildlog.getLogs(releaseid,startpos,endpos,function(err,logs){
			callback(err,logs);
		});

	}

	this.getLogText = function(releaseid,logid,callback) {

		buildlog.getLogText(releaseid,logid,function(err,logtext){
			callback(err,logtext);
		});

	}

	this.isOwner = function(userid,releaseid,callback) {
		Release.findOne({
			$or: [{owner: userid},{collaborators: userid}],
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

	this.updateLastBuildStamp = function(releaseid,commit,callback) {

		if (typeof callback == 'undefined') {
			callback = function(){};
		}

		Release.findOne({ _id: releaseid},function(err,rel){

			if (!err && rel) {

 				rel.last_build = new Date();
 				rel.last_commit = commit;
 				rel.save(function(err){
 					callback(err);
 				});

			} else {
				log.error("release_update_lastbuildstamp",{note: "wasn't found", err: err});
				callback("release wasn't foudn for last buildstamp");
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

	// TODO: This doesn't account for privacy (as with a lot)
	this.getReleaseList = function(userid,search,callback) {

		var andarray = [];

		// Get for a specific user or collaborator if userid is defined.
		if (userid) {
			andarray.push({ $or: [{owner: userid},{collaborators: userid}] });
		}

		// We'll also search by a regex if search is defined.
		if (search) {
			var sregex = new RegExp(search,"ig");
			andarray.push({ $or: [
				{ slug: sregex },
				{ docker_tag: sregex }
			]});
		}

		var searchpack = {};

		if (userid || search) {
			searchpack = { $and: andarray };
		}

		// console.log("!trace getReleaseList input: ",userid,search);
		// console.log("!trace getReleaseList searchpack: %j",searchpack);

		this.getReleases(false,searchpack,function(results){
			callback(results);
		});

	}

	this.getReleases = function(isowner,filter,callback) {

		if (!filter) {
			filter = {};
		}

		// console.log("!trace filter : ",filter);

		// TODO: This will be filtered in the future.
		Release.find(filter)
			.populate('collaborators','_id username profile.gravatar_hash')
			.populate('owner','_id username profile.gravatar_hash')
			.sort({last_build: -1})
			.sort({docker_tag: 1})
			.exec(function(err,rels){
		
				if (!err) {

					async.map(rels, function(item,callback){

						bowline.manager.jobProperties(item.slug,function(err,props){
							item.job = props;
							// console.log("!trace jobProperties full: ",item);
							var hiding = 'hook_secret';
							if (isowner) {
								hiding = '';
							}
							callback(err,item.toObject({ hide: hiding, transform: true, virtuals: true }));
						});

					}, function(err, results){
					    
					    callback(results);

					});


				} else {
					callback("Mongo error, couldn't getReleases: " + err);
				}

			});

	}

	var getReleases = this.getReleases;

	this.exists = function(username,namespace,callback) {

		// Ok, string together the username and namespace
		var docker_tag = username + "/" + namespace;

		// console.log("!trace search? ",{ docker_tag: docker_tag });

		// Hrmmm, more than one can exist.
		// But, that's OK, it's just gotta be registered at least once.
		Release.findOne({ docker_tag: docker_tag },function(err,release){

			if (!err && release) {
				callback(release._id);
			} else {

				if (err) {
					log.err("release_exists_mongo",err);
				}
				callback(false);

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
