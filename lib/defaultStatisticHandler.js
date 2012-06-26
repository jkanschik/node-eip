var StatisticHandler = function() {
	var self = this;
	this.routeStatistics = {};
	this.processorStatistics = {};
//	setInterval(function() {
//		for (var procId in self.processorStatistics) {
//			var stats = self.processorStatistics[procId];
//			stats.receivedEventsPerSecond = stats._private.receivedEventsPerSecond;
//			stats._private.receivedEventsPerSecond = 0;
//			stats.emittedEventsPerSecond = stats._private.emittedEventsPerSecond;
//			stats._private.emittedEventsPerSecond = 0;
//		}
//	}, 1000);
//	setInterval(function() {
//		console.log("Route statistics: ");
//		console.log(self.routeStatistics);
//		console.log("Processor statistics: ");
//		console.log(self.processorStatistics);
//	}, 10000);

};
StatisticHandler.prototype.getProcessorStats = function(proc) {
	var stats = this.processorStatistics[proc.id];
	if (!stats) {
		stats = {
			totalNumberOfReceivedEvents: 0,
			totalNumberOfEmittedEvents: 0,
			receivedEventsPerSecond: 0,
			emittedEventsPerSecond: 0,
			_private: {
				receivedEventsPerSecond: 0,
				emittedEventsPerSecond: 0,
			}
		};
		this.processorStatistics[proc.id] = stats;
	}
	return stats;
};
StatisticHandler.prototype.getRouteStatistics = function(route) {
	var stats = this.routeStatistics[route.name];
	if (!stats) {
		stats = {
			totalNumberOfInjectedEvents: 0,
			_private: {
				receivedEventsPerSecond: 0,
				emittedEventsPerSecond: 0,
			}
		};
		this.routeStatistics[route.name] = stats;
	}
	return stats;
};
StatisticHandler.prototype.eventInjected = function(route) {
	var stats = this.getRouteStatistics(route);
	stats.totalNumberOfInjectedEvents++;
};
StatisticHandler.prototype.eventReceivedByProcessor = function(route, processor) {
	var stats = this.getProcessorStats(processor);
	stats.totalNumberOfReceivedEvents++;
	stats._private.receivedEventsPerSecond++;
};
StatisticHandler.prototype.eventEmittedByProcessor = function(route, processor) {
	var stats = this.getProcessorStats(processor);
	stats.totalNumberOfEmittedEvents++;
	stats._private.emittedEventsPerSecond++;
};

exports.StatisticHandler = StatisticHandler;