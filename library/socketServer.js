module.exports = function(bowline,opts,log) {

	// TODO: I want to do this, but, it's bigger bite than I want to chew right now, -Doug
	socketio = require('socket.io');

	log.it("Starting socket.io server.");
	var io = socketio.listen(bowline.restserver.server);

	io.on('connection', function (socket) {

		log.it("socket_io_connection",{remove: 'this thing'});

		// -- a few examples.
		// This goes to everyone but the person who requested.
		// socket.broadcast.emit('foo',{bar: 'quux'})

		// This goes to everyone.
		// io.emit('foo',{bar: 'quux'});

		socket.emit('news', { hello: 'world' });
	
		// ------------ Our handler.

		// When they manually get an smc (e.g. when they first visit the page)
		socket.on('subscribe_build', function (data) {
			console.log("!trace subscribe_build call socket: ",data);
			// this.individualSMCRequest(socket);

			socket.join(data.slug);
			// Ok, let's make a room for this.


		}.bind(this));
	
	}.bind(this));

	this.sendBuildLog = function(slug,logline) {

		// log.it("debug_emit",{slug: slug,logline: logline});
		io.to(slug).emit('buildlogline',logline);

	}

	// When the SMC is updated server-side, we emit that globally.
	/*
	this.smcUpdate = function() {

		io.emit('pushsmc', this.askSMCObject());

	}

	// Otherwise, sometimes just one person needs it (say it's the first time they come to the page.)
	this.individualSMCRequest = function(socket) {

		socket.emit('pushsmc', this.askSMCObject());

	}

	this.askSMCObject = function() {

		var returner = false;

		var smc = smcman.smc.getSMC();

		if (smc.phase) {
			returner = smc;
		}

		return returner;

	}
	*/


}