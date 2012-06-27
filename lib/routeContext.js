
var defaultOptions = {
		sync: false
};

var RouteContext = function() {
	this.options = defaultOptions; 
	this.routes = {};
};

RouteContext.prototype.addRoute = function(route) {
	this.routes[route.name] = route;
	route.context = this;
};

RouteContext.prototype.getRoute = function(name) {
	return this.routes[route.name];
};

RouteContext.prototype.removeRoute = function(route) {
	delete route.context;
	delete this.routes[route.name];
};

RouteContext.prototype.getRoutes = function() {
	return this.routes;
};

RouteContext.prototype.shutDown = function() {
	for (var routeName in this.routes) {
		this.routes[routeName].shutDown();
	}
};



RouteContext.prototype.configure = function(options) {
	this.options = options;
};

exports.RouteContext = RouteContext;
