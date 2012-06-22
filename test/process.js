var vows = require('vows'),
    assert = require('assert'),
    Route = require("../lib/eip").Route;

vows.describe('For user defined processors').addBatch({
	'without an error': {
		topic: function() {
			var r = new Route().process(function(event, callback) {
				event.body.processed = true;
				callback(event);
			}).process(this.callback);
			r.inject({text: "Test"});
			r.shutDown();
		},
		'the event should be processed properly': function (event, callback) {
			assert.isObject(event);
			assert.equal(event.body.text, "Test");
			assert.isTrue(event.body.processed);
		}
	}
}).export(module);








