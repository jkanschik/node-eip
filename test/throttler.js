var vows = require('vows'),
    assert = require('assert'),
    eip = require("../index");

vows.describe('For throttling').addBatch({
	'without an error': {
		topic: function() {
			var self = this;
			this.events = [];
			var r = new Route()
				.throttle(1)
				.toArray(this.events);
			for (var i = 0; i < 3; i++)
				r.inject({data: i});
			r.shutDown(function(err){self.callback.call(self)});
		},
		'all events should be processed': function () {
			assert.isArray(this.events);
			assert.lengthOf(this.events, 3);
			for (var i = 0; i < 3; i++)
				assert.deepEqual(this.events[i].body, {data: i});
		}
	}
}).export(module);
