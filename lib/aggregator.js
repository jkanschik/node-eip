var util = require('util'),
	events = require('events'),
	eip = require('./eip'),
	eipUtil = require('./util').Util;

var Correlator = {
		correlationId: function(event) {
			return event.headers.correlationId || event.headers.id;
		}
};

exports.Correlator = Correlator;

var IntervalEmitter = function(i) {
	console.log("Creating interval emitter with interval ", i);
	this.interval = i;
	this.isAsynchronous = true;
	this.isBefore = false;
	this.isAfter = false;

	var self = this;
	this.timerId = setInterval(function() {
		self.aggregator.emitAll();
	}, i);
};

IntervalEmitter.prototype.shutDown = function() {
	console.log("Shutting down emitter %j", this.timerId);
	clearInterval(this.timerId);
	this.aggregator.emitAll();
};

var Emitter = {
	IntervalEmitter: IntervalEmitter
};
exports.Emitter = Emitter;
 
//Aggregator
var Aggregator = function() {};
exports.Aggregator = Aggregator;
util.inherits(Aggregator, eip.Processor);

Aggregator.prototype.init = function(options) {
	this.options = options || {};
	if (!this.options.correlator) {
		this.options.correlator = Correlator.correlationId;
	}

	if (!this.options.emitter) {
		this.options.emitter = new IntervalEmitter(1000);
	}
	this.options.emitter.aggregator = this;

	this.aggregatedEvents = {};
	eip.Processor.call(this);
};

Aggregator.prototype.data = function(event) {
	var correlationId = this.options.correlator(event),
		aggregatedEvent = this.aggregatedEvents[correlationId];
	if (!aggregatedEvent) {
		aggregatedEvent = this.aggregatedEvents[correlationId] = eipUtil.createEvent();
	}

	// apply aggregator
	if (this.options.aggregator) {
		this.options.aggregator.apply(this, [aggregatedEvent, event]);
	} else {
		if (!util.isArray(aggregatedEvent.body)) {
			aggregatedEvent.body = [];
		}
		aggregatedEvent.body.push(event);
	}

	if (this.options.emitter.isAfter) {
		this.options.emitter.checkForEmit(correlationId);
	}
};

Aggregator.prototype.emitEventByCorrelationId = function(correlationId) {
	var e = this.aggregatedEvents[correlationId];
	delete this.aggregatedEvents[correlationId];
	this.emitEvent(e);
};

Aggregator.prototype.emitAll = function() {
	var c;
	for (c in this.aggregatedEvents) {
		this.emitEventByCorrelationId(c);
	}
};

Aggregator.prototype.shutDown = function() {
	console.log("Shutting down aggregator...");
	this.options.emitter.shutDown();
};


