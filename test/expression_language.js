var vows = require('vows'),
	assert = require('assert'),
	sel = require('../lib/el/sel.js'),
    eipUtil = require('../lib/util').Util,
    Route = require("../lib/eip").Route;

// Create a Test Suite
vows.describe('For the simple expression language').addBatch({
//	'when replacing ${body} with a string': {
//		topic: function() {
//			var r = new Route().simple("Replacing ${body}.")
//				.process(this.callback);
//			r.inject("value");
//		},
//		'the string should be inserted': function (event, callback) {
//			assert.equal(event.body, "Replacing value.");
//		}
//	},
//	'when using nested objects with dot notation': {
//		topic: function() {
//			var r = new Route().simple("String value: ${body.nested.stringValue} and integer value: ${body.nested.intValue}.")
//				.process(this.callback);
//			r.inject({nested: {stringValue: "value", intValue: 42}});
//		},
//		'string and integer values should be inserted': function (event, callback) {
//			assert.equal(event.body, "String value: value and integer value: 42.");
//		}
//	},
	'sel: when using simple attributes ': {
		topic: function() {
			var fn = sel.compile("String: ${string}; Integer: ${integer}.");
			var r = fn({string:"value", integer:42});
			this.callback(r);
		},
		'string and integer valuess should be inserted': function (result, callback) {
			assert.equal(result, "String: value; Integer: 42.");
		}
	},
	'sel: when using nested objects with dot notation': {
		topic: function() {
			var fn = sel.compile("String: ${strings.value}; Integer: ${integers.value}.");
			var r = fn({strings:{value: "value"}, integers:{value:42}});
			this.callback(r);
		},
		'string and integer valuess should be inserted': function (result, callback) {
			assert.equal(result, "String: value; Integer: 42.");
		}
	},
	'sel: when using nested objects are not defined': {
		topic: function() {
			var fn = sel.compile("string.missing = ${strings.missing}; missing.value = ${missing.value}; missing = ${missing}");
			var r = fn({strings:{value: "value"}});
			this.callback(r);
		},
		'the value should be an empty string': function (result, callback) {
			assert.equal(result, "string.missing = ; missing.value = ; missing = ");
		}
	},
	'sel: when attributes contain characters like "_"': {
		topic: function() {
			var fn = sel.compile("${model._id}");
			var r = fn({model:{_id: "value"}});
			this.callback(r);
		},
		'the value should be replaced': function (result, callback) {
			assert.equal(result, "value");
		}
	}

	
}).export(module);







