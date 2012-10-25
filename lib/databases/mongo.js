var url = require('url'),
	util = require('util'),
	events = require('events'),
	mongodb = require('mongodb'),
	eip = require('./../eip'),
	eipUtil = require('./../util').Util;

exports.Mongo = Mongo = function() {};
util.inherits(Mongo, eip.Processor);

Mongo.prototype.init = function(server, collection) {
	// url is somehitng like 127.0.0.1:27027/test
	var self = this;
	this.url = url.parse(server);
	this.url.database = this.url.pathname.substr(1);
	this.client = new mongodb.Db(this.url.database, new mongodb.Server(this.url.hostname, this.url.port || 27017, {}))
	this.client.open(function(err, p_client) {
		self.client.collection(collection, function(err, collection) {
			self.collection = collection;
		});
	});
	eip.Processor.call(this);
}

Mongo.prototype.data = function(event) {
	var self = this;
	this.collection.insert(event.body, function(err, docs) {
		if (err) {
			self.emitEvent("Error");
			console.error("Error occured")
		} else {
			self.emitEvent(event);
		}
	});

}

Mongoose = function() {};
util.inherits(Mongoose, eip.Processor);

Mongoose.prototype.init = function() {
	var params = eipUtil.argsToArray(arguments);
	this.variable = params.shift();
	this.model = params.shift();
	this.func = params.shift();
	this.params = params;
	eip.Processor.call(this);
}

Mongoose.prototype.data = function(event) {
	var self = this;
	var callback = function(err, doc) {
		if (err) {
			console.error("ERROR ", err, doc);
		} else {
			event.headers[self.variable] = doc;
			self.emitEvent(event);
		}
	}
	
	var f = this.model[this.func];
	var resolvedParams = [];
	for (var p in this.params) {
		resolvedParams[p] = eipUtil.evalRHS(event, this.params[p]);
	}
	resolvedParams.push(callback);
	f.apply(this.model, resolvedParams);
}

eip.Route.register("mongo", Mongo);
eip.Route.register("mongoose", Mongoose);
