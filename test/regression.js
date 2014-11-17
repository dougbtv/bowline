var restify = require('restify');
var client = restify.createJsonClient({
	version: '*',
	// connectTimeout: 500,
	// requestTimeout: 500,
	url: 'http://127.0.0.1:8000'
});

var fork = require('child_process').fork;

var TEST_USERNAME = 'tester';
var TEST_PASSWORD = 'testertester';

// Start up bowline.
var bowline;
bowline = fork('./bowline.js',['--logfile','/tmp/bowline.log','--skipautostart']);

var NEW_RELEASE = {
	session: {
		username: TEST_USERNAME,
		password: TEST_PASSWORD
	},
	release: {
		hook_secret: "fb6a6f72-e71a-415b-b725-48c14c79a732",
		branch_name: "autobuild",
		branch_master: "master",
		slug: "helloworld",
		docker_tag: "dougbtv/helloworld",
		store_local: true,
		git_repo: "dougbtv/test-dockerfiles",
		git_path: "/helloworld/Dockerfile",
		method: "hook",
		git_method: "github"
	}
};

var new_releaseid;

module.exports = {
    setUp: function (callback) {
        // console.log("!trace SETUP");
        callback();
    },
    /*
    tearDown: function (callback) {
        // clean up
        console.log("!trace TEARDOWN");
        bowline.kill();
		callback();
    },
    */
    waitForServer: function(test) {
    	setTimeout(function(){
			test.ok(true, "Wait for server to boot.");
			test.done();
		},500);
	},
	testMethodExists: function(test){
		test.expect(1);

		client.get('/api/foo', function(err, req, res, data) {

			if (err) {
				test.ok(false, "Restify error: " + err);
			} else {
				if (data.code != 200) {
					test.ok(true, "Test API Method, foo, exists");
				}
			}
			test.done();
		});
	},
	loginFailure: function(test){
	
		client.post('/api/login',{
			email: 'doooofer1dge',
			password: 'somethingFAKE',
		}, function(err, req, res, data) {

			var result = JSON.parse(res.body);

			if (!err) {
				test.ok(result.failed, "Login failure");
			} else {
				test.ok(false, "Restify error: " + err);
			}
			test.done();
		});
		
	},
	loginSuccessful: function(test){
		
		client.post('/api/login',{
			email: TEST_USERNAME,
			password: TEST_PASSWORD
		}, function(err, req, res, data) {

			var result = JSON.parse(res.body);
			if (!err) {
				if (!result.failed) {
					test.ok(true, "Login succeeded");
				} else {
					test.ok(false, "Expected successful login");	
				}
				
				// console.log(res.body);
			} else {
				test.ok(false, "Restify error: " + err);
			}

			test.done();

		});
		
	},
	addRelease: function(test){
	
		client.post('/api/addRelease', NEW_RELEASE, function(err, req, res, data) {

			var result = JSON.parse(res.body);

			// console.log("!trace NEW RELEASE: ",result);
			
			if (!err) {
				if (!result.error) {
					new_releaseid = result.releaseid;
					test.ok(true, "Release added");
				} else {
					test.ok(false, "New release errored out");	
				}
				// console.log(res.body);
			} else {
				test.ok(false, "Restify error: " + err);
			}
			test.done();
		});
		
	},
	editRelease: function(test){

		var edited_release = NEW_RELEASE;
		edited_release.release._id = new_releaseid;
		edited_release.release.branch_name = "edited";
		
		// console.log("!trace edited_release: ",edited_release);

		client.post('/api/editRelease', edited_release, function(err, req, res, data) {

			var result = JSON.parse(res.body);

			// console.log("!trace editRelease result: ",result);
			
			if (!err) {
				if (!result.error) {
					test.ok((new_releaseid == result.releaseid), "Release edited");
				} else {
					test.ok(false, "Edit release errored out");	
				}
				// console.log(res.body);
			} else {
				test.ok(false, "Restify error: " + err);
			}
			test.done();
		});
		
	},
	deleteRelease: function(test){

		client.post('/api/deleteRelease', {
			releaseid: new_releaseid,
			session: {
				username: TEST_USERNAME,
				password: TEST_PASSWORD
			}
		}, function(err, req, res, data) {

			var result = JSON.parse(res.body);

			if (!err) {
				if (!result.error) {
					test.ok(true, "Release deleted");
				} else {
					test.ok(false, "Delete release errored out");	
				}
				// console.log(res.body);
			} else {
				test.ok(false, "Restify error: " + err);
			}
			test.done();
		});
		
	},
	serverKill: function(test) {
		bowline.kill();
		test.ok(true, "Server killed");
		test.done();
	}

};
