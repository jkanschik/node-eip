var util = require('util'),
	eip = require('./eip'),
	eipUtil = require('./util').Util;

var Throttler = function() {};
util.inherits(Throttler, eip.Processor);

Throttler.prototype.init = function(eventsPerPeriod, periodInMS) {
	if (!eventsPerPeriod || eventsPerPeriod < 1)
		throw new Error("Number of events per period is " + eventsPerPeriod + ", but must be positive.");
	this.eventsPerPeriod = eventsPerPeriod;
	this.periodInMS = periodInMS || 1000;
	this.eventsInProgress = 0;
};

Throttler.prototype.data = function(event) {
	var self = this;
	var delay = this.getDelay();
	this.eventsInProgress++;
	setTimeout(function() {
		self.eventsInProgress--;
		self.emitEvent(event);
	}, delay);
};

Throttler.prototype.getDelay = function() {
	var now = new Date().getTime();
	if (!this.slot) {
		this.slot = {
			startTime: now,
			duration: this.periodInMS,
			capacity: this.eventsPerPeriod
		}
	}
	if (this.slot.capacity == 0) {
		this.slot.startTime = Math.max(now, this.slot.startTime + this.slot.duration);
		this.slot.duration = this.periodInMS;
		this.slot.capacity = this.eventsPerPeriod;
	}
	this.slot.capacity -= 1;
	return this.slot.startTime - now;
};

var tryShutDown = function(throttler, callback) {
	if (throttler.eventsInProgress === 0)
		callback();
	else
		process.nextTick(function() {tryShutDown(throttler, callback);});
};

Throttler.prototype.shutDown = function(callback) {
	tryShutDown(this, callback);
};

eip.Route.register("throttle", Throttler);
