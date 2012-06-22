---
layout: default
title: Error handling
---
# Error handling

Node EIP tries to simplify the error handling as much as possible. The error handling is based on two assumptions:

1. A lot of errors in a system - especially in integration scenarios - are related to network problems
   or similar connection issues. A simple retry after a configurable time may solve a lot of such problems.
   Hence the default behavior is to wait and try again.
2. If retries don't work, logging the error to files or syserr is good, but not sufficient.
   Maybe you want to store the failing messages in a queue for later processing,
   sent messages to other systems or sent mails to the right people.
   Hence failed messages are sent to an error route.
   The default route is a simple logging, but of course you can change the route to whatever you like. 

## Retries and error routes

When an error occurred, Node EIP first tries to process the event again after a given time (defaults to 1 second).
If in the meantime the error has been resolved (maybe the original error was due to a temporary network problem),
everything is fine and you won't notice the problem.

If the error persists, Node EIP will try again until the retry limit (defaults to 3 retries) is reached.
In this case, the event is sent to the error route.
The error route is a normal route, the only difference is typically that failures in the error route are simply logged to sysout
and there is no further processing.

To change the error route, you can set the property `errorRoute` on the route as in the following example:

    var r = new Route().process(function(event, callback) {
    	throw new Error("Went wrong");
    });
    r.errorRoute = new Route().log("An error has occured!).log();
    r.inject();

In this case, the processor is called 3 times since this is the default retry limit.
After the retries, the event is sent to the second route which logs the text "An error has occured!"
and then the event itself.

In a more realistic scenario, you may want to send out a mail using the `.smtp` processor
or store the event in some queue or database. 

## Raising an error in a processor

Raising an exception is generally considered not to be best practice with Javascript,
see for example the comment on [Stack overflow](http://stackoverflow.com/questions/7310521/node-js-best-practice-exception-handling).

In general, you should pass the error together with the original event to the callback,
which will trigger the error handling.
However, if an exception is thrown and not caught, there are two different situations:
if the exception is thrown synchronously, the exception is caught by Node EIP and handled;
if the exception is thrown in an asynchronous function in the processor, there is no simple way to recover.
In this case, Node EIP catches the error and sends the error to the global error route.

### Passing errors in callbacks

Throwing an exception in a processor is only an option if the processor doesn't use callbacks.
If an error occurs in a callback, please emit the original event and the error as in the example:

    new Route().process(function(event, callback) {
    	setTimeout(function() {
    		try {
    			throw new Error("Exception thrown in a callback!");
    		} catch(err) {
    			// we have to catch the exception - Node EIP can't catch it automatically.
    			// report the error back to Node EIP:
    			callback(event, err);
    		};
    	}, 1000);
    });

### Synchronous exception handling

When an exception is thrown in the synchronous part of a processor,
Node EIP will catch this exception and trigger the further error handling.

Look at the following example:

    new Route().process(function(event, callback) {
    	throw new Error("Went wrong");
    }).inject();

When the injected event is processed by `.process`, Node EIP catches the error.
After waiting a certain time (defaults to 1 second), Node EIP tries again, which of course fails again.
This is repeated up to 3 times (again, this can be configured) and after 3 attempts,
Node EIP gives up and writes the event to the default error route, which simply logs the event.

### Asynchronous exception handling

If an exception is thrown in an asynchronous callback in the processor,
there is no chance to catch the exception together with information about the processor.
If this happens, Node EIP sends the event to the so-called global error route.

The default global error route prints the error and (if available) the stack trace to the logger with log level "fatal".

If you want to change the default, you can do this:

    var eip = require('eip');
    eip.globalErrorRoute = new Route({isErrorRoute: true}).doSomethingSpecial();

or 

    var eip = require('eip');
    eip.globalErrorRoute.doSomethingSpecial();

### Information about the error

When an event cannot be processed, the header of the event contains information about the error in the property `_exception`.
This is a reserved header field which you must not overwrite - unless you want to screw up the error processing.

The `_exception` header has the following fields:

* `cause`: the original exception which has been raised or reported by the processor.
* `time`: the time when the error occured.
* `numberOfAttempts`: the number of (failed) calls of the processor.   

