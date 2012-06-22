# About Node EIP [![Build Status](https://secure.travis-ci.org/jkanschik/node-eip.png)](http://travis-ci.org/jkanschik/node-eip)

Node EIP is a port of the Enterprise Integration Patterns to node.js.

Programming with node.js becomes very complex when there are various subsequent steps
which often happens in a functionally non-trivial scenario.
Typically, you hae a nested sequence of callback functions, which is difficult to read and write.
The node module async.js provides help in a lot of situations, but Node EIP will make life even easier.

# Getting Started

If you are familiar with the Enterprise Integration Patterns, have a look at some [examples](http://jkanschik.github.com/node-eip/doc/general/examples)
and dive in into the different processors provided by Node EIP.

If EIP is completely new to you, you should start with the chapter about EIP concepts, and proceed with the examples. 

# Installation

To install the latest from the repository, run::

    npm install https://github.com/jkanschik/node-eip.git

# Examples

The typical "Hello world!" example, which simply prints to the console:

    new Route().log().inject("Hello world!");
    
It creates a new Route (`new Route()`)
which consists of a single processor (the logging processor, `.log()`)
and injects a new event (`.inject("Hello world!")`.
When the string is injected, a new event is created automatically with the string as body and a generated header.
The route passes this event to the first (and in this example, the only) processor, the logger.
The logger prints the full event, including header and body.

To print out only the body, you can use a simple expression language in the logger:

    new Route().log("${body}").inject("Hello world!");

which prints "Hello world!" or

	new Route().log("This is the body: '${body}'.").inject("Hello world!");
	
which prints "This is the body: 'Hello world!'.".
There are more examples on the [documentation](http://jkanschik.github.com/node-eip/doc/).