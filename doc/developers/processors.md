---
layout: default
title: Developing processors
---
# Developer notes

## Full featured processors

A processors has some properties:

* `name`: the method name in the DSL which is used to call the processor, e.g. "process", "log" etc.
* `id`: the unique id of the processor.
* `route`: the route to which the processor belongs.
* `state`: the current state of the processor. The state can only be changed by the processor.

  * `started`: available to process events.
  * `busy`: temporarily not able to process events.
     Events are buffered by the route in the in-queue and the route will try to send the events to the processor later.
  * `shutting down`: in the process of shutting down. No more events are accepted, but events may be emitted.
     There may also be some events in the in-queue for this processor, which will be processed by the processor.
  * `shut down`: shut down was successful, all resources have been released, no events are accepted or emitted.

## Methods of a processor

For a fully functional processor, the following functions should be provided:

* `init`: called when the processor is attached to a route.
  The parameters of `init` are exactly the parameters used in the DSL when the route is defined.
* `process(event, callback)`: processes an event. When the event has been processed, the callback is invoked.
  The callback has two parameters: the first is the error and the second the processed event.
* `pause` ?: advises the processor not to emit any further events.
  Please note that a processor may not pause immediately,
  so that further events may be emitted for an indeterminate period of time.
* `shutDown(callback)`: called by the route when the route is shut down.
  The processor should perform all remaining work like closing streams or connections used by the processor.
  When all remaining work is done and (if applicable) all remaining events have been emitted,
  the callback must be called. The callback has one parameter used to indicate errors during shutdown.

## Functions as processors

The simplest processors are functions of the form 

    function(event, callback, [parameter list])

The first parameter is the event that will be processed by the processor.
The second parameter is a callback which is called when the event has been processed.
This callback has two parameters, the first is the error, the second is the processed event.
Further parameters contain the parameters given in the definition of the route.

Processor functions can be registered using `eip.Route.registerFunction(name, processor)`.

They support no life cycle like normal processors.

### Example

    var eip = require('node-eip');
    var processor = function(event, callback, newBody) {
        event.body = newBody;
        callback(null, event);
    };
    eip.Route.registerFunction("newBody", processor);
    var r = new Route().newBody("my new body").log();

The first line requires the Node EIP, the second line defines the processor function.
This processor is very simple: when it is called, it replaces the body of the event with the parameter `newBody`.
The next line registers the processor.
This is an important step because the new processor must be made available to the routes.
The last line defines a route which uses the new processor.
The parameter `"my new body"` is passed to the processor function as third parameter.

### <span class="label label-warning">Warning</span> Restrictions

This way of defining processors is very simple, but it supports no lifecycle, so be careful when you use it:

1. The processor will not be informed when a route is created or shut down.
   As a result, you shouldn't allocate resources (files, database connections etc.) because you don't know when to release them.
2. If the processor performs asynchronous operations and the route is shut down,
   errors may occur and events may get lost because following processors are shut down and
   don't accept any further events while the asynchronous process still runs.
3. Logging is more difficult: there is only one instance of the processor function for all routes and
   as a result the processor doesn't know anything about it's context like for example route name. 

Hence you should only use this way of defining processors for simple, synchronous processors.
