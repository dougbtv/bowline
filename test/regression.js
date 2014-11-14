var restify = require('restify');
var client = restify.createJsonClient({
	version: '*',
	url: 'http://127.0.0.1:8000'
});

var fork = require('child_process').fork;

// Start up bowline.
var bowline;
bowline = fork('./../bowline.js',['--logdisable']);

exports.waitForServer = function(test) {
	setTimeout(function(){
		test.ok(true, "Wait for server to boot.");
		test.done();
	},500);
};

exports.testMethodExists = function(test){
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
	
};

exports.testSomethingElse = function(test){
	test.ok(false, "this assertion should fail");
	test.done();
};

exports.killServer = function(test){
	bowline.kill();
	test.ok(true, "Killed server");
	test.done();
};
