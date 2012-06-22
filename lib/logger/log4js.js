var util = require('util'),
	log4js = require('log4js'),
	sel = require('./../el/sel'),
	eip = require('./../eip');

var Log4js = function(text) {};
util.inherits(Log4js, eip.Processor);

exports.configure = log4js.configure;

Log4js.prototype.init = function(text) {
	this.logger = log4js.getLogger(this.route.name);
	if (text) {
		this.fn = sel.compile(text);
	}
};

Log4js.prototype.data = function(event) {
	var string = this.fn ? this.fn(event) : util.inspect(event, false, 2);
	this.logger.log(this.name.toUpperCase(), string);
	this.emitEvent(event);
};

Log4js.prototype.shutDown = function() {
	console.log("Shutting down logger...");
	// close stream
	Logger.super_.prototype.shutDown();
};

eip.Route.register("trace", Log4js);
eip.Route.register("debug", Log4js);
eip.Route.register("info", Log4js);
eip.Route.register("log", Log4js);
eip.Route.register("warn", Log4js);
eip.Route.register("error", Log4js);
eip.Route.register("fatal", Log4js);
