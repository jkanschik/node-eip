# Logger

The logger writes the event to a specified stream, which defaults to `stdout`, without changing the event. It can be added to a route using the `log` function.

The following example will write the event to `stdout`: 

    new Route().log().inject({body:'Hello world'})
   
The following example will write the text "Hello world" to `stdout`:
 
    new Route().log("Hello World").inject({})

