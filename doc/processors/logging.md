---
layout: default
title: Logging
next: Message Routing
next_url: doc/processors/dispatching
---
# Logging

The logger writes the event to a specified stream, which defaults to `stdout`, without changing the event. It can be added to a route using the `log` function.

The following example will write the event to `stdout`: 

    new Route().log().inject({body:'Hello world'})
   
The following example will write the text "Hello world" to `stdout`:
 
    new Route().log("Hello World").inject({})

## Available logging adapters

### Log4js-node

    var eip = require('eip'),
		log4js = require('eip/logger/log4js');

	log4js.configure({
    	appenders: [
        	        { type: 'console' },
            	    { type: 'file', filename: 'route1.log', category: 'Route1' }
	            ]
	});

	var r = new eip.Route().log().warn("${body}.").debug().inject("Message");

## Use Node EIP logging in processors

How to use the logging from processors?

eip.Logger.log(...)?