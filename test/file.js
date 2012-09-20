var vows = require('vows'),
    assert = require('assert'),
    eipUtil = require('../lib/util').Util,
    Route = require("../lib/eip").Route;

vows.describe('For tokenizing strings ').addBatch({
  'without correllationId': {
    topic: function() {
      var self = this;
      this.events = [];
      var r = new Route().tokenize().toArray(this.events);
      r.inject("Row1\nRow2");
      r.inject("Row3\nRow4");
      r.shutDown(function(err){self.callback.call(self)});
    },
    'every injected event should be split separately': function (event, callback) {
      assert.isArray(this.events);
      assert.lengthOf(this.events, 4);
      assert.equal(this.events[0].body, "Row1");
      assert.equal(this.events[1].body, "Row2");
      assert.equal(this.events[2].body, "Row3");
      assert.equal(this.events[4].body, "Row4");
    }
  },
  'without correllationId': {
    topic: function() {
      var self = this;
      this.events = [];
      var r = new Route().tokenize().log().toArray(this.events);
      var event = eipUtil.createEvent("Row1\nRow2");
      event.headers.correllationId = "id";
      r.inject(event);
      event = eipUtil.createEvent("-continued\nRow3");
      event.headers.correllationId = "id";
      r.inject(event);
      r.shutDown(function(err){self.callback.call(self)});
    },
    'events with the same correllationId should be merged': function (event, callback) {
      assert.isArray(this.events);
      assert.lengthOf(this.events, 3);
      assert.equal(this.events[0].body, "Row1");
      assert.equal(this.events[1].body, "Row2-continued");
      assert.equal(this.events[2].body, "Row3");
    }
  }
}).export(module);
