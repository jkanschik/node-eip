var util = require('util'),
	async = require('async'),
	stats = require('./defaultStatisticHandler'),
	eipUtil = require('./util.js').Util;

var config = {
		route: {
			retryLimit: 3,
			retryDelay: 1000,
			statisticHandler: new stats.StatisticHandler()
		},
		processor: {
			
		}
};

exports.config = config;


_routeCounter = 1;
Route = function() {
	var name, options;
	for (var i = 0; i < arguments.length; i++) {
		if (typeof(arguments[i]) === "string")
			name = arguments[i];
		else
			options = arguments[i];
	}

	var self = this;
	this.name = name || "Route" + _routeCounter++;
	this.options = options || {};
	this.processors = [];
	if (!this.options.isErrorRoute) {
		this.errorRoute =
			new Route(this.name + ".Errorroute", {isErrorRoute: true})
				.error()
				.error("Stacktrace: ${headers._exception.cause.stack}.");

	}
	return this;
};

exports.Route = Route;

Route.prototype.inject = function(event) {
	if (this.processors.length == 0) {
		return this;
	}
	config.route.statisticHandler.eventInjected(this);
	this._putEventToEventQueue(this.processors[0], eipUtil.createEvent(event));
//	this.sendEventToProcessor(this.processors[0], eipUtil.createEvent(event));
	return this;
};

var ProcessorStates = {
		STARTED: "started",
		BUSY: "busy",
		SHUTTING_DOWN: "shutting down",
		SHUT_DOWN: "shut down"
};

Route.register = function(name, processor) {
	Route.prototype[name] = function() {
		var route = this,
			proc = new processor();
		proc.route = this;
		proc.name = name;
		proc.id = route.name + "#" + this.processors.length + "(" + proc.name + ")";
		proc.init.apply(proc, eipUtil.argsToArray(arguments));
		proc.state = ProcessorStates.STARTED;
		var procMeta = {
				processor: proc,
				inQueue: [],
				inQueueIndex: 0
			};
		this.processors.push(procMeta);
		if (this.processors.length > 1) {
			var previousProcMeta = this.processors[this.processors.length - 2];
			previousProcMeta.next = procMeta;
			procMeta.previous = previousProcMeta;
		}
		return this;
	};
};

/** Local utility function to store an error in the event header.
 *  The numberOfAttempts is set / automatically increased.
 */
var setErrorOnEvent = function(err, event, processor) {
	if (!event.headers._exception)
		event.headers._exception = {numberOfAttempts: 0};
	event.headers._exception.cause = err;
	event.headers._exception.timestamp = new Date();
	event.headers._exception.numberOfAttempts += 1;
	event.headers._exception.processor = processor.id;
	console.log("Error occured for event %s\n Number of attempts: %d; error: %s.",
		util.inspect(event, false, 2), event.headers._exception.numberOfAttempts, err);
};

Route.prototype.dispatchEvent = function(err, event, processor) {
	var procMeta = this._findProcessorMetaById(processor.id);
	event = eipUtil.createEvent(event);
	config.route.statisticHandler.eventEmittedByProcessor(this, processor);
	if (err) {
		setErrorOnEvent(err, event, processor);
		var retryLimit = config.route.retryLimit;
		if (event.headers._exception.numberOfAttempts < retryLimit) {
			var self = this;
			var delay = config.route.retryDelay;
			console.log("Retry limit not reached, try again in %d ms.", delay);
			setTimeout(function() {
				self._putEventToEventQueue(procMeta, event);
			}, delay);
		} else {
			this._sendEventToErrorRoute(event);
		}
	} else {
		if (procMeta.next)
			this._putEventToEventQueue(procMeta.next, event);
	}
};

/** Puts an event to the in-queue of the processor,
 * so that it will be processed as soon as possible.
 * If the processor is shutting down, the event is routed to the error route.
 */
Route.prototype._putEventToEventQueue = function(procMeta, event) {
	var processor = procMeta.processor;
	if (processor.state === ProcessorStates.SHUTTING_DOWN ||
		processor.state === ProcessorStates.SHUT_DOWN) {
		setErrorOnEvent(
				new Error("Processor " + processor.id + " is shutting down, no events are accepted!"),
				event, processor);
		this._sendEventToErrorRoute(event);
	} else {
		procMeta.inQueue.push(event);
		var self = this;
		process.nextTick(function() {
			self._processQueue(procMeta);
		})
	}
};

/** Immediately sends event to error route. */
Route.prototype._sendEventToErrorRoute = function(event) {
	if (this.errorRoute) {
		console.warn("Retry limit reached, send event to error route. Event: %j", event);
		this.errorRoute.inject(event);
	} else {
		console.error("Unrecoverable error in error route, give up processing event %j.", event);
	}
};

/** Process the events which are in the in queue for a specific processor. */
Route.prototype._processQueue = function(procMeta) {
	var queueLength = procMeta.inQueue.length;
	if (queueLength === 0) return;

	while (procMeta.inQueueIndex < queueLength) {
		var event = procMeta.inQueue[procMeta.inQueueIndex++];
		this._sendEventToProcessorSync(procMeta.processor, event);
	}
	procMeta.inQueue.splice(0, procMeta.inQueueIndex);
	procMeta.inQueueIndex = 0;
};

/** Immediately sends an event to a processor.
 * @private
 */
Route.prototype._sendEventToProcessorSync = function(processor, event) {
	try {
		config.route.statisticHandler.eventReceivedByProcessor(this, processor);
		processor.data.apply(processor, [event]);
	} catch (err) {
		this.dispatchEvent(err, event, processor);
	}
};

Route.prototype._findProcessorMetaById = function(id) {
	var length = this.processors.length;
	for (var i = 0; i < length; i++) {
		if (this.processors[i].processor.id === id)
			return this.processors[i];
	}
};

var tryShutDown = function(procMeta, callback) {
//	console.log("Trying to shut down processor %s.", procMeta.processor.id);
	procMeta.processor.state = ProcessorStates.SHUTTING_DOWN;
	if (procMeta.inQueue.length === 0) {
		// inQueue is empty and we can finally shut down the processor:
		procMeta.processor.shutDown(function(err) {
			procMeta.processor.state = ProcessorStates.SHUT_DOWN;
			callback(err);
		});
	} else {
//		console.log("Shutting down processor %s must be delayed because of non-empty in-queue.",
//				procMeta.processor.id);
		// Since there are still events to be sent to the processor, wait a moment and try again:
		process.nextTick(function() {tryShutDown(procMeta, callback);});
	}
};

/** Shuts down all processors in this route.
 * TODO Route.inject possible after shutdown? States for routes like "shutting down"?
 * @param callback A callback which is called when all processors have been shut down or if an error occurred. 
 */
Route.prototype.shutDown = function(callback) {
	var self = this;
	async.forEachSeries(this.processors, tryShutDown, function(err) {
		if (callback)
			callback(err);
	});
};


// EventEmitter
var Processor = function() {};
exports.Processor = Processor;
Processor.prototype.init = function() {};
Processor.prototype.shutDown = function(callback) {
//	console.log("Shutting down processor %s.", this.id);
	callback();
};
Processor.prototype.emitEvent = function() {
	var err, event;
	if (arguments.length == 1) {
		event = arguments[0];
	} else if (arguments.length == 2) {
		err = arguments[0];
		event = arguments[1];
	} else {
		throw new Error("Processor.emitEvent has been called with wrong parameters");
	}
	this.route.dispatchEvent(err, event, this);
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
	var callback = function() {
		self.emitEvent.apply(self, eipUtil.argsToArray(arguments));
	}
	this.map.apply(this, [event, callback]);
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

require("./logger/default");
require('./el/templating');
require("./smtp");
require("./throttler");
require("./databases/mongo");



var globalErrorRoute = 
	new Route("GlobalErrorRoute", {isErrorRoute: true})
		.fatal()
		.fatal("Stacktrace: ${headers._exception.cause.stack}.");

exports.globalErrorRoute = globalErrorRoute;

process.on('uncaughtException', function (err) {
	console.error("An uncaught exception occured! If possible, the error will be sent to the global error route.");
	console.error("Error: " + err);
	if (err.stack) {
		console.error(err.stack);
	}
	if (globalErrorRoute) {
		var event = eipUtil.createEvent("Uncaught exception.");
		event.headers._exception = {cause: err, timestamp: new Date()};
		globalErrorRoute.inject(event);
	} else {
		console.log("About to exit");
		process.exit(8);
	}
});

