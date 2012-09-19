var vows = require('vows'),
    assert = require('assert'),
    eipUtil = require('../lib/util').Util,
    Route = require("../lib/eip").Route;

vows.describe('For tokenizing strings ').addBatch({
  'when using jade without parameters': {
    topic: function() {
      var self = this;
      this.events = [];
      var r = new Route()
        .tokenize()
        .log()
        .toArray(this.events);
      r.inject("Row1\nRow");
      r.inject("2\nRow3");
      r.shutDown(function(err){self.callback.call(self)});
    },
    'the correct html code should be generated': function (event, callback) {
      assert.isArray(this.events);
      assert.lengthOf(this.events, 2);
      assert.equal(this.events[0].body, "Row1");
      assert.equal(this.events[1].body, "Row2");
      assert.equal(this.events[2].body, "Row3");
    }
  }
}).export(module);
