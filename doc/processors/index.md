---
layout: default
title: Overview about Processors
---
# Processors

## What is a processor?


## Available processors

The following is a list of processors which come "out-of-the-box" with the Node EIP module:

* `.log` prints the event or text to the console or a stream.
* `.route` sends the event to a fixed set of other routes. Implements the "Message Router" pattern.
* `.choice` sends the event to another route based on the content of the event. Implements the "Content-based Message Router" pattern.
* `.filter` filters events based on the content of the event. Implements the "Message Filter" pattern.
* `.aggregate` aggregates incoming events using the `correlationId`. Implements the "Aggregator" pattern.
* `.process` is used for generic processing. The event is processed by a user-defined function. Useful to convert events.
* `.eval` 
* `.array` collects all incoming events in an array. Mainly useful for debugging purposes.
