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

options.parse(function(opts){

	// console.log("!trace opts: ",opts);
	// -- Connect to mongo.

	mongoose.connect(opts.MONGO_CONNECT_STRING);

	var db = mongoose.connection;
	
	db.on('error', function(){
		console.log("MONGO CONNECTION ERROR: ",{server: opts.MONGO_CONNECT_STRING });
	});

	db.once('open', function callback () {

		// We're connected to mongo, now.
		console.log("mongo_connect",{server: opts.MONGO_CONNECT_STRING });

		var Log = require('./library/Log.js');
		var log = new Log(opts);

		// Now that we're connected to mongo, we can continue along.
		// The Condor object, the meat of our dealings.
		var IRC = require('./library/IRC.js');
		var irc = new IRC(opts);

		// Our users, for login/management purposes.
		var User = require('./library/User.js');
		var user = new User(log,opts,mongoose);

		// Defines a "knot"
		var Release = require('./library/Release.js');
		var release = new Release(mongoose);

		// Bowline handles our matters.		
		var Manager = require("./library/Manager.js"); 
		var manager = new Manager(opts,irc,release);

		// inject that into release, too.
		release.inject(manager);

		// Bowline handles our matters.		
		var Bowline = require("./library/Bowline.js"); 
		var bowline = new Bowline(opts,irc,release,manager);

		var RestServer = require("./library/restServer.js"); 
		var restserver = new RestServer(log,opts,bowline,user,release,manager);
	    restserver.serverStart();

		// Connect the irc bot's listener to the builder
		irc.bot.addListener("message", function(from, to, text, message) {
			// Let's handle this command.
			bowline.ircHandler(text,from,message);
		});


	});


});


// Just a stub. Tie together more modules here in the future if need be.
