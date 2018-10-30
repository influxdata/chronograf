// Types
import {FluxToolbarFunction} from 'src/types/flux'

export const functions: FluxToolbarFunction[] = [
  {
    name: 'count()',
    args: [
      {
        name: 'columns',
        desc:
          'A list of columns on which to operate. Defaults to `["_value"]`.',
        type: 'Array of Strings',
      },
    ],
    desc: 'Outputs the number of non-null records in each aggregated column.',
    example: 'count(columns: ["_value"])',
    category: 'Aggregate',
    link: 'http://example.com',
  },
  {
    name: 'covariance()',
    args: [
      {
        name: 'columns',
        desc:
          'A list of columns on which to operate. Exactly two columns must be provided.',
        type: 'Array of Strings',
      },
      {
        name: 'pearsonr',
        desc:
          'Indicates whether the result should be normalized to be the Pearson R coefficient',
        type: 'Boolean',
      },
      {
        name: 'valueDst',
        desc:
          'The column into which the result will be placed. Defaults to `"_value"`.',
        type: 'String',
      },
    ],
    desc: 'Computes the covariance between two columns.',
    example:
      'covariance(columns: ["column_x", "column_y"], pearsonr: false, valueDst: "_value")',
    category: 'Aggregate',
    link: 'http://example.com',
  },
  {
    name: 'cumulativeSum()',
    args: [
      {
        name: 'columns',
        desc:
          'A list of columns on which to operate. Defaults to `["_value"]`.',
        type: 'Array of Strings',
      },
    ],
    desc:
      'Computes a running sum for non-null records in the table. The output table schema will be the same as the input table.',
    example: 'cumulativeSum(columns: ["_value"])',
    category: 'Aggregate',
    link: 'http://example.com',
  },
  {
    name: 'derivative()',
    args: [
      {
        name: 'unit',
        desc: 'The time duration used when creating the derivative.',
        type: 'Duration',
      },
      {
        name: 'nonNegative',
        desc:
          'Indicates if the derivative is allowed to be negative. When set to `true`, if a value is less than the previous value, it is assumed the previous value should have been a zero.',
        type: 'Boolean',
      },
      {
        name: 'columns',
        desc:
          'A list of columns on which to operate. Defaults to `["_value"]`.',
        type: 'Array of Strings',
      },
      {
        name: 'timeSrc',
        desc: 'The column containing time values. Defaults to `"_time"`.',
        type: 'String',
      },
    ],
    desc:
      'Computes the rate of change per unit of time between subsequent non-null records. The output table schema will be the same as the input table.',
    example:
      'derivative(unit: 100ms, nonNegative: false, columns: ["_value"], timeSrc: "_time")',
    category: 'Aggregate',
    link: 'http://example.com',
  },
  {
    name: 'difference()',
    args: [
      {
        name: 'nonNegative',
        desc:
          'Indicates if the derivative is allowed to be negative. When set to `true`, if a value is less than the previous value, it is assumed the previous value should have been a zero.',
        type: 'Boolean',
      },
      {
        name: 'columns',
        desc:
          'A list of columns on which to operate. Defaults to `["_value"]`.',
        type: 'Array of Strings',
      },
    ],
    desc: 'Computes the difference between subsequent non-null records.',
    example: 'difference(nonNegative: false, columns: ["_value"])',
    category: 'Aggregate',
    link: 'http://example.com',
  },
  {
    name: 'distinct()',
    args: [
      {
        name: 'column',
        desc: 'Column on which to track unique values.',
        type: 'String',
      },
    ],
    desc: 'Returns the unique values for a given column.',
    example: 'distinct(column: "host")',
    category: 'Aggregate',
    link: 'http://example.com',
  },
  {
    name: 'drop()',
    args: [
      {
        name: 'columns',
        desc:
          'A list of columns to be removed from the table. Cannot be used with `fn`.',
        type: 'Array of Strings',
      },
      {
        name: 'fn',
        desc:
          'A function which takes a column name as a parameter and returns a boolean indicating whether or not the column should be removed from the table. Cannot be used with `columns`.',
        type: 'Function',
      },
    ],
    desc:
      'Removes specified columns from a table. Columns can be specified either through a list or a predicate function. When a dropped column is part of the group key, it will be removed from the key.',
    example: 'drop(columns: ["col1", "col2"])',
    category: 'Transformation',
    link: 'http://example.com',
  },
  {
    name: 'duplicate()',
    args: [
      {
        name: 'column',
        desc: 'The column name to duplicate.',
        type: 'String',
      },
      {
        name: 'as',
        desc: 'The name assigned to the duplicate column.',
        type: 'String',
      },
    ],
    desc: 'Duplicates a specified column in a table.',
    example: 'duplicate(column: "column-name", as: "duplicate-name")',
    category: 'Transformation',
    link: 'http://example.com',
  },
  {
    name: 'filter()',
    args: [
      {
        name: 'fn',
        desc:
          'A single argument function that evaluates true or false. Records are passed to the function. Those that evaluate to true are included in the output tables.',
        type: 'Function',
      },
    ],
    desc:
      'Filters data based on conditions defined in the function. The output tables have the same schema as the corresponding input tables.',
    example: 'filter(fn: (r) => r._measurement == "cpu")',
    category: 'Filter',
    link: 'http://example.com',
  },
  {
    name: 'first()',
    args: [],
    desc: 'Selects the first non-null record from an input table.',
    example: 'first()',
    category: 'Selector',
    link: 'http://example.com',
  },
  {
    name: 'from()',
    args: [
      {
        name: 'bucket',
        desc: 'The name of the bucket to query.',
        type: 'String',
      },
      {
        name: 'bucketID',
        desc: 'The string-encoded ID of the bucket to query.',
        type: 'String',
      },
    ],
    desc:
      'Used to retrieve data from an InfluxDB data source. It returns a stream of tables from the specified bucket. Each unique series is contained within its own table. Each record in the table represents a single point in the series.',
    example: 'from(bucket: "telegraf/autogen")',
    category: 'Source',
    link: 'http://example.com',
  },
  {
    name: 'fromRows()',
    args: [
      {
        name: 'bucket',
        desc: 'The name of the bucket to query.',
        type: 'String',
      },
      {
        name: 'bucketID',
        desc: 'The string-encoded ID of the bucket to query.',
        type: 'String',
      },
    ],
    desc:
      'This is a special application of the `pivot()` function that will automatically align fields within each measurement that have the same timestamp.',
    example: 'fromRows(bucket: "bucket-name")',
    category: 'Source',
    link: 'http://example.com',
  },
  {
    name: 'group()',
    args: [
      {
        name: 'by',
        desc:
          'List of columns by which to group. Cannot be used with `except`.',
        type: 'Array of Strings',
      },
      {
        name: 'except',
        desc:
          'List of columns by which to NOT group. All other columns are used to group records. Cannot be used with `by`.',
        type: 'Array of Strings',
      },
      {
        name: 'none',
        desc: 'Remove existing groups.',
        type: 'Boolean',
      },
    ],
    desc:
      'Groups records based on their values for specific columns. It produces tables with new group keys based on provided properties.',
    example: 'group(by: ["host", "_measurement"])',
    category: 'Transformation',
    link: 'http://example.com',
  },
  {
    name: 'histogram()',
    args: [
      {
        name: 'column',
        desc:
          'The name of a column containing input data values. The column type must be float. Defaults to `"_value"`.',
        type: 'Strings',
      },
      {
        name: 'upperBoundColumn',
        desc:
          'The name of the column in which to store the histogram\'s upper bounds. Defaults to `"le"`.',
        type: 'String',
      },
      {
        name: 'countColumn',
        desc:
          'The name of the column in which to store the histogram counts. Defaults to `"_value"`.',
        type: 'String',
      },
      {
        name: 'buckets',
        desc:
          'A list of upper bounds to use when computing the histogram frequencies. Buckets should contain a bucket whose bound is the maximum value of the data set. This value can be set to positive infinity if no maximum is known.',
        type: 'Array of Floats',
      },
      {
        name: 'normalize',
        desc:
          'When `true`, will convert the counts into frequency values between 0 and 1. Defaults to `false`.',
        type: 'Boolean',
      },
    ],
    desc:
      'Approximates the cumulative distribution function of a dataset by counting data frequencies for a list of buckets.',
    example:
      'histogram(column: "_value", upperBoundColumn: "le", countColumn: "_value", buckets: [50.0, 75.0, 90.0], normalize: false)',
    category: 'Transformation',
    link: 'http://example.com',
  },
  {
    name: 'histogramQuantile()',
    args: [
      {
        name: 'quantile',
        desc:
          'A value between 0 and 1 indicating the desired quantile to compute.',
        type: 'Float',
      },
      {
        name: 'upperBoundColumn',
        desc:
          'The name of the column in which to store the histogram\'s upper bounds. The count column type must be float. Defaults to `"le"`.',
        type: 'String',
      },
      {
        name: 'countColumn',
        desc:
          'The name of the column in which to store the histogram counts. The count column type must be float. Defaults to `"_value"`.',
        type: 'String',
      },
      {
        name: 'valueColumn',
        desc:
          'The name of the output column which will contain the computed quantile. Defaults to `"_value"`.',
        type: 'String',
      },
      {
        name: 'minValue',
        desc:
          'The assumed minimum value of the dataset. When the quantile falls below the lowest upper bound, interpolation is performed between `minValue` and the lowest upper bound. When `minValue` is equal to negative infinity, the lowest upper bound is used. Defaults to `0`.',
        type: 'Float',
      },
    ],
    desc:
      'Approximates a quantile given a histogram that approximates the cumulative distribution of the dataset.',
    example:
      'histogramQuantile(quantile: 0.5, countColumn: "_value", upperBoundColumn: "le", valueColumn: "_value", minValue: 0)',
    category: 'Transformation',
    link: 'http://example.com',
  },
  {
    name: 'integral()',
    args: [
      {
        name: 'unit',
        desc: 'The time duration used when computing the integral.',
        type: 'Duration',
      },
      {
        name: 'columns',
        desc:
          'A list of columns on which to operate. Defaults to `["_value"]`.',
        type: 'Array of Strings',
      },
    ],
    desc:
      'Computes the area under the curve per unit of time of subsequent non-null records. The curve is defined using `_time` as the domain and record values as the range.',
    example: 'integral(unit: 10s, columns: ["_value"])',
    category: 'Aggregate',
    link: 'http://example.com',
  },
  {
    name: 'intervals()',
    args: [
      {
        name: 'every',
        desc:
          'The duration between starts of each of the intervals. Defaults to the value of the `period` duration.',
        type: 'Duration',
      },
      {
        name: 'period',
        desc:
          'The length of each interval. Defaults to the value of the `every` duration.',
        type: 'Duration',
      },
      {
        name: 'offset',
        desc:
          'The offset duration relative to the location offset. Defaults to `0h`.',
        type: 'Duration',
      },
      {
        name: 'columns',
        desc:
          'A list of columns on which to operate. Defaults to `["_value"]`.',
        type: 'Array of Strings',
      },
      {
        name: 'fn',
        desc:
          'A function that accepts an interval object and returns a boolean value. Each potential interval is passed to the filter function. When the function returns false, that interval is excluded from the set of intervals. Defaults to include all intervals.',
        type: 'Function',
      },
    ],
    desc: 'Generates a set of time intervals over a range of time.',
    example: 'intervals()',
    category: 'Generator',
    link: 'http://example.com',
  },
  {
    name: 'join()',
    args: [
      {
        name: 'tables',
        desc: 'The map of streams to be joined.',
        type: 'Object',
      },
      {
        name: 'on',
        desc: 'The list of columns on which to join.',
        type: 'Array of Strings',
      },
      {
        name: 'method',
        desc:
          'The method used to join. Possible values are: `inner`, `cross`, `left`, `right`, or `full`. Defaults to `"inner"`.',
        type: 'String',
      },
    ],
    desc:
      'Merges two or more input streams, whose values are equal on a set of common columns, into a single output stream. The resulting schema is the union of the input schemas. The resulting group key is the union of the input group keys.',
    example:
      'join(tables: {key1: table1, key2: table2}, on: ["_time", "_field"], method: "inner")',
    category: 'Transformation',
    link: 'http://example.com',
  },
]
