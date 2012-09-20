var util = require('util'),
  events = require('events'),
  fs = require('fs'),
  eip = require('./eip'),
  eipUtil = require('./util').Util;

var DirectoryPoller = function() {};
exports.DirectoryPoller = DirectoryPoller;
util.inherits(DirectoryPoller, eip.Processor);

var isDirectory = function(stat) {
  return stat && stat.mode === 16822;
};
var processFiles = function(path, options, callback) {
  fs.readdir(path, function(err, files) {
    if (err) {
      callback(err);
    }
    if (!files) {
      return;
    }
    files.forEach(function(f) {
      var fileName = path + "/" + f;
      fs.stat(fileName, function(err, stat) {
        if (err) {
          callback(err);
        }
        if (options.recursive && isDirectory(stat)) {
          processFiles(fileName, options, callback);
        } else {
          callback(null, fileName);
        }
      });
    });
  });
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
      if (err) {
        self.emitEvent(err, null);
      }
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


var Tokenizer = function() {};
exports.Tokenizer = Tokenizer;
util.inherits(Tokenizer, eip.Processor);

Tokenizer.prototype.init = function(rule) {
  this.rule = rule;
  this.metaData = {};
};

Tokenizer.prototype.getCorrelationId = function(event) {
  return event.headers.correlationId || event.headers.fileName;
};

Tokenizer.prototype.getMetaData = function(correlationId) {
  var data = this.metaData[correlationId];
  if (!data) {
    this.metaData[correlationId] = data = {};
  }
  return data;
};

Tokenizer.prototype.cloneAndEmit = function(event, string) {
  var newEvent = eipUtil.cloneEvent(event);
  newEvent.body = string;
  this.emitEvent(null, newEvent);
};

Tokenizer.prototype.closeUnitOfWork = function(correlationId) {
  var newEvent = eipUtil.createEvent(this.metaData[correlationId].previousData);
  this.emitEvent(null, newEvent);
  delete this.metaData[correlationId];
};

Tokenizer.prototype.data = function(event) {
  var self = this;
  var correlationId = this.getCorrelationId(event);
  var metaData = this.getMetaData(correlationId);

  if (event.headers.fileClosed) {
    this.closeUnitOfWork(correlationId);
    return;
  }

  var body = (metaData.previousData || "") + event.body;

  var index = body.indexOf("\n");
  while (index > 0) {
    var splitString = body.slice(0, index);
    this.cloneAndEmit(event, splitString);
    body = body.slice(index + 1);
    console.log(body);
    index = body.indexOf("\n");
  };
  metaData.previousData = body;
};

Tokenizer.prototype.shutDown = function(callback) {
  console.log("Shutting down Tokenizer");
  for (var correlationId in this.metaData) {
    this.closeUnitOfWork(correlationId);
  }
  callback();
};


var FileReader = function() {};
exports.FileReader = FileReader;
util.inherits(FileReader, eip.Processor);

FileReader.prototype.init = function(options) {
  eip.Processor.call(this);
  this.options = options || {};
  this.options.encoding = "utf-8";
  this.streams = [];
}

FileReader.prototype.data = function(event) {
  var self = this,
      fileName = event.body,
      stream = fs.createReadStream(fileName, this.options);
  this.streams.push(stream);
  stream.on('data', function(data) {
    var event = eipUtil.createEvent(data);
    event.headers.fileName = fileName;
    event.headers.fileEncoding = self.options.encoding;
    self.emitEvent(null, event);
  });
  stream.on('close', function() {
    var event = eipUtil.createEvent();
    event.headers.fileName = fileName;
    event.headers.fileEncoding = self.options.encoding;
    event.headers.fileClosed = true;
    self.emitEvent(null, event);
//    self.streams.remove(stream);
  });
}


eip.Route.register("pollDirectory", DirectoryPoller);
eip.Route.register("readFile", FileReader);
eip.Route.register("tokenize", Tokenizer);
