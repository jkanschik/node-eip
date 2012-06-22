var util = require('util'),
	events = require('events'),
	sel = require('./el/sel'),
	eipUtil = require('./util.js').Util;

var config = {
		route: {
			retryLimit: 3,
			retryDelay: 1000
		},
		processor: {
			
		}
};

exports.config = config;

var Route = function(options) {
	this.options = options || {};
	this.firstProcessor = null;
	this.lastProcessor = null;
	this.sync = this.options.sync;
	if (!this.options.isErrorRoute) {
		this.errorRoute = new Route({isErrorRoute: true}).log();
	}
	return this;
};

exports.Route = Route;

Route.prototype.inject = function(event) {
	if (this.firstProcessor === null) {
		return this;
	}
	this.sendEventToProcessor(this.firstProcessor, eipUtil.createEvent(event));
	return this;
};

Route.register = function(name, processor) {
	Route.prototype[name] = function() {
		var route = this,
			proc = new processor();
		proc.route = this;
		proc.init.apply(proc, eipUtil.argsToArray(arguments));
		if (!this.firstProcessor) {
			this.firstProcessor = proc;
		}
		if (this.lastProcessor) {
			this.lastProcessor.next = proc;
		}
		this.lastProcessor = proc;
		return this;
	};
};

Route.prototype.dispatchEvent = function(processor, event, err) {
	if (err) {
		if (!event.headers._exception)
			event.headers._exception = {numberOfAttempts: 0};
		event.headers._exception.cause = err;
		event.headers._exception.timestamp = new Date();
		event.headers._exception.numberOfAttempts += 1;
		console.log("Error occured for event %j, number of attempts: %d; error: ",
			event, event.headers._exception.numberOfAttempts, err);
		
		var retryLimit = config.route.retryLimit;
		if (event.headers._exception.numberOfAttempts < retryLimit) {
			var self = this;
			var delay = config.route.retryDelay;
			console.log("Retry limit not reached, try again in %d ms.", delay);
			setTimeout(function() {
				self.sendEventToProcessorSync(processor, event);
			}, delay);
		} else {
			if (this.errorRoute) {
				console.warn("Retry limit of %d reached, send event to error route. Event: %j", retryLimit, event);
				this.errorRoute.inject(event);
			} else {
				console.error("Unrecoverable error in error route, give up processing event %j.", event);
			}
		}
	} else {
		if (processor.next)
			this.sendEventToProcessor(processor.next, event);
	}
};

Route.prototype.sendEventToProcessor = function(processor, event) {
	if (this.sync) {
		this.sendEventToProcessorSync(processor, event);
	} else {
		var self = this;
		process.nextTick(function() {
			self.sendEventToProcessorSync(processor, event);
		});
	}
};

Route.prototype.sendEventToProcessorSync = function(processor, event) {
	try {
		processor.data.apply(processor, [event]);
	} catch (err) {
		this.dispatchEvent(processor, event, err);
	}
};

Route.prototype.shutDown = function() {
	if (this.firstProcessor) {
		this.firstProcessor.shutDown();
	}
};

// EventEmitter
var Processor = function() {
	events.EventEmitter.call(this);
};
exports.Processor = Processor;
util.inherits(Processor, events.EventEmitter);
Processor.prototype.init = function() {
	// do nothing
};
Processor.prototype.emitEvent = function(event, err) {
	this.route.dispatchEvent(this, event, err);
};
Processor.prototype.shutDown = function() {
	this.emit("shutDown");
};


// Map
var Mapper = function() {};
util.inherits(Mapper, Processor);
Route.register("process", Mapper);
Mapper.prototype.init = function(map) {
	this.map = map;
};
Mapper.prototype.data = function(event) {
	var self = this;
	this.map.apply(this, [event,
		function(newEvent, err){
			self.emitEvent(newEvent, err);
		}]);
};

//Logger
var Logger = function(text) {};
util.inherits(Logger, Processor);
Route.register("log", Logger);
Logger.prototype.init = function(text) {
	if (text) {
		this.fn = sel.compile(text);
	}
};
Logger.prototype.data = function(event) {
	if (this.fn) {
		console.log(this.fn(event));
	} else {
		console.log("Event: ", util.inspect(event, false, 2));
	}
	this.emitEvent(event);
};
Logger.prototype.shutDown = function() {
	console.log("Shutting down logger...");
	// close stream
	Logger.super_.prototype.shutDown();
};

//Dispatcher
var Dispatcher = function() {};
util.inherits(Dispatcher, Processor);
Route.register("dispatch", Dispatcher);
Dispatcher.prototype.init = function() {
	this.routes = eipUtil.argsToArray(arguments);
};
Dispatcher.prototype.data = function(event) {
	this.routes.forEach(function(route) {
		route.inject(event);
	});
	this.emitEvent(event);
};

//Choice
var Choice = function() {};
util.inherits(Choice, Processor);
Route.register("choice", Choice);
Choice.prototype.init = function(choice, routes) {
	var route, i;
	this.choice = choice;
	this.routes = [];
	for (i in routes) {
		route = routes[i];
		if (route.otherwise) {
			this.otherwise = route.otherwise;
		} else {
			this.routes.push(route);
		}
	}
};
Choice.prototype.data = function(event) {
	var r, when,
		routeFound = false,
		choice = eipUtil.evalRHS(event, this.choice);
	for (r in this.routes) {
		when = this.routes[r].when;
		if (choice === when) {
			this.routes[r].route.inject(event);
			routeFound = true;
		}
	}
	if (!routeFound && this.otherwise) {
		this.otherwise.inject(event);
	}
	this.emitEvent(event);
};

//Arraysink
var ArraySink = function() {};
util.inherits(ArraySink, Processor);
Route.register("toArray", ArraySink);
ArraySink.prototype.init = function(array) {
	this.array = array;
};
ArraySink.prototype.data = function(event) {
	this.array.push(event);
	this.emitEvent(event);
};

//Eval
var Eval = function() {};
util.inherits(Eval, Processor);
Route.register("eval", Eval);
Eval.prototype.init = function(code) {
	this.code = code;
};
Eval.prototype.data = function(event) {
	with (event) {
		eval(this.code)
	}
	this.emitEvent(event);
};

//Filter
var Filter = function() {};
util.inherits(Filter, Processor);
Route.register("filter", Filter);
Filter.prototype.init = function(condition) {
	this.condition = condition;
};
Filter.prototype.data = function(event) {
	if (eipUtil.evalRHS(event, this.condition)) {
		this.emitEvent(event);
	}
};

var aggregator = require("./aggregator");
exports.aggregator = aggregator;
Route.register("aggregate", aggregator.Aggregator);

exports.util = eipUtil;

require('./el/templating');
require("./smtp");
require("./databases/mongo");
