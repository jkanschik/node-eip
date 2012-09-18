---
layout: default
title: File handling
---
# File processor

## Introduction

The file processor can be used to read data from files and directories as well as writing events to files.

Examples:

  var r = new Route().readFile().log("File content ${body}.");
  r.inject("/path/to/file.txt");

  var r = new Route().pollDirectory("/path", {frequency: 5}).readFile().log();

## Polling Directories

You can poll on directories using the `.pollDirectory` processor as follows:

  var r = new Route().pollDirectory("/path", {frequency: 5});

The processor emits an event for each file which is found; the body of the event is the filename. The file is not yet opened!

## Reading a file

Files are read using the processor `.readFile`. 
Default: The processor emits the `data` messages of the ReadableStream.
options.encoding = "utf-8": reads the file content using the specified encoding, defaults to "utf-8"
options.combinedContent = true: emits only one single event which contains the full content.

  var r = new Route().readFile({combinedContent: true});
  var r = new Route().readFile().tokenize("\n");

When the file is closed, an empty event (body = {}) is emitted with header `fileClosed` set to `true`.

Headers:
"fileName"
"fileEncoding"
"fileClosed": true if the event indicates that the files has been closed.

## Tokenizer

`.tokenize()`.

If no header is specified for the aggregation, all bodies are merged (and split) with the same `correlationId` or `fileName`.

## To be done

.readFile(): input: file name. Creates a ReadableStream. Problem: the 'data' listener must be set immediately because the file may be opened before the next processor is called.
.tokenize(): input: ReadableStream. output: tokenized string
.stringify():
  input: ReadableStream, ouput: content as string
  input: Object, output: util.stringify(body)


# Implementation notes

## fs.watch

If parameter is a directory, it is called if a file is created / deleted / changed in the directory. No detailled information is given. Multiple events are triggered in case of a file change, which may cause problems.
New files etc. in a subdirectory triggers a change of the directory, but changes in the subdirectory's subdirectory don't trigger an event.

## fs.watchFile
Stats contain no information about what has been changed. Not triggered if a file is added in a subdirectory.

## Camel
Polling: Collect all files recursively, each file is potentially a new event. org.apache.camel.spi.IdempotentRepository stores a list of all files which have been processed before. When a file has been processed correctly, the full path of the file is added to the repository.

## Potential implementation

### Similar to Camel

Regular polling using timer, collect a list of all files recursively. Use a hash similar to an idempotent repository to check whether a file has already been read. The stats of the file could be stored in the hash; this would allow node-eip to trigger an event if the file has been changed (in contrast to Camel, which only recognizes added files).

