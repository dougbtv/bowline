// Mini centralized mailing module.

module.exports = function(log,opts) {

	var nodemailer = require('nodemailer');

	// create reusable transporter object using SMTP transport
	/*
	var transporter = nodemailer.createTransport({
		service: 'Gmail',
		auth: {
			user: 'no-replies@bowline.io',
			pass: 'aaaaaaaaaaaaaaaaaaaaaa'
		}
	});
	*/

	this.send = function(subject,body,to,from,callback) {

		var did_override = false;
		var override_address = '';

		if (typeof from === 'undefined') {
			from = "Bowline <no-replies@bowline.io>";
		}

		// setup e-mail data with unicode symbols
		var mailOptions = {
			to: to,
			subject: subject,
			text: body
		};

		if (opts.EMAIL_ENABLED) {

			// send mail with defined transport object
			transporter.sendMail(mailOptions, function(error, info){
				if(error){
					log.error('mail_failed', {to: to, error: err});
					return;
				} else {
					// log.it('Mail: Sent to ' + to);
				}
			});

		} else {

			// We pretend we didn't send an email.
			log.it("NOTICE: No email sent (Email is disabled in opts.)");
			// log.it("Subject:",mailOptions.subject);
			// log.it("Body:",mailOptions.text);
			// log.it("To:",mailOptions.to);

		}

		log.it('mail_sent',{
			to: mailOptions.to,
			subject: mailOptions.subject,
			body: mailOptions.text,
			enabled: opts.EMAIL_ENABLED,
			overridden: did_override,
			override_address: override_address,
		});

		return false;
	

	}

}