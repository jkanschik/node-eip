var vows = require('vows'),
    assert = require('assert'),
    Route = require("../lib/eip").Route;

vows.describe('For dynamic routes').addBatch({
	'when dispatching to another route': {
		topic: function() {
			var dest = new Route().process(this.callback);
			var r = new Route().dispatch(dest);
			r.inject("Test");
			r.shutDown();
		},
		'the other route should be invoked': function (event, callback) {
			assert.isObject(event);
			assert.equal(event.body, "Test");
		}
	},
	'when dispatching dynamically to another route': {
		topic: function() {
			var dest1 = new Route().eval("body.route = 'wrong'").process(this.callback);
			var dest2 = new Route().eval("body.route = 'correct'").process(this.callback);
			var r = new Route().choice("body.choice",
					[{when: "wrong", route: dest1},
					 {when: "correct", route: dest2}]);
			r.inject({choice: "correct"});
			r.shutDown();
		},
		'the correct route should be invoked': function (event, callback) {
			assert.isObject(event);
			assert.equal(event.body.route, "correct");
		}
	},
	'when no condition of the dynamic route fits': {
		topic: function() {
			var dest1 = new Route().eval("body.route = 'wrong'").process(this.callback);
			var dest2 = new Route().eval("body.route = 'wrong'").process(this.callback);
			var dest3 = new Route().eval("body.route = 'correct'").process(this.callback);
			var r = new Route().choice("body.choice",
					[{when: "wrong1", route: dest1},
					 {when: "wrong2", route: dest2},
					 {otherwise: dest3}]);
			r.inject({choice: "otherwise"});
			r.shutDown();
		},
		'the "otherwise" route should be invoked': function (event, callback) {
			assert.isObject(event);
			assert.equal(event.body.route, "correct");
		}
	},
	'when the condition evaluates to undefined': {
		topic: function() {
			var dest1 = new Route().eval("body.route = 'wrong'").process(this.callback);
			var dest2 = new Route().eval("body.route = 'wrong'").process(this.callback);
			var dest3 = new Route().eval("body.route = 'correct'").process(this.callback);
			var r = new Route().choice("body.choice",
					[{when: "wrong1", route: dest1},
					 {when: "wrong2", route: dest2},
					 {otherwise: dest3}]);
			r.inject({});
			r.shutDown();
		},
		'the "otherwise" route should be invoked': function (event, callback) {
			assert.isObject(event);
			assert.equal(event.body.route, "correct");
		}
	},
	'when the condition evaluates to true': {
		topic: function() {
			var dest1 = new Route().eval("body.route = 'correct'").process(this.callback);
			var dest2 = new Route().eval("body.route = 'wrong'").process(this.callback);
			var r = new Route().choice("body.v1 == body.v2",
					[{when: true, route: dest1}, {otherwise: dest2}]);
			r.inject({v1: 1, v2: 1});
			r.shutDown();
		},
		'the route should be invoked': function (event, callback) {
			assert.isObject(event);
			assert.equal(event.body.route, "correct");
		}
	}
}).export(module);








