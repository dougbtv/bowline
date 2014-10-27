module.exports = function(opts) {

	var bunyan = require('bunyan');
	var log = bunyan.createLogger({
		name: "condor",
		streams: [
			{
				stream: process.stdout
			},
		]
	});
	
	// Use moment for formatting the date.
	var moment = require('moment');

	// General purpose logging mechanism.
	this.it = function(msg,indata) {

		// Anything above silent shows these.
		log.info({label: msg, content: indata});
		
	}

	// General purpose logging mechanism.
	this.error = function(msg,indata) {

		// Anything above silent shows these.
		log.error({label: msg, content: indata});

	}

	// General purpose logging mechanism.
	this.warn = function(msg,indata) {

		// Anything above silent shows these.
		log.warn({label: msg, content: indata});

	}


	// The doug smith tracing mechanism(TM)
	this.trace = function(msg,indata) {

		log.info({label: msg, content: indata});

	}

	// For tracing a death.
	this.death = function(msg,indata) {

		log.fatal({label: msg, content: indata});
		throw "!trace THOWING ERROR ON PURPOSE, dude: " + msg;

	}

	// Internal Logging mechanism.
	this.coreLog = function(msg,indata) {

		// Default indata, it's optional, after all
		if (typeof indata === 'undefined') {
			indata = "";
		}

		if (typeof msg === 'undefined') {
			msg = "[MESSAGE UNDEFINED]";
		}

		log.info("hi");

		var timenow = new moment().format("YYYY-MM-DD HH:mm:ss.S");
		console.log("[ " + timenow + " ] " + msg,indata);

	}

}