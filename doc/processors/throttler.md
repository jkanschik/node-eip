---
layout: default
title: Throttling events
---
# Throttling events

Sometimes it is useful to reduce the number of events in a given time period,
for example if events are sent to other systems or components which have restrictions on number of calls per second.

The throttle processor has two parameters:
the number of seconds per time period and the length of the time period in milliseconds.
The length of the time period defaults to 1000 milliseconds (1 second).

The following example reduces the number of events to 10 per second:

    new Route("Throttling Example").throttle(10).log()

No matter how many event are injected, only 10 per second are logged.

 ** Please note **: events which are not yet processed are kept in memory.
You may want to use queues to store events if you have a really large number of incoming events to avoid memory exceptions. 
