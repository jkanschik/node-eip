var vows = require('vows'),
    assert = require('assert'),
	eip = require("../index");

vows.describe('For simple asynchronous routes:').addBatch({
	'when sending an event to toArray': {
		topic: function() {
			var that = this;
			this.events = [];
			var r = new eip.Route().toArray(this.events)
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
	'when sending two events to an interval aggregator': {
		topic: function() {
			var that = this;
			var r = new eip.Route()
				.aggregate({emitter: new eip.aggregator.Emitter.IntervalEmitter(1000)})
				.process(this.callback);
			var e1 = eip.util.createEvent("First event");
			var e2 = eip.util.createEvent("Second event");
			e1.headers.correlationId = e2.headers.correlationId = "some id";
			r.inject(e1);
			r.inject(e2);
		},
		'the event is not null': function (event, callback) {
			assert.isNotNull(event);
		},
		'the event is an array of two events': function (event, callback) {
			assert.isArray(event.body);
			assert.lengthOf(event.body, 2);
			assert.equal(event.body[0].body, "First event");
			assert.equal(event.body[1].body, "Second event");
		}
	}
}).export(module);












