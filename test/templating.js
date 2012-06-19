var vows = require('vows'),
    assert = require('assert'),
    eipUtil = require('../lib/util').Util,
    Route = require("../lib/eip").Route;

// Create a Test Suite
vows.describe('For direct calls of templates ').addBatch({
	'when using jade without parameters': {
		topic: function() {
			var r = new Route().jade("p Some paragraph.")
				.process(this.callback);
			r.inject({});
			r.shutDown();
		},
		'the correct html code should be generated': function (event, callback) {
			assert.isObject(event);
			assert.equal(event.body, "<p>Some paragraph.</p>");
		}
	},
	'when using jade for events with headers': {
		topic: function() {
			var r = new Route().jade("p Some paragraph.")
				.process(this.callback);
			var e = eipUtil.createEvent();
			e.headers.test = "some value";
			r.inject(e);
			r.shutDown();
		},
		'headers must be preserved': function (event, callback) {
			assert.isObject(event);
			assert.equal(event.headers.test, "some value");
		}
	},
	'when using jade with parameter #{body}': {
		topic: function() {
			var r = new Route().jade("p #{body}.")
				.process(this.callback);
			r.inject("Some paragraph");
			r.shutDown();
		},
		'the correct html code should be generated': function (event, callback) {
			assert.isObject(event);
			assert.equal(event.body, "<p>Some paragraph.</p>");
		}
	},
	'when using jade with more than one parameter like #{body.content.name} or #{headers.title}': {
		topic: function() {
			var r = new Route().jade("h1 #{headers.title}\np #{body.content.nested}.")
				.process(this.callback);
			var e = eipUtil.createEvent({content: {nested: "Some paragraph"}});
			e.headers.title = "Title"
			r.inject(e);
			r.shutDown();
		},
		'the correct html code should be generated': function (event, callback) {
			assert.isObject(event);
			assert.equal(event.body, "<h1>Title</h1><p>Some paragraph.</p>");
		}
	},
	'when using jade using a String template in "header._template"': {
		topic: function() {
			var r = new Route()
				.eval("headers._template = 'h1 #{headers.title}\\np #{body.content.nested}.'")
				.jade()
				.process(this.callback);
			var e = eipUtil.createEvent({content: {nested: "Some paragraph"}});
			e.headers.title = "Title"
			r.inject(e);
			r.shutDown();
		},
		'the correct html code should be generated': function (event, callback) {
			assert.isObject(event);
			assert.equal(event.body, "<h1>Title</h1><p>Some paragraph.</p>");
		}
	},
	'when applying jade to objects': {
		topic: function() {
			var r = new Route().jade({
					attr1: "p No replacement of values.",
					attr2: "p #{body}.",
					number: 1,
					nested: {attr3: "p #{body}."}
				})
				.process(this.callback);
			r.inject("Some paragraph");
			r.shutDown();
		},
		'an object should be created': function (event, callback) {
			assert.isObject(event);
			assert.isObject(event.body);
		},
		'each string attribute of the object should be replaced': function (event, callback) {
			assert.isString(event.body.attr1);
			assert.equal(event.body.attr1, "<p>No replacement of values.</p>");
			assert.isString(event.body.attr2);
			assert.equal(event.body.attr2, "<p>Some paragraph.</p>");
		},
		'none-string attributes of the object should NOT be replaced': function (event, callback) {
			assert.isNumber(event.body.number);
			assert.equal(event.body.number, 1);
		},
		'even nested attributes should be replaced': function (event, callback) {
			assert.isObject(event.body.nested);
			assert.isString(event.body.nested.attr3);
			assert.equal(event.body.nested.attr3, "<p>Some paragraph.</p>");
		}
	},
	'when applying jade using a object template in "header.jade.template"': {
		topic: function() {
			template = {
					attr1: "p No replacement of values.",
					attr2: "p #{body}.",
					number: 1,
					nested: {attr3: "p #{body}."}
				}
			var r = new Route()
				.eval("headers._template = template")
				.jade()
				.process(this.callback);
			r.inject("Some paragraph");
			r.shutDown();
		},
		'an object should be created': function (event, callback) {
			assert.isObject(event);
			assert.isObject(event.body);
		},
		'each string attribute of the object should be replaced': function (event, callback) {
			assert.isString(event.body.attr1);
			assert.equal(event.body.attr1, "<p>No replacement of values.</p>");
			assert.isString(event.body.attr2);
			assert.equal(event.body.attr2, "<p>Some paragraph.</p>");
		},
		'none-string attributes of the object should NOT be replaced': function (event, callback) {
			assert.isNumber(event.body.number);
			assert.equal(event.body.number, 1);
		},
		'even nested attributes should be replaced': function (event, callback) {
			assert.isObject(event.body.nested);
			assert.isString(event.body.nested.attr3);
			assert.equal(event.body.nested.attr3, "<p>Some paragraph.</p>");
		}
	}
}).export(module);








