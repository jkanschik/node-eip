require("./ext/uuid.js");

var Util = {
	createEvent: function(body) {
		var event = body || {};
		if (event.body && event.headers && event.headers.id) {
			return event;
		}
		return {
			headers: {id: Util.createId()},
			body: event
		};
	},

	cloneEvent: function(event) {
		var newEvent = Util.createEvent(event.body);
		newEvent.headers = event.headers;
		return newEvent;
	},

	createId: function() {
		return Math.uuid();
	},
	
	/** Converts an arguments Object to an array of arguments. */
	argsToArray: function(args) {
		var i, a = [];
		for (i = 0; i < args.length; i++) {
	        a.push(args[i]);
		}
		return a;
	},

	evalRHS: function(event, rhs) {
		var result;
		with (event) {
			eval("result = (" + rhs + ")")
		}
		return result;
	}

};

exports.Util = Util;