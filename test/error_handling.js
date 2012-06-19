var vows = require('vows'),
    assert = require('assert'),
    Route = require("../lib/eip").Route;

vows.describe('If errors occur').addBatch({
	'with default error handling': {
		topic: function() {
			var r = new Route().process(function(event, cb) {
				throw "Some exception";
			});
			r.errorRoute.process(this.callback);
			r.inject();
			r.shutDown();
		},
		'the error handling route should be invoked': function (event, callback) {
			assert.isObject(event);
			assert.equal(event.body, "Some exception");
		}
	},
	'with custom error route': {
		topic: function() {
			var r = new Route().process(function(event, cb) {
				throw "Some exception";
			});
			r.errorRoute = new Route().log().process(this.callback);
			r.inject();
			r.shutDown();
		},
		'the error handling route should be invoked': function (event, callback) {
			assert.isObject(event);
			assert.equal(event.body, "Some exception");
		}
	}
}).export(module);








