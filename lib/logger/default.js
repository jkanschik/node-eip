var util = require('util'),
	sel = require('./../el/sel'),
	eip = require('./../eip');

var Logger = function(text) {};
util.inherits(Logger, eip.Processor);

Logger.prototype.init = function(text) {
	if (text) {
		this.fn = sel.compile(text);
	}
};

Logger.prototype.data = function(event) {
	if (this[this.name])
		this[this.name].call(this, event);
	else
		this.log(event);
};

var formatDate = function(date) {
	return util.format("%s-%s-%s %s:%s:%s.%s", 
			date.getFullYear(),
			date.getMonth() + 1,
			date.getDate(),
			date.getHours(),
			date.getMinutes(),
			date.getSeconds(),
			date.getMilliseconds());
}

var formatLogMessage = function(logger, string) {
	var level = logger.name.toUpperCase();
	if (level.length < 5)
		level += "     ".substr(0, 5-level.length);
	return util.format("%s [%s] (%s): %s", 
			formatDate(new Date()),
			level,
			logger.route.name,
			string);
}
Logger.prototype.log = function(event) {
	var string = this.fn ? this.fn(event) : util.inspect(event, false, 2);
	console.log(formatLogMessage(this, string));
	this.emitEvent(event);
};

Logger.prototype.warn = function(event) {
	this.error(event);
};

Logger.prototype.fatal = function(event) {
	this.error(event);
};

Logger.prototype.error = function(event) {
	var string = this.fn ? this.fn(event) : util.inspect(event, false, 2);
	console.error(formatLogMessage(this, string));
	this.emitEvent(event);
};

eip.Route.register("trace", Logger);
eip.Route.register("debug", Logger);
eip.Route.register("info", Logger);
eip.Route.register("log", Logger);
eip.Route.register("warn", Logger);
eip.Route.register("error", Logger);
eip.Route.register("fatal", Logger);
