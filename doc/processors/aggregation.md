---
layout: default
title: Aggregation
---
# Aggregation Processor

The aggregation processor allows you to combine a number of incoming event to a single event.

This processor uses three functions (with reasonable defaults) which can be provided when defining the route: the correlator to determine which events belong together, the aggregator to perform the actual aggregation and the emitter to determine when the aggregation is finished and the aggregated event can be emitted.

All three functions are executed in the scope of the aggregation processor. Hence they can access the internal status of the processor.

## Correlator

The correlator is used to determine which events belong together. It is a function which takes an incoming event and returns an object. All events for which the correlator returns the same object ("same" meaning "===") are aggregated.

The default correlator returns the correlation id of the event. If the correlation id doesn't exist, it returns the id of the event.

## Aggregator

The aggregator performs the actual aggregation, i.e. grouping of events. It is a function which takes the incoming event as an argument.

The default aggregator collects all correlating events in an array.

## Emitter

The emitter decides whether an aggregated event can be emitted. Emitters can be executed either before the aggregation, after the aggregation or asynchronously for example at given intervals.

The default emitter is the timeout emitter with a timeout interval of 1 second.

Multiple emitters can be defined in one aggregation processor.

### timeout

The timeout emitter emits the aggregated event if no events have been aggregated for a given correlation id within a given period.

In the following route, the aggregated events are emitted if no events have been aggregated for 60 seconds: 

    new Route().aggregate({emitter: Emitter.timeout(60*1000)});

### interval

The interval emitter emits the aggregated event every X milliseconds (if existing).

The following example would emit the aggregated events every second:

    new Route().aggregate({emitter: Emitter.interval(1000)});
    

### completionSize

The completion size emitter emits the aggregated event when a given number of events have been aggregated. This emitter can be executed either after or before the aggregator has been executed. Per default, it is executed after aggregation. 

    new Route().aggregate({emitter: Emitter.completionSize(10)});
    

