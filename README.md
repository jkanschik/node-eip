# Node EIP

[![Build Status](https://secure.travis-ci.org/jkanschik/node-eip.png)](http://travis-ci.org/jkanschik/node-eip)

# Examples

## Hello World
Send an event with the body "Hello World!" to `stdout`:

    new Route().log().inject("Hello World!");

or
    
    var route = new Route().log();
    route.inject("Hello World!"); // send an event to the route.

## Collecting events in an array
The following example is especially usefull for testing purposes since it collects all injected events in an array.

    var array = [];
    var r = new Route({sync: true}).toArray(array);
    
    r.inject("First event");
    r.inject("Second event");
    
    console.log(array); // write an array consisting of the two events.


# Concepts

## Event

An event can represent anything - a sale of a product, a call of a rest service, the content of a file.

Technically, an event is nothing but a JSON structure with two attributes: `headers` and `body`.

The body contains the actual payload of the event.
There is no restriction on the structure of the body, i.e. it could be the content of a file (as string or buffer), a stream or just an integer.  

The header contains meta information about the event, probably the most important being the `id` header, which is a mandatory header field.


## Route

A route is series of event processors.

## Processor

A processor (or event processor) is used to work on an event. It accepts an event (only one at a time) and emits an event.
The emitted event can be the incoming event (for example for the logger), the incoming event with new or changed data in the header or body, or a completely new event. Of course, this is up to the processor.

The processor is added to a route by calling a corresponding method on the route object, for example `r = new Route().log()` will create a route with one processor, the `Logger`. When an event is injected into the route via `r.inject(myEvent)`, the event is routed to the logger and sent to `stdout`.



# Reserved Headers

There are certain header names which are reserved and have a special meaning. These are:

* `id`: The id of an event. If the id is not explicitly defined when the event is created, node-eip will generate an id.
* `correlationId`: The correlation id of an event, mainly used for aggregation.

# Processors

## Logger

The logger writes the event to a specified stream, which defaults to `stdout`, without changing the event. It can be added to a route using the `log` function.

The following example will write the event to `stdout`: 

    new Route().log().inject({body:'Hello world'})
   
The following example will write the text "Hello world" to `stdout`:
 
    new Route().log("Hello World").inject({})

## Generic processor


    new Route().process(function(event, callback) {
    	var newEvent = util.createEvent();
        // do something with the event...
        callback(newEvent);
    }).inject({body:'Hello world'})


## Filter

The following route will only process events where `body.status == 'OK'`:

    new Route().filter("body.status == 'OK'")

## Choice or dynamic dispatching


## Aggregation Processor

The aggregation processor allows you to combine a number of incoming event to a single event.

This processor uses three functions (with reasonable defaults) which can be provided when defining the route: the correlator to determine which events belong together, the aggregator to perform the actual aggregation and the emitter to determine when the aggregation is finished and the aggregated event can be emitted.

All three functions are executed in the scope of the aggregation processor. Hence they can access the internal status of the processor.

### Correlator

The correlator is used to determine which events belong together. It is a function which takes an incoming event and returns an object. All events for which the correlator returns the same object ("same" meaning "===") are aggregated.

The default correlator returns the correlation id of the event. If the correlation id doesn't exist, it returns the id of the event.

### Aggregator

The aggregator performs the actual aggregation, i.e. grouping of events. It is a function which takes the incoming event as an argument.

The default aggregator collects all correlating events in an array.

### Emitter

The emitter decides whether an aggregated event can be emitted. Emitters can be executed either before the aggregation, after the aggregation or asynchronously for example at given intervals.

The default emitter is the timeout emitter with a timeout interval of 1 second.

Multiple emitters can be defined in one aggregation processor.

#### timeout

The timeout emitter emits the aggregated event if no events have been aggregated for a given correlation id within a given period.

In the following route, the aggregated events are emitted if no events have been aggregated for 60 seconds: 

    new Route().aggregate({emitter: Emitter.timeout(60*1000)});

#### interval

The interval emitter emits the aggregated event every X milliseconds (if existing).

The following example would emit the aggregated events every second:

    new Route().aggregate({emitter: Emitter.interval(1000)});
    

#### completionSize

The completion size emitter emits the aggregated event when a given number of events have been aggregated. This emitter can be executed either after or before the aggregator has been executed. Per default, it is executed after aggregation. 

    new Route().aggregate({emitter: Emitter.completionSize(10)});
    





    





