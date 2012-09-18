var util = require('util'),
  events = require('events'),
  fs = require('fs'),
  eip = require('./eip'),
  eipUtil = require('./util').Util;

var DirectoryPoller = function() {};
exports.DirectoryPoller = DirectoryPoller;
util.inherits(DirectoryPoller, eip.Processor);

var isDirectory = function(stat) {
  return stat && stat.mode == 16822;
};
var processFiles = function(path, options, callback) {
  fs.readdir(path, function(err, files) {
    if (err) callback(err);
    if (!files) return;
    files.forEach(function(f) {
      var fileName = path + "/" + f;
      fs.stat(fileName, function(err, stat) {
        if (err) callback(err);
        if (options.recursive && isDirectory(stat))
          processFiles(fileName, options, callback);
        else
          callback(null, fileName);
      });
    });
  })

};

DirectoryPoller.prototype.init = function(path, options) {
  eip.Processor.call(this);

  this.options = options || {};
//  this.options.merge({intervall: 1000, recursive: true}); TODO: 
  this.options.interval = 1000;
  this.options.recursive = true;

  this.processedFiles = {};

  var self = this;
  this.timerId = setInterval(function() {
    processFiles(path, self.options, function(err, fileName) {
      if (err) self.emitEvent(err, null);
      if (!self.processedFiles[fileName]) {
        self.emitEvent(null, fileName);
        self.processedFiles[fileName] = true;
      }
    });
  }, this.options.interval);
};

DirectoryPoller.prototype.data = function(event) {
  throw new Error("DirectoryPoller doesn't accept incoming messages!");
};

eip.Route.register("pollDirectory", DirectoryPoller);
