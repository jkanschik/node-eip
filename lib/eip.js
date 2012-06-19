var util = require('util'),
	events = require('events'),
	sel = require('./el/sel'),
	eipUtil = require('./util.js').Util;

var Route = function(options) {
	this.options = options || {};
	this.firstProcessor = null;
	this.lastProcessor = null;
	this.sync = this.options.sync;
	
	return this;
};

exports.Route = Route;

Route.prototype.inject = function(event) {
	if (this.firstProcessor === null) {
		return this;
	}
	var self = this;
	if (this.sync) {
		this.firstProcessor.data(eipUtil.createEvent(event));
	} else {
		process.nextTick(function() {
			self.firstProcessor.data(eipUtil.createEvent(event));
		});
	}
	return this;
};

Route.register = function(name, processor) {
//	util.inherits(processor, Processor);
	Route.prototype[name] = function() {
		var route = this,
			proc = new processor();
		proc.init.apply(proc, eipUtil.argsToArray(arguments));
//		processor.prototype.constructor.apply(proc, argsToArray(arguments));
		if (!this.firstProcessor) {
			this.firstProcessor = proc;
		}
		if (this.lastProcessor) {
			this.lastProcessor.on("data", function(event) {
				if (route.sync) {
					proc.data.apply(proc, [event]);
				} else {
					process.nextTick(function() {
						proc.data.apply(proc, [event]);
					});
				}
			});
		}
		this.lastProcessor = proc;
		return this;
	};
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
Processor.prototype.emitEvent = function(event) {
	this.emit("data", eipUtil.createEvent(event));
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
		function(newEvent){
			self.emitEvent(newEvent);
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


Route.register("aggregate", require("./aggregator").Aggregator);
