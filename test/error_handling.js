var vows = require('vows'),
    assert = require('assert'),
    Route = require("../lib/eip").Route;

vows.describe('If processors throw an exception').addBatch({
	'with default error handling': {
		topic: function() {
			var self = this;
			this.numberOfAttempts = 0;
			var r = new Route().process(function(event, cb) {
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
			var r = new Route().process(function(event, cb) {
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
			var r = new Route().process(function(event, cb) {
				self.numberOfAttempts += 1;
				cb(event, "Some exception");
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






