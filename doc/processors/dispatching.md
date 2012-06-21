---
layout: default
title: Message routing
---
# Message routing

Messages can be routed to different routes using either the `.choice` or the `.route` processor.
Both can be used to implement the EIP pattern "Message Router";
`.choice` can also be used to implement the "Content-based Router" pattern.

## Fixed routing with `.route`

The `.route` processor is used to route a message to a fixed set of other routes:

    var route1 = new Route().log("Route1 received: ${body}.");
    var route2 = new Route().log("Route2 received: ${body}.");
    var route = new Route().route(route1, route2);
    
    route.inject("Event");

The event will be routed to both routes.



This implements a special version of the "Message Router" pattern. 

## Content-based routing with `.choice`



 