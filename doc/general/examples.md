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



