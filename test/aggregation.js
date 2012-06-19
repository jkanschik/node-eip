// division-by-zero-test.js

var vows = require('vows'),
    assert = require('assert'),
    Route = require("../lib/eip").Route,
    aggregator = require("../lib/aggregator");

// Create a Test Suite
vows.describe('For simple asynchronous routes:').addBatch({
	'when sending an event to toArray': {
		topic: function() {
			var that = this;
			this.events = [];
			var r = new Route().toArray(this.events)
				.process(function(event, cb){that.callback.call({events: that.events}, event, cb)});
			r.inject({data: 1});
			r.shutDown();
		},
		'an event should be at the end': function (event, callback) {
			assert.isNotNull(event);
			assert.equal(event.body.data, 1);
		},
		'the array should contain the element': function (event, callback) {
			assert.isArray(this.events);
			assert.lengthOf(this.events, 1);
			assert.deepEqual(this.events[0].body, {data:1});
		} 
	},
	'when sending two events to an intervall aggregator': {
		topic: function() {
			var that = this;
			this.events = [];
			var r = new Route()
				.aggregate({emitter: aggregator.Emitter.interval(1000)})
				.process(this.callback);
			r.inject("First event");
			r.inject("Second event");
			r.shutDown();
		},
		'we should get an event which': {
			'is not null': function (event, callback) {
				assert.isNotNull(event);
			},
			'is an array of two events': function (event, callback) {
				assert.isArray(event.body);
				assert.lengthOf(event.body, 2);
				assert.equal(event.body[0].body, "First event");
				assert.equal(event.body[1].body, "Second event");
			}
		}
	}
}).run();












