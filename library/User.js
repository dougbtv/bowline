module.exports = function(log, opts, mongoose) {

	// We use this for password storage and authentication.
	// reference: http://devsmash.com/blog/password-authentication-with-mongoose-and-bcrypt
	var bcrypt = require('bcrypt');
	var SALT_WORK_FACTOR = 10;

	var uuid = require('node-uuid');

	// We use moment to figure out when their session expires.
	var moment = require('moment');
	var SESSION_EXPIRES_DAYS = 7;

	// We also use our little mini-centralized-mailer
	var Mail = require('./Mail.js');
	var mail = new Mail(log,opts);

	var URL_SET_PASSWORD = "http://localhost:9000/#/register";

	// -----------------------------------
	// Mongo schema ----------------------
	// -----------------------------------

	// Setup a schema.
	var userSchema = mongoose.Schema({

		email: String,			// Their email.
		secret: String,			// The secret key
		resetkey: String,		// The key to reset it (register or forgot password.)
		active: Boolean,		// Is this user activated? (Important because of email verification)
		indate: Date,			// Created @ time.
		
		session_id: String,		// After authenticating, we give a (quasi-public) session ID.
		session_expires: Date,	// When the session expires.

	}, { collection: 'users' });

	// Elegant little way to hide properties when transforming to object.
	// http://mongoosejs.com/docs/api.html#document_Document-toObject
	// (do a find for "hide", both on that doc, and here. To see it in action)
	if (!userSchema.options.toObject) userSchema.options.toObject = {};	

	userSchema.options.toObject.transform = function (doc, ret, options) {
		if (options.hide) {
			options.hide.split(' ').forEach(function (prop) {
				delete ret[prop];
			});
		}
	};


	userSchema.virtual('resetURL')
		.get(function () {
			return URL_SET_PASSWORD + 
				"?resetpass=" + encodeURIComponent(this.resetkey) + 
				"&email=" + encodeURIComponent(this.email);
		});


	// Compile it to a model.
	var User = mongoose.model('User', userSchema);

	this.registerUser = function(email,callback) {

		// Ok, see if the user exists.
		this.exists(email,function(exists){

			// Only create if they don't exist.
			if (!exists) {

				// Otherwise? I think we're good to go.
				// Go and create 'em.
				var user = new User;
				user.resetkey = this.uniqueHash();
				user.email = email;
				user.active = false;
				user.indate = new Date();
				
				user.save(function(err){
					if (!err) {

						// Ok, let's send 'em a mail.

						var subject = "Welcome to Bowline.io!"
						var body = "Thanks for registering. To verify your account, and to set your password, visit: " + user.resetURL;

						// Alright, now that they're saved, we can go ahead and send 'em a mail.
						/// this.send = function(subject,body,to,from) {
						mail.send(subject,body,user.email);

						callback(false);
						
					} else {
						log.error('mongo_error',{method: 'User.registerUser', note: "Couldn't save user", error: err});
					}
				}.bind(this));

			} else {
				callback("Sorry: This email address already exists on our system.");
			}

		}.bind(this));

	}

	this.forgotPassword = function(email,callback) {

		User.findOne({email: email},function(err,user){
			if (!err) {

				if (user) {

					// Firstly, give 'em a new key, right?
					user.resetkey = this.uniqueHash();

					// Save 'em.
					user.save(function(){

						var subject = "Reset your Bowline.io password"
						var body = "You can reset your password @ " + user.resetURL;

						// Alright, now that they're saved, we can go ahead and send 'em a mail.
						/// this.send = function(subject,body,to,from) {
						mail.send(subject,body,user.email);

						callback(false);

					});

					// Ok, we'll send a mail.


				} else {
					// We don't know that user, this is a bunk request.
					log.warn("data_not_found",{method: 'User.forgotPassword', note: "Invalid forgotten password request", email: email});
					callback("Sorry, I don't know that email address");
				}

			} else {
				log.error('mongo_error',{method: 'User.forgotPassword', note: "Mongo filed to find one when doing forgot password in user", error: err});
				callback("Internal error 0x0DDfA");
			}

		}.bind(this));

	}

	this.setPassword = function(email,password,resetkey,callback) {

		// Alright, let's see what we got.
		// Firstly, is it legit?
		User.findOne({email: email, resetkey: resetkey},function(err,user){
			if (!err) {

				if (user) {

					// log.trace("input user: ",user);

					// Ok, that's great. Let's just modifed 'em.
					this.createPasswordHash(password,function(hash){

						// Set the new password to the hash.
						user.secret = hash;

						// The user is now active, too.
						user.active = true;

						// Wipe out their reset key, gen 'em a new one. (that they'll never know.)
						user.resetkey = this.uniqueHash();

						// Save 'em.
						user.save();

						// Now, let's create a session for them, because this will log them in.
						this.createSession(email,function(sessionid){
							callback({
								sessionid: sessionid,
								fulluser: user,
							});
						});

					}.bind(this));

				} else {
					log.warn("set_password",{note: "Invalid setPassword attempt searchpack", email: email, resetkey: resetkey});
					callback("Our apologies, we've logged this mistake and we'll get back to you shortly. (Error code: 0x0DD1B)");
				}

			} else {
				log.error('mongo_error',{method: 'User.setPassword', note: "Mongo filed to find one when setting password in user", error: err});
				callback("Internal error 0x0DDfA");
			}

		}.bind(this));

	}


	// Should be good.
	this.uniqueHash = function() {
		return uuid.v4();
	}

	this.createPasswordHash = function(password,callback) {

		// generate a salt
		bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
			if (err) throw "Duuude, gen salt failed.";

			// hash the password along with our new salt
			bcrypt.hash(password, salt, function(err, hash) {
				if (err) throw "Duuude, bcrypt hash busted.";

				// override the cleartext password with the hashed one
				callback(hash);

			});

		});

	}

	this.exists = function(email,callback) {

		User.findOne({email: email},function(err,user){

			if (user) {
				callback(true);
			} else {
				callback(false);
			}

		});

	}

	this.getUser = function(email,callback) {

		User.findOne({email: email},function(err,user){

			if (user) {
				callback(user.toObject(/* {hide: 'secret resetkey resetURL', transform: true ,virtuals: true}*/));
			} else {
				callback(false);
			}

		});

	}

	this.searchForUsers = function(re_searchemail,callback) {

		User.find({email: re_searchemail},function(err,users){

			var emails = [];
			for (var i = 0; i < users.length; i++) {
				var eachuser = users[i];
				emails.push(eachuser.email);
			}

			callback(emails);

		});		

	}

	// -----------------------------------------------------------------
	// ------------- Authentication & Validation -----------------------
	// -----------------------------------------------------------------

	this.createSession = function(email,callback) {

		var sessionid = this.uniqueHash();

		User.findOne({email: email},function(err,user){

			if (user) {

				// Give a new session id.
				user.session_id = sessionid;

				// Create a time at which the session expires.
				var expires = new moment();
				expires.add(SESSION_EXPIRES_DAYS, 'days');
				user.session_expires = expires.toDate();

				user.save();

				// And return it.
				callback(sessionid);

			}

		});


	}

	this.userValidator = function(searchpack,callback) {

		User.findOne(searchpack,function(err,user){

			if (user) {
				// Good, that's found.
				// log.it("!trace SESSION FOUND.");

				var now = new moment();

				// Check if the session is expired.
				if (now.unix() <= user.session_expires) {

					// looks good!

					callback({ isvalid: true, fulluser: user.toObject({ hide: 'secret resetkey resetURL', transform: true, virtuals: true })});

				} else {

					// Nope, it's expired.
					log.warn("validate_user",{note: "User session expired", searchpack: searchpack});
					callback({ isvalid: false, fulluser: {}});
				
				}

			} else {
				// Not valid.
				log.warn("validate_user",{note: "Could not verify user with searchpack", searchpack: searchpack});
				callback({ isvalid: false, fulluser: {}});
			}

		});

	}

	this.validateSession = function(sessionpack,callback) {

		var email = sessionpack.username;
		var sessionid = sessionpack.session;
		
		// Ok, let's look for a result.
		var searchpack = {email: email, session_id: sessionid};

		// go through the general validator with our searchpack.
		this.userValidator(searchpack,function(validpack){
			if (!validpack.isvalid) {
				log.warn("validate_session",{note: "Vanilla user validation failed", searchpack: searchpack});
			}
			
			console.log("!trace valid pack??? ",validpack);

			callback(validpack);
		});

	}


	this.authenticate = function(email,password,callback) {

		// Locate the user.
		User.findOne({email: email},function(err,user){

			if (user) {

				// Compare it using bcrypt.
				bcrypt.compare(password, user.secret, function(err, isMatch) {
					if (err) {
						
						log.error("bcrypt_compare",{err: err});
						callback(err);

					} else {

						if (isMatch) {

							// Give them a session id.
							// This way we don't store their password in the cookie.
							// It will get reset with each authentication.
							log.it("login",{
								success: true,
								email: email,	
							});

							this.createSession(email,function(sessionid){
								callback({
									sessionid: sessionid,
									fulluser: user.toObject({ hide: 'secret resetkey resetURL', transform: true, virtuals: true }),
								});
							});

						} else {
							log.it("login",{
								success: false,
								email: email,	
							});

							// log.it("!Warning: Password auth failed for %s with password: %s",email,password);
							// Nope that didn't work.
							callback(false);
						}


					}

				}.bind(this));

			} else {

				callback(false);

			}

		}.bind(this));


	}

}