var vows = require('vows'),
    assert = require('assert'),
    eip = require("../lib/eip");

vows.describe('If processors throw an exception').addBatch({
	'with default error handling': {
		topic: function() {
			var self = this;
			this.numberOfAttempts = 0;
			var r = new eip.Route().process(function(event, cb) {
				self.numberOfAttempts += 1;
				throw "Some exception";
			});
			r.errorRoute
				.process(function(event, cb){self.callback.call(self, event, cb)});
			r.inject("Text");
			r.shutDown();
		},
		'the error handling route should be invoked': function (event, callback) {
			assert.isObject(event);
			assert.equal(event.headers._exception.cause, "Some exception");
			assert.equal(event.headers._exception.numberOfAttempts, 3);
			assert.isNotNull(event.headers._exception.timestamp);
			assert.equal(event.body, "Text");
		},
		'the failing processor should be invoked three times': function (event, callback) {
			assert.equal(this.numberOfAttempts, 3);
		}
	},
	'with custom error route': {
		topic: function() {
			var r = new eip.Route().process(function(event, cb) {
				throw "Some exception";
			});
			r.errorRoute = new Route().log().process(this.callback);
			r.inject("Text");
			r.shutDown();
		},
		'the error handling route should be invoked': function (event, callback) {
			assert.isObject(event);
			assert.equal(event.headers._exception.cause, "Some exception");
			assert.isNotNull(event.headers._exception.timestamp);
			assert.equal(event.body, "Text");
		}
	}
}).export(module);

vows.describe('If processors return an exception').addBatch({
	'with default error handling': {
		topic: function() {
			var self = this;
			this.numberOfAttempts = 0;
			var r = new eip.Route().process(function(event, cb) {
				self.numberOfAttempts += 1;
				cb("Some exception", event);
			});
			r.errorRoute
				.process(function(event, cb){self.callback.call(self, event, cb)});
			r.inject("Text");
			r.shutDown();
		},
		'the error handling route should be invoked': function (event, callback) {
			assert.isObject(event);
			assert.equal(event.headers._exception.cause, "Some exception");
			assert.equal(event.headers._exception.numberOfAttempts, 3);
			assert.isNotNull(event.headers._exception.timestamp);
			assert.equal(event.body, "Text");
		},
		'the failing processor should be invoked three times': function (event, callback) {
			assert.equal(this.numberOfAttempts, 3);
		}
	}
}).export(module);

vows.describe('If processors throw an exception in an asynchronous function').addBatch({
	'and the global error route is defined': {
		topic: function() {
			var self = this;
			this.numberOfAttempts = 0;
			var r = new eip.Route().process(function(event, cb) {
				self.numberOfAttempts += 1;
				process.nextTick(function() {
					throw "Some exception";
				});
			});
			eip.globalErrorRoute
				.process(function(event, cb){self.callback.call(self, event, cb)});
			r.inject("Text");
			r.shutDown();
		},
		'the global error handling route should be invoked': function (event, callback) {
			assert.isObject(event);
			assert.equal(event.headers._exception.cause, "Some exception");
			assert.isNotNull(event.headers._exception.timestamp);
		}
	}

}).export(module);


vows.describe('If events are injected after shutdown').addBatch({
	'and the global error route is defined': {
		topic: function() {
			var self = this;
			this.events = [];
			var r = new eip.Route()
				.toArray(this.events)
				.process(function(event, cb){self.callback.call({events: self.events}, event, cb)});
			r.inject("Works");
			r.shutDown(function() {
//				r.inject("Throws exception");
			});
//			r.inject("Works as well");
		},
		'events after shut will not be processed': function (event, callback) {
			assert.isArray(this.events);
			assert.lengthOf(this.events, 1);
			assert.equal(this.events[0].body, "Works");
		}
	}

}).export(module);
//*/



