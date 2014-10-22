// An autobuilder for building asterisk into a docker image, and pushing it to dockerhub.
// @dougbtv 10/11/2014

// Parse our options with nomnom. We centralize this here.
var Options = require("./library/Options.js");
var options = new Options();

var mongoose = require('mongoose');

options.parse(function(opts){

	console.log("!trace opts: ",opts);
	// -- Connect to mongo.

	mongoose.connect(opts.MONGO_CONNECT_STRING);

	var db = mongoose.connection;
	
	db.on('error', function(){
		console.log("MONGO CONNECTION ERROR: ",{server: opts.MONGO_CONNECT_STRING });
	});

	db.once('open', function callback () {

		// We're connected to mongo, now.
		console.log("mongo_connect",{server: opts.MONGO_CONNECT_STRING });

		// Now that we're connected to mongo, we can continue along.
		// The Condor object, the meat of our dealings.
		var IRC = require('./library/IRC.js');
		var irc = new IRC(opts);

		// Now, we get to the meat of our dealings, the Builder.
		var Builder = require("./library/Builder.js"); 
		var builder = new Builder(opts,irc);

		// Connect the irc bot's listener to the builder
		irc.bot.addListener("message", function(from, to, text, message) {
			// Let's handle this command.
			builder.ircHandler(text,from,message);
		});


	});


});


// Just a stub. Tie together more modules here in the future if need be.
