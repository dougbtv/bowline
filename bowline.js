// ----------------------------------------------------------------------------------------
//    ______     ______     __     __     __         __     __   __     ______    
//   /\  == \   /\  __ \   /\ \  _ \ \   /\ \       /\ \   /\ "-.\ \   /\  ___\   
//   \ \  __<   \ \ \/\ \  \ \ \/ ".\ \  \ \ \____  \ \ \  \ \ \-.  \  \ \  __\   
//    \ \_____\  \ \_____\  \ \__/".~\_\  \ \_____\  \ \_\  \ \_\\"\_\  \ \_____\ 
//     \/_____/   \/_____/   \/_/   \/_/   \/_____/   \/_/   \/_/ \/_/   \/_____/ 
//                                                                             
// ----------------------------------------------------------------------------------------
// An autobuilder for building a project into a docker image, and pushing it to dockerhub.
// "It ties your Docker image to a build process"
// @dougbtv 10/11/2014
// ----------------------------------------------------------------------------------------

// Parse our options with nomnom. We centralize this here.
var Options = require("./library/Options.js");
var options = new Options();

var mongoose = require('mongoose');

options.parse(function(err,opts){

	// console.log("!trace opts: ",opts);
	// -- Connect to mongo.

	if (err) {
		throw "Configuration LOAD ERROR: " + err;
	}

	// we start logging quite early.
	var Log = require('./library/Log.js');
	var log = new Log(opts);

	mongoose.connect(opts.MONGO_CONNECT_STRING);

	var db = mongoose.connection;
	
	db.on('error', function(){
		console.log("MONGO CONNECTION ERROR: ",{server: opts.MONGO_CONNECT_STRING });
	});

	db.once('open', function callback () {

		log.it("configuration_loaded",{ configname: opts.CONFIG_NAME });

		// We're connected to mongo, now.
		log.it("mongo_connect",{server: opts.MONGO_CONNECT_STRING });

		// Bowline handles our matters.
		var Bowline = require("./library/Bowline.js"); 
		var bowline = new Bowline(opts,log,mongoose);

	});


});


// Just a stub. Tie together more modules here in the future if need be.
