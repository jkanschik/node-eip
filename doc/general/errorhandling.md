---
layout: default
title: Error handling
---
# Error handling

Node EIP tries to simplify the error handling as much as possible. The error handling is based on two assumptions:

1. A lot of errors in a system - especially in integration scenarios - are related to network problems
   or similar connection issues. A simple retry after a configurable time may solve a lot of such problems.
   Hence the default behavior is to wait and try again.
2. If retries don't work, logging the error to files or sysout is good, but not sufficient.
   Maybe you want to store the failing messages in a queue for later processing,
   sent messages to other systems or sent mails to the right people.
   Hence failed messages are sent to an error route.
   The default route is a simple logging, but of course you can change the route to whatever you like. 

## Raising an error

Errors can be raised either by throwing javascript exceptions as usual
or they can be passed as a parameter in the callback which usually triggers the next route.

### Exception handling

When an exception is thrown in a processor, Node EIP will catch this exception and trigger the further error handling.
Look at the following example:

    new Route().process(function(event, callback) {
    	throw new Error("Went wrong");
    }).inject();

When the injected event is processed by `.process`, Node EIP catches the error.
After waiting a certain time (defaults to 1 second), Node EIP tries again, which of course fails again.
This is repeated up to 3 times (again, this can be configured) and after 3 attempts,
Node EIP gives up and writes the event to the default error route, which simply logs the event.

** Please note **: 
make sure that you catch all exceptions which are thrown in internal callbacks - 
these exceptions can not be caught by Node EIP. 
In the catch block, you should pass back the error to Node EIP using the callback method, see below. 

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
 
### Information about the error

When an event cannot be processed, the header of the event contains information about the error in the property `_exception`.
This is a reserved header field which you must not overwrite - unless you want to screw up the error processing.

The `_exception` header has the following fields:

* `cause`: the original exception which has been raised or reported by the processor.
* `time`: the time when the error occured.
* `numberOfAttempts`: the number of (failed) calls of the processor.   

## Error routes

When Node EIP has tried to process an event several times, the event is sent to the error route.
The error route is a normal route, the only difference is typically that failures in the error route are simply logged to sysout
and there is no further processing.

To change the error route, you can set the property `errorRoute` on the route as in the following example:

    var r = new Route().process(function(event, callback) {
    	throw new Error("Went wrong");
    });
    r.errorRoute = new Route().log("An error has occured!).log();
    r.inject();

In this case, the processor is called 3 times since this is the default retry limit.
After the retries, the event is sent to the second route which logs the text "An error has occured!" and then the event itself.

In a more realistic scenario, you may want to send out a mail using the `.smtp` processor or store the event in some queue or database. 

