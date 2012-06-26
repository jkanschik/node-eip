var util = require('util'),
	eip = require('./eip'),
	eipUtil = require('./util').Util;

var Throttler = function() {};
util.inherits(Throttler, eip.Processor);

Throttler.prototype.init = function(eventsPerPeriod, periodInMS) {
	this.eventsPerPeriod = eventsPerPeriod;
	this.periodInMS = periodInMS;
};

Throttler.prototype.data = function(event) {
	var self = this;
	var delay = this.getDelay();
	setTimeout(function() {
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

eip.Route.register("throttle", Throttler);
