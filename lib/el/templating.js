var util = require('util'),
	jade = require('jade'),
	sel = require('./sel'),
	events = require('events'),
	eip = require('../eip'),
	eipUtil = require('../util').Util;

var Converter = function(compiler, object, options) {
	this.attributes = {};
	for (var attr in object) {
		if (typeof(object[attr]) == 'string') {
			this.attributes["__" + attr] = compiler(object[attr], options);
		} else if (typeof(object[attr]) == 'object') {
			var conv = new Converter(compiler, object[attr], options);
			this.attributes["__" + attr] = function(o) {
				return conv.apply(o);
			}
		} else {
			var value = object[attr];
			this.attributes["__" + attr] = function(o) {
				return value;
			}
		}
	}
}

Converter.prototype.apply = function(o) {
	var result = {}
	for (var a in this.attributes) {
		result[a.substring(2)] = this.attributes[a](o);
	}
	return result;
}

var StringConverter = function(compiler, template, options) {
	this.fn = compiler(template, options);
}
StringConverter.prototype.apply = function(o) {
	return this.fn(o);
}

// Generic template processor
var TemplateProcessor = function() {};
util.inherits(TemplateProcessor, eip.Processor);
TemplateProcessor.prototype.init = function(text, options) {
//	this.compiler = function(template, options) {return jade.compile(template, options);}
	this.text = text;
	this.converter = this.getConverter(text, options);
	eip.Processor.call(this);
}
TemplateProcessor.prototype.getConverter = function(text, options) {
	if (typeof(text) == 'string') {
		return new StringConverter(this.compiler, text, options);
	} else {
		return new Converter(this.compiler, text);
	}
}
TemplateProcessor.prototype.data = function(event) {
	if (!this.text && event.headers._template) {
		this.converter = this.getConverter(event.headers._template, {});
	}
	event.body = this.converter.apply(event);
	this.emitEvent(event);
}


//Jade template engine
var Jade = function() {};
util.inherits(Jade, TemplateProcessor);
Jade.prototype.init = function(text, options) {
	this.compiler = function(template, options) {return jade.compile(template, options);}
	TemplateProcessor.prototype.init.call(this, text, options);
}

//Simple template engine
var Simple = function() {};
util.inherits(Simple, TemplateProcessor);
Simple.prototype.init = function(text, options) {
	this.compiler = function(template, options) {return sel.compile(template, options);}
	TemplateProcessor.prototype.init.call(this, text, options);
}

eip.Route.register("jade", Jade);
eip.Route.register("simple", Simple);
