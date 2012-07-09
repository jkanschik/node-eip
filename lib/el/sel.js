var util = require('util');

var attributeReader = function(attribute) {
	var attr = attribute.split(".");
	var fn = function(object) {
		var result = object[attr[0]];
		if (undefined == result)
			return "";
		for (var i = 1; i < attr.length; i++) {
			result = result[attr[i]];
			if (undefined == result)
				return "";
		}
		return result;
	}
	return fn;
};

exports.compile = function(template, options) {
	var regex = /(\${[1-9a-zA-Z_\.]*})/g;
	var fragments = [];
	var startIndex = 0;
	while (match = regex.exec(template)) {
		fragments.push(template.substr(startIndex, match.index - startIndex));
		var attribute = match[0].substr(2, match[0].length - 3);
		fragments.push(attributeReader(attribute));
		startIndex = match.index + match[0].length;
	}
	fragments.push(template.substr(startIndex));
	var fn = function(object) {
		var result = "";
		for (var i = 0; i < fragments.length; i++) {
			var fragment = fragments[i];
			if (typeof(fragment) === 'string') {
				result += fragment;
			} else {
				var f = fragment(object);
				if (typeof(f) === 'object') {
					result += util.inspect(f, false, 2);
				} else {
					result += f;
				}
			}
		}
		return result;
	}
	return fn;
}