module.exports = function(inrelease,gitcommon,bowline,opts,log) {

	// an instance of the applicable release.
	this.release = inrelease;

	// we'll reference this when we comment on a PR.
	this.last_pullrequest = 0;

	// What's the HEAD commit-ish?
	this.commit = '';
	this.branches = {};

	// -- our deps.
	var moment = require('moment');
	var async = require('async');
	var exec = require('child_process').exec;
	var request = require("request");

	// for Breaking up the repo options
	// Ok, we need to do a little work on those git repo names to break it apart.
	repo_username = this.release.git_repo.replace(/^(.+)\/.+$/,"$1");
	repo_name = this.release.git_repo.replace(/^.+\/(.+)$/,"$1");

	this.clone = function(callback) {

		var giturl = 'https://' + opts.gituser + ':' + opts.gitpassword + '@github.com/' + this.release.git_repo + ".git ";
		
		gitcommon.clone(this.release,giturl,function(err,clone){
			if (!err) {
				this.commit = clone.commit;
				this.branches = clone.branches;
				callback(err,clone);
			} else {
				log.warn("error_github_clone","In GitHub, error with GitCommon clone: " + err);
				callback(err);
			}
		}.bind(this));
		
	}

	this.checkout = function(branch,callback) {
		gitcommon.checkout(branch,function(err){
			callback(err);
		});
	}

	this.success = function(callback) {

		// last_pullrequest
		if (this.release.git_enabled) {
			bowline.github.issues.createComment({
				user: repo_username,
				repo: repo_name,
				body: "Build complete", 		// , log posted @ " + url,
				number: this.last_pullrequest,
			},function(err,result){
				if (err) {
					log.it("Oooops, somehow the github issue comment failed: " + err);
				}
				// console.log("!trace PULL REQUEST err/result: ",err,result);
				// callback(err,result);
			}.bind(this));
		} else {
			// callback(null);					
		}

	}

	this.verify = function(callback) {

		async.series({

			repo_exists: function(callback) {

				request({
					uri: "https://api.github.com/repos/" + this.release.git_repo,
					method: "GET",
					timeout: 10000,
					auth: {
						user: opts.gituser,
						pass: opts.gitpassword,
					
					},
					headers: { 
						'User-Agent': 'Bowline Autobuilder Bot',
					}
				}, function(err, response, body) {						

					if (!err) {

						var apireturns = JSON.parse(body);

						if (typeof apireturns.name != 'undefined') {
							// Great, looks good.
							callback(null);
						} else {
							callback("Sorry the github repo doesn't exist: '" + this.release.git_repo + "'");
						}

					} else {
						callback("Ack http error talking to github api when trying to repo_exists");
					}

				}.bind(this));

			}.bind(this),

			clone: function(callback) {

				this.clone(function(err){
					callback(err);
				});

			}.bind(this),

		},function(err,results){

			if (err) {
				log.warn("github_verify_fail",{releaseid: this.release._id, err: err, series_results: results});
			}

			// log.it("verify_worked","good it looks like it works");

			callback(err);

		}.bind(this));
	}

	this.branchCommitPushPR = function(buildstamp,callback) {

		// Only do this if the release is "git enabled" (TODO: That's a misnomer.)
		if (!this.release.git_enabled || opts.disable_github) {
			callback(null);
		} else {

			// Ok, let's clone the repo, and update it.
			var branch_name = this.release.slug + "-" + buildstamp;
			
			async.series({
				
				// 1. Branch from master
				branch: function(callback){
					exec('git checkout -b ' + branch_name, {cwd: this.release.clone_path}, function(err,stdout){
						// console.log("!trace branch stdout: ",stdout);
						callback(err,stdout);
					});
				}.bind(this),

				branch_verbose: function(callback){
					exec('git branch -v', {cwd: this.release.clone_path}, function(err,stdout){
						// console.log("!trace branch -v stdout: \n",stdout);
						callback(err,stdout);
					});
				}.bind(this),

				git_add: function(callback){
					exec('git add --all', {cwd: this.release.clone_path}, function(err,stdout){ callback(err,stdout); });
				}.bind(this),

				git_commit: function(callback){
					exec('git commit -m "[autobuild] Updating @ ' + buildstamp + '"', {cwd: this.release.clone_path}, function(err,stdout){ callback(err,stdout); });
				}.bind(this),

				git_push: function(callback){
					exec('git push origin ' + branch_name, {cwd: this.release.clone_path}, function(err,stdout){ callback(err,stdout); });
				}.bind(this),

				pull_request: function(callback) {

					console.log("!trace @ pull_request: " + this.release);

					// console.log("!trace PLAIN REPO: |" + repo_name + "|");

					bowline.github.pullRequests.create({
						user: repo_username,
						repo: repo_name,
						title: "[autobuild] Updating Asterisk @ " + buildstamp,
						body: "Your friendly builder bot here saying that we're updating @ " + buildstamp,
						base: this.release.branch_master,
						head: branch_name,
					},function(err,result){
						if (!err) {
							// Keep our last pull request.
							this.last_pullrequest = result.number;
						}
						// console.log("!trace PULL REQUEST err/result: ",err,result);
						callback(err,result);
					}.bind(this));

				}.bind(this),

				// Alright, that's great, all we need to do is simply.
				
				// 2. Edit the file.
				// 3. Stage changes.
				// 4. commit
				// 5. Push.

			},function(err,result){
				if (!err) {

					// console.log("!trace gitModifyClone RESULTS");
					// console.log(JSON.stringify(result, null, 2));

					log.it("Repo cloned & updated, pull request @ " + result.pull_request.html_url);
					callback(null);

				} else {
					var errtxt = "ERROR with the gitModifyClone: " + err
					log.err("github_branch_commit",err);
					callback(errtxt);
				}
			}.bind(this));

		}

	}

}