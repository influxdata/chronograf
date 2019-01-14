# Virtual Machine Design

This document details the workings and design of the virtual machine that executes a Flux script.

## Execution Stack

A Flux script goes through several transformations from text to execution.

1. Flux source code is created via any means.
2. The parser produces an abstract syntax tree (AST) from the source code.
3. The semantic analyzer produces a semantic graph from the AST.
4. The compiler accepts the semantic graph and produces an intermediate representation (IR) to be executed.
5. The flux virtual machine executes the IR.

NOTE: Should we call it bytecode or IR?
Should we call it a VM or an interpreter?

## Execution model

Flux has a specific execution model.
The model depends on the definitions of various data types and operations on those types.
The Flux spec defines some of those types.
This document reviews those types as well as defines a few new types that are specific to the implementation.

### Data types and operations

#### Table

A Flux table consists of rows and columns.
Columns have a label and a type.
The table has zero or more rows, where each row defines a value for each column or a null is used to indicate a missing value.

A table additionaly has a group key, which is a list of columns and their values.
All rows within a table have the same value for all columns that are part of the group key.

#### Stream

A stream is an unbounded set of tables.
Each table must have a different group key.

#### Input

An input is a source of a stream.

Inputs are reprented as functions that produce a stream.

#### Output

An output consumes a stream and send the data to an external system.

Output are reprented as functions that consume a stream and produce a stream.
Outputs are transparent proxies, passing their input data downstream unmodified.
As a result outputs themselves have no effect on the Flux program, in other words they only have side effects.

#### Transformation

A transformation is not a data type but rather an operation defined on a stream.
A transformation consumes a stream of tables and produces a new stream of tables.

Transformations may make use of a data cache to allow for multiple edits to a table before materializing the table into the new stream.

Transformations are reprented as functions that consume a stream and produce a stream.

#### Data cache

A data cache is a set of tables that have yet to be materialized.
Tables in a data cache may receive edits.
The cache identifies each table by its group key.

#### Triggers

A trigger indicates that a table in the data cache should be materialized and delivered downstream.

A trigger can fire multiple times until it is finished.
Once a trigger is finished it will never fire again.

A data cache uses triggers to know when it can evit and materialize tables.

Triggers fire based on events.
For example a trigger may fire after receiving an update watermark event.
See the Flux spec for complete details on events available to triggers.

#### Message bus

The message bus is a queue where trigger events and data messages can be placed.
Each transformation has its own message bus.
A transformation consumes messages off its bus and processes them.

### Data flow

With the various data types and operations defined lets be explicit about how data flows through a Flux program.

A Flux program describes a graph through which data flows.
This graph may have complex data dependencies between transformations.
Sources produce an inital stream of tables, each table is placed on the message bus for the downstream transformations of the source.
Each transformation is linked to its downstream transformations via the message bus.
Sources produces trigger events about the stream which are also placed on the message bus.
The trigger events cause tables to be materialized from the data cache, if it exists. 
The materialized tables are placed on the message bus of the downstream transformations.
If a transformation does not need to make edits to a table it does not need to use the data cache but can simply place its generated tables directly on the downstream message bus.

## Compiler

The compiler is responsible for transforming a semantic graph into an IR.
Internally the compiler performs several passes in order to produce optimized IR.

1. Initial Pass - Convert the semantic graph into non-optimized IR.
2. Planner - The planner rewrites the IR to optimize for the structure of the Flux script.
3. Final Pass - The final pass rewrites the IR for any final optimizations that can be performed.


The planner tends to perform more macro optimizations, like merging entire data transformations together.
The final pass tends to perform more micro optimizations, like rewriting a few instructions to allow for better cache locality.

## Intermediate Representation

The Flux IR consists of a set of instructions and arguments to those instructions.
The IR is a high level IR, specifically instructions are not required to directly map to hardware operations.

The data types the IR can describe are also high level.
For example an instruction may take an entire table as its input argument.

The IR describes the both the control flow and the data dependencies between function calls.
The IR is represented as imperative code.
As such data dependencies are encoded in the order of the instructions and control flow is encoded through condition jumps to different sections of code.

Here are a few examples of the IR instructions:

* AddInt - Add two integers
* Stddev - Compute the stddev of a table of data
* Join - Joins N streams of tables

The IR is not a language to describe how to process the data with tables.
In other words the IR is not used to describe the implementation of the transformations themselves rather it is used to describe the data flow between transformations.
The implementations of the transformations is left to the virtual machine runtime.


### Instructions

The IR will consist of the following instructions organized by their semantics.
Sets of instructions are organized into blocks.
A basic block represents a series of instructions that are executed in order.

Certain instructions can jump between different blocks creating a larger program.

### Control flow

These instructions control the flow of the program between blocks.

| Instruction | Description                                           |
| ----------- | -----------                                           |
| Branch      | Conditionaly jump to a new block                      |
| Call        | Jump to a function block with the provided parameters |
| Retrun      | Return a value to the calling block                   |

### Binary operations

These instructions all take two operands.

| Instruction | Description                                        |
| ----------- | -----------                                        |
| Add         | Perform addition between the two operands          |
| Sub         | Perform subtraction between the two operands       |
| Mul         | Perform multiplication between the two operands    |
| Div         | Perform division between the two operands          |
| And         | Perform a logical "and" between two operands       |
| Or          | Perform a logical "and" between two operands       |
| Eq          | Perform an equality check between the two operands |

There are many more of these which are left out for now until we write up a complete IR.

### Message bus

These instructions interact with a message bus.

| Instruction | Description                                                |
| ----------- | -----------                                                |
| MsgSend     | Send a message into the bus                                |
| MsgRecv     | Recieve a message from the bus                             |
| MsgRange     | Call function for each message on the bus |

### Coroutine

These instructions create new corotinues

| Instruction | Description            |
| ----------- | -----------            |
| Spawn       | Create a new coroutine |


## Virtual Machine

The virtual machine will consume a list of IR instructions and execute them.
Many instructions will call out to the Flux runtime.

### Runtime

The Flux runtime provides the heavy data processing for the virtual machine.

The following operations will be implemented in the runtime.

* Transformations
* Data cache
* Message bus

### Concurrency

The virtual machine will support some form of concurrency likely in the form of coorperative coroutines.

## Debugger

Flux will provide a debugger to allow a user to step through their Flux source code.
The compiler can be instructed to generate debug IR.
This IR will allow a debugger to step through the function calls of a Flux program and inspect the data being passed.
Since the IR describes data flow and conditional logic it is the correct abstract to debug a Flux program since the details of how a transformation is implemented should not be the concern of a user.
Large amounts of data can be passed between functions, the debugger will expose ways to page through the data in a streaming manner.



## Example

Given the following Flux script, this set of instructions would be produced.

    from(bucket:"telegraf/autogen")
        |> range(start:-1m)
        |> filter(fn:(r) => r._measurement == "cpu" and r._field == "usage_idle")
        |> mean()

Assuming that no optmizations are performed the IR would like this (using a psuedo language):


    main:
        fromMB   = $0 # first arg to main is the message bus produced by the `from` source.
        rangeMB  = Spawn rangeLoop fromMB
        filterMB = Spawn filterLoop rangeMB
        meanMB   = Spawn meanLoop filterMB
        Return meanMB


    rangeLoop: # Range function that consumes a message bus and produces a message bus
        mbr = MsgRange $0 range # Call out to the intrinsic "range" function for each table on the message bus
        Return mbr

    filterLoop: # Filter function that consumes a message bus and produces a message bus
        mbr = MsgRange $0 filter predicate # Call out to the intrinsic "range" function for each table on the message bus
        Return mbr

    predicate: # Predicate function passed to the filter function
        row  = $0
        tmp0 = Eq row._measurement "cpu" # handwaving how object property access happens
        tmp1 = Eq row._field "usage_idle" # handwaving how object property access happens
        tmp2 = And tmp0 tmp1
        Return tmp2

    meanLoop:
        mbr = MsgRange $0 mean # Call out to intrinsic "mean" function for each table on the message bus
        Return mbr


A lot of details are glossed over but this is a start to make things more concrete.
There is no mention of data cache in this example.
In a real IR instead of hand waving the message busses there would be explicit calls to data cache operations and message bus Send,  Recv operations.
Since the IR directly controls how data flows between different transformations, the planner can optimize this, removing extra calls to data caches etc when they are not needed.

We can also incrementally extend this IR deeper into the data processing as needed.
For example, we could have instructions for iterating through streams, tables and rows.
Then the filter function would not need to be an intrinsic but could be represented in vanilla IR with a jump to the predicate function.
Map could do something similar.

