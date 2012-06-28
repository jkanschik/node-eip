---
layout: default
title: Overview about Processors
---
# Processors

## What is a processor?


## Available processors

The following is a list of processors which come "out-of-the-box" with the Node EIP module:

* [`.trace`](logging), [`.debug`](logging), [`.info`](logging), [`.log`](logging), [`.warn`](logging), [`.error`](logging) and [`.fatal`](logging) are used to log events or messages.
  The actual behavior depends on the logger which is used. The default logger sends all messages to the console.
  See [logging](logging) for details.
* [`.route`](dispatching) sends the event to a fixed set of other routes. Implements the "Message Router" pattern.
* [`.choice`](dispatching) sends the event to another route based on the content of the event. Implements the "Content-based Message Router" pattern.
* `.filter` filters events based on the content of the event. Implements the "Message Filter" pattern.
* [`.aggregate`](aggregation) aggregates incoming events using the `correlationId`. Implements the "Aggregator" pattern.
* `.process` is used for generic processing. The event is processed by a user-defined function. Useful to convert events.
* [`.throttle`](throttler) is used to throttle the throughput, for example to support restrictions of other components/systems.
* `.eval` 
* `.array` collects all incoming events in an array. Mainly useful for debugging purposes.

