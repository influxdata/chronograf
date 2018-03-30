## v0.0.5 [2018-02-09]

### Features

- [#143](https://github.com/influxdata/ifql/issues/143) Add yield function
- [#193](https://github.com/influxdata/ifql/issues/193) Add pipe forward expressions
- [#229](https://github.com/influxdata/ifql/pull/229) Add top/bottom functions
- [#230](https://github.com/influxdata/ifql/pull/230) Add state count and state duration
- [#231](https://github.com/influxdata/ifql/pull/231) Add distinct function
- [#234](https://github.com/influxdata/ifql/pull/234) Add percentile function with exact and approx implementations
- [#243](https://github.com/influxdata/ifql/pull/243) Add support for pushing down group by with aggregates

## v0.0.4 [2018-01-12]

### Features

- [#167](https://github.com/influxdata/ifql/pull/167) Add support for functions in IFQL
- [#171](https://github.com/influxdata/ifql/pull/171) Add initial benchmarks
- [#177](https://github.com/influxdata/ifql/pull/177) Make join function accept map of tables
- [#178](https://github.com/influxdata/ifql/pull/178) Update tracing for parsing/compile steps
- [#179](https://github.com/influxdata/ifql/pull/179) Add "map" function
- [#180](https://github.com/influxdata/ifql/pull/180) Remove "var" keyword
- [#181](https://github.com/influxdata/ifql/pull/181) Add "shift" function, for shifting values in time
- [#182](https://github.com/influxdata/ifql/pull/182) Add suppport for multiple values on table records
- [#183](https://github.com/influxdata/ifql/pull/183) Add derivative function
- [#185](https://github.com/influxdata/ifql/pull/185) Add integral function
- [#186](https://github.com/influxdata/ifql/pull/186) Add difference function
- [#188](https://github.com/influxdata/ifql/pull/188) Add support for default arguments in IFQL functions
- [#189](https://github.com/influxdata/ifql/pull/189) Update filter to be able to push down into multiple filter operations
- [#190](https://github.com/influxdata/ifql/pull/190) Add support for "//" style comments in IFQL

## v0.0.3 [2017-12-08]

### Features

- [#166](https://github.com/influxdata/ifql/issues/166) Initial Resource Management API is in place. Now queries can be submitted with varying priorities and limits on concurrency and memory usage.
- [#164](https://github.com/influxdata/ifql/issues/164) Opentracing support for queries.
- [#139](https://github.com/influxdata/ifql/issues/139) Join is now a global function.
- [#130](https://github.com/influxdata/ifql/issues/130) Add error handling of duplicate arguments to functions.
- [#100](https://github.com/influxdata/ifql/issues/100) Add error handling of unknown arguments to functions.

### Bugfixes

- [#153](https://github.com/influxdata/ifql/issues/153) Fix issues with line protocol output if the _measurement and _field tags were missing.

## v0.0.2 [2017-11-21]

Release after some initial community feedback.

## v0.0.1 [2017-11-13]
Initial release of ifqld

