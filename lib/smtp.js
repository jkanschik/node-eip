var util = require('util'),
	events = require('events'),
	nodemailer = require('nodemailer'),
	eip = require('./eip'),
	eipUtil = require('./util').Util;

var SMTP = function() {};
exports.SMTP = SMTP;
util.inherits(SMTP, eip.Processor);

SMTP.prototype.init = function(options) {
	this.server = nodemailer.createTransport("SMTP", 
			{	host:    options.host
//				auth: {user: "nobody", pass:"password"} 
			}
	);
	eip.Processor.call(this);
};

SMTP.prototype.data = function(event) {
	var self = this;
	this.server.sendMail({
		   html:    event.body,
		   from:    (event.headers && event.headers.smtp) ? event.headers.smtp.from : "", 
		   to:      (event.headers && event.headers.smtp) ? event.headers.smtp.to : "",
		   cc:      (event.headers && event.headers.smtp) ? event.headers.smtp.cc : "",
		   subject: (event.headers && event.headers.smtp) ? event.headers.smtp.subject : ""
		}, function(err, status) {
			if (err) {
				console.log("SMTP failed with error %s and status %s", err, status);
				self.emitEvent({error: err, status: status});
			} else {
				self.emitEvent(event);
			}
		}
	);
};

eip.Route.register("smtp", SMTP);
