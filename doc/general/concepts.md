---
layout: default
title: Concepts of Enterprise Intergration Pattern
---

# Concepts

## Event

An event can represent anything - a sale of a product, a call of a rest service, the content of a file.

Technically, an event is nothing but a JSON structure with two attributes: `headers` and `body`.

The body contains the actual payload of the event.
There is no restriction on the structure of the body, i.e. it could be the content of a file (as string or buffer), a stream or just an integer.  

The header contains meta information about the event, probably the most important being the `id` header, which is a mandatory header field.

### Reserved Headers

There are certain header names which are reserved and have a special meaning. These are:

* `id`: The id of an event. If the id is not explicitly defined when the event is created, node-eip will generate an id.
* `correlationId`: The correlation id of an event, mainly used for aggregation.
* `_exception`: Used internally for error handling.


## Route

A route is series of event processors.

## Processor

A processor (or event processor) is used to work on an event. It accepts an event (only one at a time) and emits an event.
The emitted event can be the incoming event (for example for the logger), the incoming event with new or changed data in the header or body, or a completely new event. Of course, this is up to the processor.

The processor is added to a route by calling a corresponding method on the route object, for example `r = new Route().log()` will create a route with one processor, the `Logger`. When an event is injected into the route via `r.inject(myEvent)`, the event is routed to the logger and sent to `stdout`.
