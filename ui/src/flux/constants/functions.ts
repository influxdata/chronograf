import {FluxToolbarFunction} from 'src/types/flux'

export const FROM: FluxToolbarFunction = {
  name: 'from',
  args: [
    {
      name: 'bucket',
      desc: 'Name of the bucket to query.',
      type: 'String',
    },
    {
      name: 'bucketID',
      desc: 'String-encoded bucket ID to query.',
      type: 'String',
    },
    {
      name: 'host',
      desc: 'URL of the InfluxDB instance to query.',
      type: 'String',
    },
    {
      name: 'org',
      desc: 'Organization name.',
      type: 'String',
    },
    {
      name: 'orgID',
      desc: 'String-encoded organization ID to query.',
      type: 'String',
    },
    {
      name: 'token',
      desc: 'InfluxDB API token.',
      type: 'String',
    },
  ],
  package: '',
  desc: 'Queries data from an InfluxDB data source.',
  example: 'from(bucket: "example-bucket")',
  category: 'Inputs',
  link: 'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/from/',
}

export const RANGE: FluxToolbarFunction = {
  name: 'range',
  args: [
    {
      name: 'start',
      desc: 'Earliest time to include in results.',
      type: 'Duration | Time',
    },
    {
      name: 'stop',
      desc: 'Latest time to include in results. Default is `now()`.',
      type: 'Duration | Time',
    },
  ],
  package: '',
  desc: 'Filters rows based on time bounds.',
  example: 'from(bucket: "example-bucket")\n    |> range(start: -12h)',
  category: 'Transformations',
  link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/range/',
}

export const MEAN: FluxToolbarFunction = {
  name: 'mean',
  args: [
    {
      name: 'column',
      desc: 'Column to use to compute means. Default is `_value`.',
      type: 'String',
    },
  ],
  package: '',
  desc:
    'Returns the average of non-null values in a specified column from each input table.',
  example: 'import "sampledata"\n\nsampledata.int()\n    |> mean()',
  category: 'Aggregates',
  link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/mean/',
}

export const UNION: FluxToolbarFunction = {
  name: 'union',
  args: [
    {
      name: 'tables',
      desc: 'List of two or more streams of tables to union together.',
      type: 'Array of Strings',
    },
  ],
  package: '',
  desc: 'Merges two or more input streams into a single output stream.',
  example: '// setup and processing omitted\n\nunion(tables: [t1, t2])',
  category: 'Transformations',
  link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/union/',
}

export const MATH_ABS: FluxToolbarFunction = {
  name: 'math.abs',
  args: [
    {
      name: 'x',
      desc: 'Value to operate on.',
      type: 'Float',
    },
  ],
  package: 'math',
  desc: 'Returns the absolute value of `x`.',
  example: 'import "math"\n\nmath.abs(x: -1.22)',
  category: 'Transformations',
  link: 'https://docs.influxdata.com/flux/v0/stdlib/math/abs/',
}

export const MATH_FLOOR: FluxToolbarFunction = {
  name: 'math.floor',
  args: [
    {
      name: 'x',
      desc: 'Value to operate on.',
      type: 'Float',
    },
  ],
  package: 'math',
  desc: 'Returns the greatest integer value less than or equal to `x`.',
  example: 'import "math"\n\nmath.floor(x: 1.22)',
  category: 'Transformations',
  link: 'https://docs.influxdata.com/flux/v0/stdlib/math/floor/',
}

export const STRINGS_TITLE: FluxToolbarFunction = {
  name: 'strings.title',
  args: [
    {
      name: 'v',
      desc: 'String value to convert.',
      type: 'String',
    },
  ],
  package: 'strings',
  desc: 'Converts a string to title case.',
  example:
    'import "sampledata"\nimport "strings"\n\nsampledata.string()\n    |> map(fn: (r) => ({r with _value: strings.title(v: r._value)}))',
  category: 'Transformations',
  link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/title/',
}

export const STRINGS_TRIM: FluxToolbarFunction = {
  name: 'strings.trim',
  args: [
    {
      name: 'v',
      desc: 'String to remove characters from.',
      type: 'String',
    },
    {
      name: 'cutset',
      desc: 'Leading and trailing characters to remove from the string.',
      type: 'String',
    },
  ],
  package: 'strings',
  desc:
    'Removes leading and trailing characters specified in the cutset from a string.',
  example:
    'import "strings"\n\ndata\n    |> map(fn: (r) => ({r with _value: strings.trim(v: r._value, cutset: "smpl_")}))',
  category: 'Transformations',
  link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/trim/',
}

export const FUNCTIONS: FluxToolbarFunction[] = [
  {
    name: 'aggregate.rate',
    args: [
      {
        name: 'every',
        desc: 'Duration of time windows.',
        type: 'Duration',
      },
      {
        name: 'groupColumns',
        desc: 'List of columns to group by. Default is `[]`.',
        type: 'Array of Strings',
      },
      {
        name: 'unit',
        desc:
          'Time duration to use when calculating the rate. Default is `1s`.',
        type: 'Array of Strings',
      },
    ],
    package: 'experimental/aggregate',
    desc:
      'Calculates the average rate of increase per window of time for each input table.',
    example:
      'import "experimental/aggregate"\nimport "sampledata"\n\ndata =\n    sampledata.int()\n        |> range(start: sampledata.start, stop: sampledata.stop)\n\ndata\n    |> aggregate.rate(every: 30s, unit: 1s, groupColumns: ["tag"])',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/aggregate/rate/',
  },
  {
    name: 'aggregateWindow',
    args: [
      {
        name: 'every',
        desc: 'Duration of time between windows.',
        type: 'Duration',
      },
      {
        name: 'period',
        desc: 'Duration of windows. Default is the `every` value.',
        type: 'Duration',
      },
      {
        name: 'offset',
        desc: 'Duration to shift the window boundaries by. Default is `0s`.',
        type: 'Duration',
      },
      {
        name: 'fn',
        desc: 'Aggregate or selector function to apply to each time window.',
        type: 'Unquoted String',
      },
      {
        name: 'location',
        desc:
          'Location used to determine timezone. Default is the `location` option.',
        type: 'Object',
      },
      {
        name: 'column',
        desc: 'Column to operate on.',
        type: 'String',
      },
      {
        name: 'timeSrc',
        desc:
          'Column to use as the source of the new time value for aggregate values.',
        type: 'String',
      },
      {
        name: 'timeDst',
        desc: 'Column to store time values for aggregate values in.',
        type: 'String',
      },
      {
        name: 'createEmpty',
        desc: 'Create empty tables for empty window. Default is `true`.',
        type: 'Boolean',
      },
    ],
    package: '',
    desc:
      'Downsamples data by grouping data into fixed windows of time and applying an aggregate or selector function to each window.',
    example: 'data\n    |> aggregateWindow(every: 20s, fn: mean)',
    category: 'Aggregates',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/universe/aggregatewindow/',
  },
  {
    name: 'bigtable.from',
    args: [
      {
        name: 'token',
        desc:
          'Google Cloud IAM token to use to access the Cloud Bigtable database.',
        type: 'String',
      },
      {
        name: 'project',
        desc: 'Cloud Bigtable project ID.',
        type: 'String',
      },
      {
        name: 'instance',
        desc: 'Cloud Bigtable instance ID.',
        type: 'String',
      },
      {
        name: 'table',
        desc: 'Cloud Bigtable table name.',
        type: 'String',
      },
    ],
    package: 'experimental/bigtable',
    desc:
      'Retrieves data from a Google Cloud Bigtable (https://cloud.google.com/bigtable/) data source.',
    example:
      'import "experimental/bigtable"\n\nbigtable.from(\n    token: "example-token",\n    project: "example-project",\n    instance: "example-instance",\n    table: "example-table",\n)',
    category: 'Inputs',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/bigtable/from/',
  },
  {
    name: 'bool',
    args: [
      {
        name: 'v',
        desc: 'Value to convert.',
        type: 'String, Integer, UInteger, Float',
      },
    ],
    package: '',
    desc: 'Converts a value to a boolean type.',
    example: 'bool(v: "true")\n\nbool(v: "false")',
    category: 'Type Conversions',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/bool/',
  },
  {
    name: 'bottom',
    args: [
      {
        name: 'n',
        desc: 'Number of rows to return from each input table.',
        type: 'Integer',
      },
      {
        name: 'columns',
        desc: 'List of columns to sort by. Default is `["_value"]`.',
        type: 'Array of Strings',
      },
    ],
    package: '',
    desc:
      'Sorts each input table by specified columns and keeps the bottom `n` records in each table.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> bottom(n: 2)',
    category: 'Selectors',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/bottom/',
  },
  {
    name: 'bytes',
    args: [
      {
        name: 'v',
        desc: 'Value to convert.',
        type: 'String, Integer, UInteger, Float, Boolean',
      },
    ],
    package: '',
    desc: 'Converts a string value to a bytes type.',
    example: 'bytes(v: "Example string")',
    category: 'Type Conversions',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/bytes/',
  },
  {
    name: 'chandeMomentumOscillator',
    args: [
      {
        name: 'n',
        desc: 'Period or number of points to use in the calculation.',
        type: 'Integer',
      },
      {
        name: 'columns',
        desc: 'List of columns to operate on. Default is `["_value"]`.',
        type: 'Array of Strings`',
      },
    ],
    package: '',
    desc:
      'Applies the technical momentum indicator developed by Tushar Chande to input data.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> chandeMomentumOscillator(n: 2)',
    category: 'Aggregates',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/universe/chandemomentumoscillator/',
  },
  {
    name: 'columns',
    args: [
      {
        name: 'column',
        desc: 'Name of the output column to store column labels in.',
        type: 'String',
      },
    ],
    package: '',
    desc: 'Returns the column labels in each input table.',
    example:
      'import "sampledata"\n\nsampledata.string()\n    |> columns(column: "labels")',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/columns/',
  },
  {
    name: 'contains',
    args: [
      {
        name: 'value',
        desc: 'Value to search for.',
        type: 'Boolean, Integer, UInteger, Float, String, Time',
      },
      {
        name: 'set',
        desc: 'Array to search.',
        type: 'Boolean, Integer, UInteger, Float, String, Time',
      },
    ],
    package: '',
    desc:
      'Tests if an array contains a specified value and returns `true` or `false`.',
    example:
      'fields = ["f1", "f2"]\n\ndata\n    |> filter(fn: (r) => contains(value: r._field, set: fields))',
    category: 'Tests',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/contains/',
  },
  {
    name: 'count',
    args: [
      {
        name: 'column',
        desc: 'Column to count values in and store the total count.',
        type: 'String',
      },
    ],
    package: '',
    desc: 'Returns the number of records in each input table.',
    example: 'import "sampledata"\n\nsampledata.string()\n    |> count()',
    category: 'Aggregates',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/count/',
  },
  {
    name: 'cov',
    args: [
      {
        name: 'x',
        desc: 'First input stream.',
        type: 'Object',
      },
      {
        name: 'y',
        desc: 'Second input stream.',
        type: 'Object',
      },
      {
        name: 'on',
        desc: 'List of columns to join on.',
        type: 'Array of Strings',
      },
      {
        name: 'pearsonr',
        desc:
          'Normalize results to the Pearson R coefficient. Default is `false`.',
        type: 'Boolean',
      },
    ],
    package: '',
    desc: 'Computes the covariance between two streams of tables.',
    example:
      '// setup and processing omitted\n\ncov(x: stream1, y: stream2, on: ["_time"])',
    category: 'Aggregates',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/cov/',
  },
  {
    name: 'covariance',
    args: [
      {
        name: 'columns',
        desc: 'List of two columns to operate on.',
        type: 'Array of Strings',
      },
      {
        name: 'pearsonr',
        desc:
          'Normalize results to the Pearson R coefficient. Default is `false`.',
        type: 'Boolean',
      },
      {
        name: 'valueDst',
        desc: 'Column to store the result in. Default is `_value`.',
        type: 'String',
      },
    ],
    package: '',
    desc: 'Computes the covariance between two columns.',
    example: 'data\n    |> covariance(columns: ["x", "y"])',
    category: 'Aggregates',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/covariance/',
  },
  {
    name: 'csv.from (file)',
    args: [
      {
        name: 'file',
        desc: 'File path of the CSV file to query.',
        type: 'String',
      },
    ],
    package: 'csv',
    desc:
      'Retrieves data from a comma separated value (CSV) data source and returns a stream of tables.',
    example: 'csv.from(file: path)',
    category: 'Inputs',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/csv/from/',
  },
  {
    name: 'csv.from (csvData)',
    args: [
      {
        name: 'csv',
        desc: 'CSV data.',
        type: 'String',
      },
    ],
    package: 'csv',
    desc:
      'Retrieves data from a comma separated value (CSV) data source and returns a stream of tables.',
    example: 'csv.from(csv: csvData)',
    category: 'Inputs',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/csv/from/',
  },
  {
    name: 'csv.from (url)',
    args: [
      {
        name: 'url',
        desc: 'URL to retrieve annotated CSV from.',
        type: 'String',
      },
    ],
    package: 'experimental/csv',
    desc:
      'Retrieves annotated CSV (/influxdb/v2/reference/syntax/annotated-csv/) **from a URL**.',
    example: 'csv.from(url: "http://example.com/data.csv")',
    category: 'Inputs',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/csv/from/',
  },
  {
    name: 'cumulativeSum',
    args: [
      {
        name: 'columns',
        desc: 'List of columns to operate on. Default is `["_value"]`.',
        type: 'Array of Strings',
      },
    ],
    package: '',
    desc: 'Computes a running sum for non-null records in a table.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> cumulativeSum()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/cumulativesum/',
  },
  {
    name: 'date.hour',
    args: [
      {
        name: 't',
        desc: 'Time to operate on.',
        type: 'Time',
      },
      {
        name: 'location',
        desc: 'Location used to determine timezone.',
        type: 'Object',
      },
    ],
    package: 'date',
    desc:
      'Returns the hour of a specified time. Results range from `[0 - 23]`.',
    example: 'import "date"\n\ndate.hour(t: 2020-02-11T12:21:03.29353494Z)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/date/hour/',
  },
  {
    name: 'date.microsecond',
    args: [
      {
        name: 't',
        desc: 'Time to operate on.',
        type: 'Time',
      },
    ],
    package: 'date',
    desc:
      'Returns the microseconds for a specified time. Results range `from [0-999999]`.',
    example:
      'import "date"\n\ndate.microsecond(t: 2020-02-11T12:21:03.29353494Z)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/date/microsecond/',
  },
  {
    name: 'date.millisecond',
    args: [
      {
        name: 't',
        desc: 'Time to operate on.',
        type: 'Time',
      },
    ],
    package: 'date',
    desc:
      'Returns the milliseconds for a specified time. Results range from `[0-999]`.',
    example:
      'import "date"\n\ndate.millisecond(t: 2020-02-11T12:21:03.29353494Z)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/date/millisecond/',
  },
  {
    name: 'date.minute',
    args: [
      {
        name: 't',
        desc: 'Time to operate on.',
        type: 'Time',
      },
      {
        name: 'location',
        desc: 'Location used to determine timezone.',
        type: 'Object',
      },
    ],
    package: 'date',
    desc:
      'Returns the minute of a specified time. Results range from `[0 - 59]`.',
    example: 'import "date"\n\ndate.minute(t: 2020-02-11T12:21:03.29353494Z)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/date/minute/',
  },
  {
    name: 'date.month',
    args: [
      {
        name: 't',
        desc: 'Time to operate on.',
        type: 'Time',
      },
      {
        name: 'location',
        desc: 'Location used to determine timezone.',
        type: 'Object',
      },
    ],
    package: 'date',
    desc:
      'Returns the month of a specified time. Results range from `[1 - 12]`.',
    example: 'import "date"\n\ndate.month(t: 2020-02-11T12:21:03.29353494Z)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/date/month/',
  },
  {
    name: 'date.monthDay',
    args: [
      {
        name: 't',
        desc: 'Time to operate on.',
        type: 'Time',
      },
      {
        name: 'location',
        desc: 'Location used to determine timezone.',
        type: 'Object',
      },
    ],
    package: 'date',
    desc:
      'Returns the day of the month for a specified time. Results range from `[1 - 31]`.',
    example: 'import "date"\n\ndate.monthDay(t: 2020-02-11T12:21:03.29353494Z)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/date/monthday/',
  },
  {
    name: 'date.nanosecond',
    args: [
      {
        name: 't',
        desc: 'Time to operate on.',
        type: 'Time',
      },
    ],
    package: 'date',
    desc:
      'Returns the nanoseconds for a specified time. Results range from `[0-999999999]`.',
    example:
      'import "date"\n\ndate.nanosecond(t: 2020-02-11T12:21:03.29353494Z)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/date/nanosecond/',
  },
  {
    name: 'date.quarter',
    args: [
      {
        name: 't',
        desc: 'Time to operate on.',
        type: 'Time',
      },
      {
        name: 'location',
        desc: 'Location used to determine timezone.',
        type: 'Object',
      },
    ],
    package: 'date',
    desc:
      'Returns the quarter for a specified time. Results range from `[1-4]`.',
    example: 'import "date"\n\ndate.quarter(t: 2020-02-11T12:21:03.29353494Z)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/date/quarter/',
  },
  {
    name: 'date.second',
    args: [
      {
        name: 't',
        desc: 'Time to operate on.',
        type: 'Time',
      },
    ],
    package: 'date',
    desc:
      'Returns the second of a specified time. Results range from `[0 - 59]`.',
    example: 'import "date"\n\ndate.second(t: 2020-02-11T12:21:03.29353494Z)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/date/second/',
  },
  {
    name: 'date.truncate',
    args: [
      {
        name: 't',
        desc: 'Time to operate on.',
        type: 'Time',
      },
      {
        name: 'unit',
        desc: 'Unit of time to truncate to.',
        type: 'Duration',
      },
      {
        name: 'location',
        desc: 'Location used to determine timezone.',
        type: 'Object',
      },
    ],
    package: 'date',
    desc: 'Returns a time truncated to the specified duration unit.',
    example:
      'import "date"\nimport "timezone"\n\noption location = timezone.location(name: "Europe/Madrid")\n\ndate.truncate(t: 2019-06-03T13:59:01Z, unit: 1s)\n\ndate.truncate(t: 2019-06-03T13:59:01Z, unit: 1m)\n\ndate.truncate(t: 2019-06-03T13:59:01Z, unit: 1h)\n\ndate.truncate(t: 2019-06-03T13:59:01Z, unit: 1d)\n\ndate.truncate(t: 2019-06-03T13:59:01Z, unit: 1mo)\n\ndate.truncate(t: 2019-06-03T13:59:01Z, unit: 1y)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/date/truncate/',
  },
  {
    name: 'date.week',
    args: [
      {
        name: 't',
        desc: 'Time to operate on.',
        type: 'Time',
      },
      {
        name: 'location',
        desc: 'Location used to determine timezone.',
        type: 'Object',
      },
    ],
    package: 'date',
    desc:
      'Returns the ISO week of the year for a specified time. Results range from `[1 - 53]`.',
    example: 'import "date"\n\ndate.week(t: 2020-02-11T12:21:03.29353494Z)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/date/week/',
  },
  {
    name: 'date.weekDay',
    args: [
      {
        name: 't',
        desc: 'Time to operate on.',
        type: 'Time',
      },
      {
        name: 'location',
        desc: 'Location used to determine timezone.',
        type: 'Object',
      },
    ],
    package: 'date',
    desc:
      'Returns the day of the week for a specified time. Results range from `[0 - 6]`.',
    example: 'import "date"\n\ndate.weekDay(t: 2020-02-11T12:21:03.29353494Z)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/date/weekday/',
  },
  {
    name: 'date.year',
    args: [
      {
        name: 't',
        desc: 'Time to operate on.',
        type: 'Time',
      },
      {
        name: 'location',
        desc: 'Location used to determine timezone.',
        type: 'Object',
      },
    ],
    package: 'date',
    desc: 'Returns the year of a specified time.',
    example: 'import "date"\n\ndate.year(t: 2020-02-11T12:21:03.29353494Z)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/date/year/',
  },
  {
    name: 'date.yearDay',
    args: [
      {
        name: 't',
        desc: 'Time to operate on.',
        type: 'Time',
      },
      {
        name: 'location',
        desc: 'Location used to determine timezone.',
        type: 'Object',
      },
    ],
    package: 'date',
    desc:
      'Returns the day of the year for a specified time. Results can include leap days and range from `[1 - 366]`.',
    example: 'import "date"\n\ndate.yearDay(t: 2020-02-11T12:21:03.29353494Z)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/date/yearday/',
  },
  {
    name: 'derivative',
    args: [
      {
        name: 'unit',
        desc:
          'Time duration used to calculate the derivative. Default is `1s`.',
        type: 'Duration',
      },
      {
        name: 'nonNegative',
        desc: 'Disallow negative derivative values. Default is `false`.',
        type: 'Boolean',
      },
      {
        name: 'columns',
        desc: 'List of columns to operate on. Default is `["_value"]`.',
        type: 'Array of Strings',
      },
      {
        name: 'timeColumn',
        desc: 'Column containing time values to use in the calculation.',
        type: 'String',
      },
      {
        name: 'initialZero',
        desc: 'Use zero (0) as the initial value in the derivative calculation',
        type: 'Boolean',
      },
    ],
    package: '',
    desc:
      'Computes the rate of change per unit of time between subsequent non-null records.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> derivative(nonNegative: true)',
    category: 'Aggregates',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/derivative/',
  },
  {
    name: 'difference',
    args: [
      {
        name: 'nonNegative',
        desc: 'Disallow negative differences. Default is `false`.',
        type: 'Boolean',
      },
      {
        name: 'columns',
        desc: 'List of columns to operate on. Default is `["_value"]`.',
        type: 'Array of Strings',
      },
      {
        name: 'keepFirst',
        desc: 'Keep the first row in each input table. Default is `false`.',
        type: 'Boolean',
      },
      {
        name: 'initialZero',
        desc: 'Use zero (0) as the initial value in the difference calculation',
        type: 'Boolean',
      },
    ],
    package: '',
    desc: 'Returns the difference between subsequent values.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> difference()',
    category: 'Aggregates',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/difference/',
  },
  {
    name: 'distinct',
    args: [
      {
        name: 'column',
        desc: 'Column to return unique values from. Default is `_value`.',
        type: 'String',
      },
    ],
    package: '',
    desc: 'Returns all unique values in a specified column.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> distinct()',
    category: 'Selectors',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/distinct/',
  },
  {
    name: 'doubleEMA',
    args: [
      {
        name: 'n',
        desc: 'Number of points to average.',
        type: 'Integer',
      },
    ],
    package: '',
    desc:
      'Returns the double exponential moving average (DEMA) of values in the `_value` column grouped into `n` number of points, giving more weight to recent data.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> doubleEMA(n: 3)',
    category: 'Aggregates',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/doubleema/',
  },
  {
    name: 'drop',
    args: [
      {
        name: 'columns',
        desc:
          'List of columns to remove from input tables. Mutually exclusive with `fn`.',
        type: 'Array of Strings',
      },
      {
        name: 'fn',
        desc:
          'Predicate function with a `column` parameter that returns a boolean',
        type: 'Function',
      },
    ],
    package: '',
    desc: 'Removes specified columns from a table.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> drop(columns: ["_time", "tag"])',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/drop/',
  },
  {
    name: 'duplicate',
    args: [
      {
        name: 'column',
        desc: 'Column to duplicate.',
        type: 'String',
      },
      {
        name: 'as',
        desc: 'Name to assign to the duplicate column.',
        type: 'String',
      },
    ],
    package: '',
    desc: 'Duplicates a specified column in a table.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> duplicate(column: "tag", as: "tag_dup")',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/duplicate/',
  },
  {
    name: 'duration',
    args: [
      {
        name: 'v',
        desc: 'Value to convert.',
        type: 'String',
      },
    ],
    package: '',
    desc: 'Converts a value to a duration type.',
    example: 'duration(v: "1h20m")',
    category: 'Type Conversions',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/duration/',
  },
  {
    name: 'experimental.addDuration',
    args: [
      {
        name: 'd',
        desc: 'Duration to add.',
        type: 'Duration',
      },
      {
        name: 'to',
        desc: 'Time to add the duration to.',
        type: 'Time',
      },
      {
        name: 'location',
        desc: 'Location to use for the time value.',
        type: 'Object',
      },
    ],
    package: 'experimental',
    desc:
      'Adds a duration to a time value and returns the resulting time value.',
    example:
      'import "experimental"\n\nexperimental.addDuration(d: 6h, to: 2019-09-16T12:00:00Z)',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/addduration/',
  },
  {
    name: 'experimental.group',
    args: [
      {
        name: 'columns',
        desc:
          'List of columns to use in the grouping operation. Default is `[]`.',
        type: 'Array of Strings',
      },
      {
        name: 'mode',
        desc:
          'Grouping mode. `extend` is the only mode available to `experimental.group()`.',
        type: 'String',
      },
    ],
    package: 'experimental',
    desc: 'Introduces an `extend` mode to the existing `group()` function.',
    example:
      'import "experimental"\n\ndata\n    |> experimental.group(columns: ["region"], mode: "extend")',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/group/',
  },
  {
    name: 'experimental.join',
    args: [
      {
        name: 'left',
        desc: 'First of two streams of tables to join.',
        type: 'Stream of tables',
      },
      {
        name: 'right',
        desc: 'Second of two streams of tables to join.',
        type: 'Stream of tables',
      },
      {
        name: 'fn',
        desc:
          'Function with left and right arguments that maps a new output record',
        type: 'Function',
      },
    ],
    package: 'experimental',
    desc:
      'Joins two streams of tables on the **group key and `_time` column**.',
    example:
      'import "experimental"\n\n// setup and processing omitted\n\nexperimental.join(\n    left: left,\n    right: right,\n    fn: (left, right) =>\n        ({left with lv: left._value, rv: right._value, diff: left._value - right._value}),\n)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/join/',
  },
  {
    name: 'experimental.objectKeys',
    args: [
      {
        name: 'o',
        desc: 'Record to return property keys from.',
        type: 'Object',
      },
    ],
    package: 'experimental',
    desc: 'Returns an array of property keys in a specified record.',
    example:
      'import "experimental"\n\nuser = {firstName: "John", lastName: "Doe", age: 42}\n\nexperimental.objectKeys(o: user)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/objectkeys/',
  },
  {
    name: 'experimental.set',
    args: [
      {
        name: 'o',
        desc: 'Record that defines the columns and values to set.',
        type: 'Object',
      },
    ],
    package: 'experimental',
    desc: 'Sets multiple static column values on all records.',
    example:
      'import "experimental"\n\ndata\n    |> experimental.set(o: {_field: "temperature", unit: "°F", location: "San Francisco"})',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/set/',
  },
  {
    name: 'experimental.subDuration',
    args: [
      {
        name: 'from',
        desc: 'Time to subtract the duration from.',
        type: 'Time',
      },
      {
        name: 'd',
        desc: 'Duration to subtract.',
        type: 'Duration',
      },
      {
        name: 'location',
        desc: 'Location to use for the time value.',
        type: 'Object',
      },
    ],
    package: 'experimental',
    desc:
      'Subtracts a duration from a time value and returns the resulting time value.',
    example:
      'import "experimental"\n\nexperimental.subDuration(from: 2019-09-16T12:00:00Z, d: 6h)',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/subduration/',
  },
  {
    name: 'experimental.to',
    args: [
      {
        name: 'bucket',
        desc: 'Name of the bucket to write to.',
        type: 'String',
      },
      {
        name: 'bucketID',
        desc: 'String-encoded bucket ID to to write to.',
        type: 'String',
      },
      {
        name: 'host',
        desc: 'URL of the InfluxDB instance to write to.',
        type: 'String',
      },
      {
        name: 'org',
        desc: 'Organization name.',
        type: 'String',
      },
      {
        name: 'orgID',
        desc: 'String-encoded organization ID to query.',
        type: 'String',
      },
      {
        name: 'token',
        desc: 'InfluxDB API token.',
        type: 'String',
      },
    ],
    package: 'experimental',
    desc: 'Writes _pivoted_ data to an InfluxDB 2.x or InfluxDB Cloud bucket.',
    example:
      'import "experimental"\n\nfrom(bucket: "example-bucket")\n    |> range(start: -1h)\n    |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")\n    |> experimental.to(bucket: "example-target-bucket")',
    category: 'Outputs',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/to/',
  },
  {
    name: 'elapsed',
    args: [
      {
        name: 'unit',
        desc: 'Unit of time used in the calculation. Default is `1s`.',
        type: 'Duration',
      },
      {
        name: 'timeColumn',
        desc: 'Column to use to compute the elapsed time. Default is `_time`.',
        type: 'String`',
      },
      {
        name: 'columnName',
        desc: 'Column to store elapsed times in. Default is `elapsed`.',
        type: 'String',
      },
    ],
    package: '',
    desc: 'Returns the time between subsequent records.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> elapsed(unit: 1s)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/elapsed/',
  },
  {
    name: 'exponentialMovingAverage',
    args: [
      {
        name: 'n',
        desc: 'Number of values to average.',
        type: 'Integer',
      },
    ],
    package: '',
    desc:
      'Calculates the exponential moving average of `n` number of values in the `_value` column giving more weight to more recent data.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> exponentialMovingAverage(n: 3)',
    category: 'Aggregates',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/universe/exponentialmovingaverage/',
  },
  {
    name: 'fill',
    args: [
      {
        name: 'column',
        desc: 'Column to replace null values in. Default is `_value`.',
        type: 'String',
      },
      {
        name: 'value',
        desc: 'Constant value to replace null values with.',
        type: 'Value type of `column`',
      },
      {
        name: 'usePrevious',
        desc: 'Replace null values with the previous non-null value.',
        type: 'Boolean',
      },
    ],
    package: '',
    desc: 'Replaces all null values in input tables with a non-null value.',
    example:
      'import "sampledata"\n\nsampledata.int(includeNull: true)\n    |> fill(value: 0)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/fill/',
  },
  {
    name: 'filter',
    args: [
      {
        name: 'fn',
        desc:
          'Single argument predicate function that evaluates `true` or `false`.',
        type: 'Function',
      },
      {
        name: 'onEmpty',
        desc: 'Action to take with empty tables. Default is `drop`.',
        type: 'String',
      },
    ],
    package: '',
    desc:
      'Filters data based on conditions defined in a predicate function (`fn`).',
    example:
      'from(bucket: "example-bucket")\n    |> range(start: -1h)\n    |> filter(\n        fn: (r) => r._measurement == "cpu" and r._field == "usage_system" and r.cpu == "cpu-total",\n    )',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/filter/',
  },
  {
    name: 'first',
    args: [
      {
        name: 'column',
        desc: 'Column to operate on. Default is `_value`.',
        type: 'String',
      },
    ],
    package: '',
    desc: 'Returns the first non-null record from each input table.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> first()',
    category: 'Selectors',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/first/',
  },
  {
    name: 'float',
    args: [
      {
        name: 'v',
        desc: 'Value to convert.',
        type: 'String, Integer, UInteger, Boolean',
      },
    ],
    package: '',
    desc: 'Converts a value to a float type.',
    example: 'float(v: "3.14")',
    category: 'Type Conversions',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/float/',
  },
  {
    name: 'from',
    args: [
      {
        name: 'bucket',
        desc: 'Name of the bucket to query.',
        type: 'String',
      },
      {
        name: 'bucketID',
        desc: 'String-encoded bucket ID to query.',
        type: 'String',
      },
      {
        name: 'host',
        desc: 'URL of the InfluxDB instance to query.',
        type: 'String',
      },
      {
        name: 'org',
        desc: 'Organization name.',
        type: 'String',
      },
      {
        name: 'orgID',
        desc: 'String-encoded organization ID to query.',
        type: 'String',
      },
      {
        name: 'token',
        desc: 'InfluxDB API token.',
        type: 'String',
      },
    ],
    package: '',
    desc: 'Queries data from an InfluxDB data source.',
    example: 'from(bucket: "example-bucket")',
    category: 'Inputs',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/from/',
  },
  {
    name: 'geo.asTracks',
    args: [
      {
        name: 'groupBy',
        desc:
          'Columns to group by. These columns should uniquely identify each track.',
        type: 'Array of Strings',
      },
      {
        name: 'orderBy',
        desc: 'Columns to order results by. Default is `["_time"]`.',
        type: 'Array of Strings',
      },
    ],
    package: 'experimental/geo',
    desc: 'Groups rows into tracks (sequential, related data points).',
    example: 'import "experimental/geo"\n\ndata\n    |> geo.asTracks()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/geo/astracks/',
  },
  {
    name: 'geo.filterRows',
    args: [
      {
        name: 'region',
        desc: 'Region containing the desired data points.',
        type: 'Object',
      },
      {
        name: 'minSize',
        desc: 'Minimum number of cells that cover the specified region.',
        type: 'Integer',
      },
      {
        name: 'maxSize',
        desc: 'Maximum number of cells that cover the specified region.',
        type: 'Object',
      },
      {
        name: 'level',
        desc:
          'S2 cell level (https://s2geometry.io/resources/s2cell_statistics.html)',
        type: 'Integer',
      },
      {
        name: 's2cellIDLevel',
        desc:
          'S2 cell level (https://s2geometry.io/resources/s2cell_statistics.html)',
        type: 'Integer',
      },
      {
        name: 'strict',
        desc: 'Enable strict geographic data filtering. Default is `true`.',
        type: 'Boolean',
      },
    ],
    package: 'experimental/geo',
    desc:
      'Filters data by a specified geographic region with the option of strict filtering.',
    example:
      'import "experimental/geo"\n\ndata\n    |> geo.filterRows(region: {lat: 40.69335938, lon: -73.30078125, radius: 100.0})',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/geo/filterrows/',
  },
  {
    name: 'geo.gridFilter',
    args: [
      {
        name: 'region',
        desc: 'Region containing the desired data points.',
        type: 'Object',
      },
      {
        name: 'minSize',
        desc: 'Minimum number of cells that cover the specified region.',
        type: 'Integer',
      },
      {
        name: 'maxSize',
        desc: 'Maximum number of cells that cover the specified region.',
        type: 'Object',
      },
      {
        name: 'level',
        desc:
          'S2 cell level (https://s2geometry.io/resources/s2cell_statistics.html)',
        type: 'Integer',
      },
      {
        name: 's2cellIDLevel',
        desc:
          'S2 cell level (https://s2geometry.io/resources/s2cell_statistics.html)',
        type: 'Integer',
      },
      {
        name: 'units',
        desc: 'Record that defines the unit of measurement for distance.',
        type: 'Object',
      },
    ],
    package: 'experimental/geo',
    desc: 'Filters data by a specified geographic region.',
    example:
      'import "experimental/geo"\n\ndata\n    |> geo.gridFilter(region: {lat: 40.69335938, lon: -73.30078125, radius: 20.0})',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/geo/gridfilter/',
  },
  {
    name: 'geo.groupByArea',
    args: [
      {
        name: 'newColumn',
        desc:
          'Name of the new column for the unique identifier for each geographic area.',
        type: 'String',
      },
      {
        name: 'level',
        desc:
          'S2 Cell level (https://s2geometry.io/resources/s2cell_statistics.html)',
        type: 'Integer',
      },
      {
        name: 's2cellIDLevel',
        desc:
          'S2 Cell level (https://s2geometry.io/resources/s2cell_statistics.html)',
        type: 'Integer',
      },
    ],
    package: 'experimental/geo',
    desc: 'Groups rows by geographic area.',
    example:
      'import "experimental/geo"\n\ndata\n    |> geo.groupByArea(newColumn: "foo", level: 4)',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/geo/groupbyarea/',
  },
  {
    name: 'geo.s2CellIDToken',
    args: [
      {
        name: 'token',
        desc: 'S2 cell ID token to update.',
        type: 'String',
      },
      {
        name: 'point',
        desc:
          'Record with `lat` and `lon` properties that specify the latitude and',
        type: 'Object',
      },
      {
        name: 'level',
        desc: 'S2 cell level to use when generating the S2 cell ID token.',
        type: 'Integer',
      },
    ],
    package: 'experimental/geo',
    desc:
      'Returns and S2 cell ID token for given cell or point at a specified S2 cell level.',
    example:
      'import "experimental/geo"\n\ndata\n    |> map(\n        fn: (r) =>\n            ({r with s2_cell_id: geo.s2CellIDToken(point: {lat: r.lat, lon: r.lon}, level: 10)}),\n    )',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/geo/s2cellidtoken/',
  },
  {
    name: 'geo.shapeData',
    args: [
      {
        name: 'latField',
        desc:
          'Name of the existing field that contains the latitude value in decimal degrees (WGS 84).',
        type: 'String',
      },
      {
        name: 'lonField',
        desc:
          'Name of the existing field that contains the longitude value in decimal degrees (WGS 84).',
        type: 'String',
      },
      {
        name: 'level',
        desc:
          'S2 cell level (https://s2geometry.io/resources/s2cell_statistics.html)',
        type: 'Integer',
      },
    ],
    package: 'experimental/geo',
    desc:
      'Renames existing latitude and longitude fields to **lat** and **lon** and adds an **s2\\_cell\\_id** tag.',
    example: 'geo.shapeData()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/geo/shapedata/',
  },
  {
    name: 'geo.strictFilter',
    args: [
      {
        name: 'region',
        desc: 'Region containing the desired data points.',
        type: 'Object',
      },
    ],
    package: 'experimental/geo',
    desc: 'Filters data by latitude and longitude in a specified region.',
    example:
      'import "experimental/geo"\n\ndata\n    |> geo.strictFilter(region: {lat: 40.69335938, lon: -73.30078125, radius: 50.0})',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/geo/strictfilter/',
  },
  {
    name: 'geo.toRows',
    args: [],
    package: 'experimental/geo',
    desc: 'Pivots fields into columns based on time.',
    example: 'import "experimental/geo"\n\ndata\n    |> geo.toRows()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/geo/torows/',
  },
  {
    name: 'getColumn',
    args: [
      {
        name: 'column',
        desc: 'Column to extract.',
        type: 'String',
      },
      {
        name: 'table',
        desc: 'Input table. Default is piped-forward data (`<-`).',
        type: 'Stream of tables',
      },
    ],
    package: '',
    desc: 'Extracts a specified column from a table as an array.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> tableFind(fn: (key) => key.tag == "t1")\n    |> getColumn(column: "_value")',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/getcolumn/',
  },
  {
    name: 'getRecord',
    args: [
      {
        name: 'idx',
        desc: 'Index of the record to extract.',
        type: 'Integer',
      },
      {
        name: 'table',
        desc: 'Input table. Default is piped-forward data (`<-`).',
        type: 'Stream of tables',
      },
    ],
    package: '',
    desc: 'Extracts a row at a specified index from a table as a record.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> tableFind(fn: (key) => key.tag == "t1")\n    |> getRecord(idx: 0)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/getrecord/',
  },
  {
    name: 'group',
    args: [
      {
        name: 'columns',
        desc:
          'List of columns to use in the grouping operation. Default is `[]`.',
        type: 'Array of Strings',
      },
      {
        name: 'mode',
        desc: 'Grouping mode. Default is `by`.',
        type: 'String',
      },
    ],
    package: '',
    desc: 'Regroups input data by modifying group key of input tables.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> group(columns: ["_time", "tag"])',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/group/',
  },
  {
    name: 'highestAverage',
    args: [
      {
        name: 'n',
        desc: 'Number of records to return.',
        type: 'Integer',
      },
      {
        name: 'column',
        desc: 'Column to evaluate. Default is `_value`.',
        type: 'String',
      },
      {
        name: 'groupColumns',
        desc: 'List of columns to group by. Default is `[]`.',
        type: 'Array of Strings',
      },
    ],
    package: '',
    desc:
      'Calculates the average of each input table and returns the highest `n` averages.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> highestAverage(n: 1, groupColumns: ["tag"])',
    category: 'Selectors',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/highestaverage/',
  },
  {
    name: 'highestCurrent',
    args: [
      {
        name: 'n',
        desc: 'Number of records to return.',
        type: 'Integer',
      },
      {
        name: 'column',
        desc: 'Column to evaluate. Default is `_value`.',
        type: 'String',
      },
      {
        name: 'groupColumns',
        desc: 'List of columns to group by. Default is `[]`.',
        type: 'Array of Strings',
      },
    ],
    package: '',
    desc:
      'Selects the last record from each input table and returns the highest `n` records.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> highestCurrent(n: 1, groupColumns: ["tag"])',
    category: 'Selectors',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/highestcurrent/',
  },
  {
    name: 'highestMax',
    args: [
      {
        name: 'n',
        desc: 'Number of records to return.',
        type: 'Integer',
      },
      {
        name: 'column',
        desc: 'Column to evaluate. Default is `_value`.',
        type: 'String',
      },
      {
        name: 'groupColumns',
        desc: 'List of columns to group by. Default is `[]`.',
        type: 'Array of Strings',
      },
    ],
    package: '',
    desc:
      'Selects the record with the highest value in the specified `column` from each input table and returns the highest `n` records.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> highestMax(n: 2, groupColumns: ["tag"])',
    category: 'Selectors',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/highestmax/',
  },
  {
    name: 'histogram',
    args: [
      {
        name: 'column',
        desc: 'Column containing input values. Column must be of type float.',
        type: 'Strings',
      },
      {
        name: 'upperBoundColumn',
        desc: 'Column to store bin upper bounds in. Default is `le`.',
        type: 'String',
      },
      {
        name: 'countColumn',
        desc: 'Column to store bin counts in. Default is `_value`.',
        type: 'String',
      },
      {
        name: 'bins',
        desc:
          'List of upper bounds to use when computing the histogram frequencies.',
        type: 'Array of Floats',
      },
      {
        name: 'normalize',
        desc: 'Convert counts into frequency values between 0 and 1.',
        type: 'Boolean',
      },
    ],
    package: '',
    desc:
      'Approximates the cumulative distribution of a dataset by counting data frequencies for a list of bins.',
    example:
      'import "sampledata"\n\nsampledata.float()\n    |> histogram(bins: [0.0, 5.0, 10.0, 20.0])',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/histogram/',
  },
  {
    name: 'histogramQuantile',
    args: [
      {
        name: 'quantile',
        desc: 'Quantile to compute. Value must be between 0 and 1.',
        type: 'Float',
      },
      {
        name: 'countColumn',
        desc: 'Column containing histogram bin counts. Default is `_value`.',
        type: 'String',
      },
      {
        name: 'upperBoundColumn',
        desc: 'Column containing histogram bin upper bounds.',
        type: 'String',
      },
      {
        name: 'valueColumn',
        desc: 'Column to store the computed quantile in. Default is `_value.',
        type: 'String',
      },
      {
        name: 'minValue',
        desc: 'Assumed minimum value of the dataset. Default is `0.0`.',
        type: 'Float',
      },
      {
        name: 'onNonmonotonic',
        desc: 'Describes behavior when counts are not monotonically increasing',
        type: 'String',
      },
    ],
    package: '',
    desc:
      'Approximates a quantile given a histogram that approximates the cumulative distribution of the dataset.',
    example: 'data\n    |> histogramQuantile(quantile: 0.9)',
    category: 'Aggregates',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/universe/histogramquantile/',
  },
  {
    name: 'holtWinters',
    args: [
      {
        name: 'n',
        desc: 'Number of values to predict.',
        type: 'Integer',
      },
      {
        name: 'interval',
        desc: 'Interval between two data points.',
        type: 'Duration',
      },
      {
        name: 'withFit',
        desc: 'Return fitted data in results. Default is `false`.',
        type: 'Boolean',
      },
      {
        name: 'column',
        desc: 'Column to operate on. Default is `_value`.',
        type: 'String',
      },
      {
        name: 'timeColumn',
        desc: 'Column containing time values to use in the calculating.',
        type: 'String',
      },
      {
        name: 'seasonality',
        desc: 'Number of points in a season. Default is `0`.',
        type: 'Integer',
      },
      {
        name: 'withMinSSE',
        desc: 'Return minSSE data in results. Default is `false`.',
        type: 'Boolean',
      },
    ],
    package: '',
    desc: 'Applies the Holt-Winters forecasting method to input tables.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> holtWinters(n: 6, interval: 10s)',
    category: 'Aggregates',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/holtwinters/',
  },
  {
    name: 'hourSelection',
    args: [
      {
        name: 'start',
        desc:
          'First hour of the hour range (inclusive). Hours range from `[0-23]`.',
        type: 'Integer',
      },
      {
        name: 'stop',
        desc:
          'Last hour of the hour range (inclusive). Hours range from `[0-23]`.',
        type: 'Integer`',
      },
      {
        name: 'location',
        desc:
          'Location used to determine timezone. Default is the `location` option.',
        type: 'Object',
      },
      {
        name: 'timeColumn',
        desc: 'Column that contains the time value. Default is `_time`.',
        type: 'String`',
      },
    ],
    package: '',
    desc: 'Filters rows by time values in a specified hour range.',
    example: 'data\n    |> hourSelection(start: 9, stop: 17)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/hourselection/',
  },
  {
    name: 'http.get',
    args: [
      {
        name: 'url',
        desc: 'URL to send the GET request to.',
        type: 'String',
      },
      {
        name: 'headers',
        desc: 'Headers to include with the GET request.',
        type: 'Object',
      },
      {
        name: 'timeout',
        desc: 'Timeout for the GET request. Default is `30s`.',
        type: 'Duration',
      },
    ],
    package: 'experimental/http',
    desc:
      'Submits an HTTP GET request to the specified URL and returns the HTTP status code, response body, and response headers.',
    example:
      'import "experimental/http"\n\nhttp.get(\n    url: "http://localhost:8086/health",\n    headers: {Authorization: "Token mY5up3RS3crE7t0k3N", Accept: "application/json"},\n)',
    category: 'Miscellaneous',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/http/get/',
  },
  {
    name: 'http.post',
    args: [
      {
        name: 'url',
        desc: 'URL to send the POST request to.',
        type: 'String',
      },
      {
        name: 'headers',
        desc: 'Headers to include with the POST request.',
        type: 'Object',
      },
      {
        name: 'data',
        desc: 'Data body to include with the POST request.',
        type: 'Bytes',
      },
    ],
    package: 'http',
    desc:
      'Sends an HTTP POST request to the specified URL with headers and data and returns the HTTP status code.',
    example:
      'import "json"\nimport "http"\n\n// setup and processing omitted\n\nhttp.post(\n    url: "http://myawsomeurl.com/api/notify",\n    headers: {Authorization: "Bearer mySuPerSecRetTokEn", "Content-type": "application/json"},\n    data: json.encode(v: lastReported[0]),\n)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/http/post/',
  },
  {
    name: 'increase',
    args: [
      {
        name: 'columns',
        desc: 'List of columns to operate on. Default is `["_value"]`.',
        type: 'Array of Strings',
      },
    ],
    package: '',
    desc:
      'Returns the cumulative sum of non-negative differences between subsequent values.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> increase()',
    category: 'Aggregates',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/increase/',
  },
  {
    name: 'int',
    args: [
      {
        name: 'v',
        desc: 'Value to convert.',
        type: 'String, Integer, UInteger, Float, Boolean',
      },
    ],
    package: '',
    desc: 'Converts a value to an integer type.',
    example:
      'int(v: 10.12)\n\nint(v: "3")\n\nint(v: true)\n\nint(v: 1m)\n\nint(v: 2022-01-01T00:00:00Z)',
    category: 'Type Conversions',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/int/',
  },
  {
    name: 'integral',
    args: [
      {
        name: 'unit',
        desc: 'Unit of time to use to compute the integral.',
        type: 'Duration',
      },
      {
        name: 'column',
        desc: 'Column to operate on. Default is `_value`.',
        type: 'String',
      },
      {
        name: 'timeColumn',
        desc: 'Column that contains time values to use in the operation.',
        type: 'String',
      },
      {
        name: 'interpolate',
        desc: 'Type of interpolation to use. Default is `""`.',
        type: 'String',
      },
    ],
    package: '',
    desc:
      'Computes the area under the curve per unit of time of subsequent non-null records.',
    example: 'data\n    |> integral(unit: 10s)',
    category: 'Aggregates',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/integral/',
  },
  {
    name: 'join',
    args: [
      {
        name: 'on',
        desc: 'List of columns to join on.',
        type: 'Array of Strings',
      },
      {
        name: 'method',
        desc: 'Join method. Default is `inner`.',
        type: 'String',
      },
    ],
    package: '',
    desc:
      'Merges two streams of tables into a single output stream based on columns with equal values. Null values are not considered equal when comparing column values. The resulting schema is the union of the input schemas. The resulting group key is the union of the input group keys.',
    example:
      '// setup and processing omitted\n\njoin(tables: {t1: t1, t2: t2}, on: ["_time", "tag"])',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/join/',
  },
  {
    name: 'json.encode',
    args: [
      {
        name: 'v',
        desc: 'Value to convert.',
        type: 'Boolean, Duration, Float, Integer, String, Time, UInteger',
      },
    ],
    package: 'json',
    desc: 'Converts a value into JSON bytes.',
    example:
      'import "json"\n\njsonData = {foo: "bar", baz: 123, quz: [4, 5, 6]}\n\njson.encode(\n    v: jsonData,\n)',
    category: 'Type Conversions',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/json/encode/',
  },
  {
    name: 'kaufmansAMA',
    args: [
      {
        name: 'n',
        desc: 'Period or number of points to use in the calculation.',
        type: 'Integer',
      },
      {
        name: 'column',
        desc: 'Column to operate on. Default is `_value`.',
        type: 'String',
      },
    ],
    package: '',
    desc:
      'Calculates the Kaufman’s Adaptive Moving Average (KAMA) using values in input tables.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> kaufmansAMA(n: 3)',
    category: 'Aggregates',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/kaufmansama/',
  },
  {
    name: 'kaufmansER',
    args: [
      {
        name: 'n',
        desc: 'Period or number of points to use in the calculation.',
        type: 'Integer',
      },
    ],
    package: '',
    desc:
      "Computes the Kaufman's Efficiency Ratio (KER) of values in the `_value` column for each input table.",
    example: 'import "sampledata"\n\nsampledata.int()\n    |> kaufmansER(n: 3)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/kaufmanser/',
  },
  {
    name: 'keep',
    args: [
      {
        name: 'columns',
        desc: 'Columns to keep in output tables. Cannot be used with `fn`.',
        type: 'Array of Strings',
      },
      {
        name: 'fn',
        desc:
          'Predicate function that takes a column name as a parameter (column) and',
        type: 'Function',
      },
    ],
    package: '',
    desc: 'Returns a stream of tables containing only the specified columns.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> keep(columns: ["_time", "_value"])',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/keep/',
  },
  {
    name: 'keys',
    args: [
      {
        name: 'column',
        desc: 'Column to store group key labels in. Default is `_value`.',
        type: 'String',
      },
    ],
    package: '',
    desc: 'Returns the columns that are in the group key of each input table.',
    example: 'data\n    |> keys()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/keys/',
  },
  {
    name: 'keyValues',
    args: [
      {
        name: 'keyColumns',
        desc: 'List of columns from which values are extracted.',
        type: 'Array of Strings',
      },
    ],
    package: '',
    desc:
      "Returns a stream of tables with each input tables' group key and two columns, _key and _value, that correspond to unique column label and value pairs for each input table.",
    example: 'data\n    |> keyValues(keyColumns: ["sensorID", "_field"])',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/keyvalues/',
  },
  {
    name: 'last',
    args: [
      {
        name: 'column',
        desc: 'Column to use to verify the existence of a value.',
        type: 'String',
      },
    ],
    package: '',
    desc: 'Returns the last row with a non-null value from each input table.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> last()',
    category: 'Selectors',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/last/',
  },
  {
    name: 'length',
    args: [
      {
        name: 'arr',
        desc: 'Array to evaluate. Default is the piped-forward array (`<-`).',
        type: 'Array',
      },
    ],
    package: '',
    desc: 'Returns the number of elements in an array.',
    example: 'people = ["John", "Jane", "Abed"]\n\npeople |> length()',
    category: 'Miscellaneous',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/length/',
  },
  {
    name: 'limit',
    args: [
      {
        name: 'n',
        desc: 'Maximum number of rows to return.',
        type: 'Integer',
      },
      {
        name: 'offset',
        desc: 'Number of rows to skip per table before limiting to `n`.',
        type: 'Integer',
      },
    ],
    package: '',
    desc:
      'Returns the first `n` rows after the specified `offset` from each input table.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> limit(n: 3)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/limit/',
  },
  {
    name: 'linearBins',
    args: [
      {
        name: 'start',
        desc: 'First value to return in the list.',
        type: 'Float',
      },
      {
        name: 'width',
        desc: 'Distance between subsequent values.',
        type: 'Float',
      },
      {
        name: 'count',
        desc: 'Number of values to return.',
        type: 'Integer',
      },
      {
        name: 'infinity',
        desc:
          'Include an infinite value at the end of the list. Default is `true`.',
        type: 'Boolean',
      },
    ],
    package: '',
    desc: 'Generates a list of linearly separated float values.',
    example:
      'linearBins(\n    start: 0.0,\n    width: 10.0,\n    count: 10,\n)',
    category: 'Miscellaneous',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/linearbins/',
  },
  {
    name: 'logarithmicBins',
    args: [
      {
        name: 'start',
        desc: 'First value to return in the list.',
        type: 'Float',
      },
      {
        name: 'factor',
        desc: 'Multiplier to apply to subsequent values.',
        type: 'Float',
      },
      {
        name: 'count',
        desc: 'Number of values to return.',
        type: 'Integer',
      },
      {
        name: 'infinity',
        desc:
          'Include an infinite value at the end of the list. Default is `true`.',
        type: 'Boolean',
      },
    ],
    package: '',
    desc: 'Generates a list of exponentially separated float values.',
    example:
      'logarithmicBins(\n    start: 1.0,\n    factor: 2.0,\n    count: 10,\n    infinity: true,\n)',
    category: 'Miscellaneous',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/universe/logarithmicbins/',
  },
  {
    name: 'lowestAverage',
    args: [
      {
        name: 'n',
        desc: 'Number of records to return.',
        type: 'Integer',
      },
      {
        name: 'column',
        desc: 'Column to evaluate. Default is `_value`.',
        type: 'String',
      },
      {
        name: 'groupColumns',
        desc: 'List of columns to group by. Default is `[]`.',
        type: 'Array of Strings',
      },
    ],
    package: '',
    desc:
      'Calculates the average of each input table and returns the lowest `n` averages.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> lowestAverage(n: 1, groupColumns: ["tag"])',
    category: 'Selectors',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/lowestaverage/',
  },
  {
    name: 'lowestCurrent',
    args: [
      {
        name: 'n',
        desc: 'Number of records to return.',
        type: 'Integer',
      },
      {
        name: 'column',
        desc: 'Column to evaluate. Default is `_value`.',
        type: 'String',
      },
      {
        name: 'groupColumns',
        desc: 'List of columns to group by. Default is `[]`.',
        type: 'Array of Strings',
      },
    ],
    package: '',
    desc:
      'Selects the last record from each input table and returns the lowest `n` records.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> lowestCurrent(n: 1, groupColumns: ["tag"])',
    category: 'Selectors',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/lowestcurrent/',
  },
  {
    name: 'lowestMin',
    args: [
      {
        name: 'n',
        desc: 'Number of records to return.',
        type: 'Integer',
      },
      {
        name: 'column',
        desc: 'Column to evaluate. Default is `_value`.',
        type: 'String',
      },
      {
        name: 'groupColumns',
        desc: 'List of columns to group by. Default is `[]`.',
        type: 'Array of Strings',
      },
    ],
    package: '',
    desc:
      'Selects the record with the lowest value in the specified `column` from each input table and returns the bottom `n` records.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> lowestMin(n: 2, groupColumns: ["tag"])',
    category: 'Selectors',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/lowestmin/',
  },
  {
    name: 'map',
    args: [
      {
        name: 'fn',
        desc: 'Single argument function to apply to each record.',
        type: 'Function',
      },
      {
        name: 'mergeKey',
        desc:
          '_(Deprecated)_ Merge group keys of mapped records. Default is `false`.',
        type: 'Boolean',
      },
    ],
    package: '',
    desc: 'Iterates over and applies a function to input rows.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> map(fn: (r) => ({r with _value: r._value * r._value}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/map/',
  },
  {
    name: 'math.abs',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the absolute value of `x`.',
    example: 'import "math"\n\nmath.abs(x: -1.22)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/abs/',
  },
  {
    name: 'math.acos',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the acosine of `x` in radians.',
    example: 'import "math"\n\nmath.acos(x: 0.22)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/acos/',
  },
  {
    name: 'math.acosh',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the inverse hyperbolic cosine of `x`.',
    example: 'import "math"\n\nmath.acosh(x: 1.22)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/acosh/',
  },
  {
    name: 'math.asin',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the arcsine of `x` in radians.',
    example: 'import "math"\n\nmath.asin(x: 0.22)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/asin/',
  },
  {
    name: 'math.asinh',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the inverse hyperbolic sine of `x`.',
    example: 'import "math"\n\nmath.asinh(x: 3.14)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/asinh/',
  },
  {
    name: 'math.atan',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the arctangent of `x` in radians.',
    example: 'import "math"\n\nmath.atan(x: 3.14)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/atan/',
  },
  {
    name: 'math.atan2',
    args: [
      {
        name: 'y',
        desc: 'y-coordinate to use in the operation.',
        type: 'Float',
      },
      {
        name: 'x',
        desc: 'x-coordinate to use in the operation.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc:
      'Returns the artangent of `x/y`, using the signs of the two to determine the quadrant of the return value.',
    example: 'math.atan2()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/atan2/',
  },
  {
    name: 'math.atanh',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the inverse hyperbolic tangent of `x`.',
    example: 'import "math"\n\nmath.atanh(x: 0.22)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/atanh/',
  },
  {
    name: 'math.cbrt',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the cube root of x.',
    example: 'import "math"\n\nmath.cbrt(x: 1728.0)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/cbrt/',
  },
  {
    name: 'math.ceil',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the least integer value greater than or equal to `x`.',
    example: 'import "math"\n\nmath.ceil(x: 3.14)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/ceil/',
  },
  {
    name: 'math.copysign',
    args: [
      {
        name: 'x',
        desc: 'Magnitude to use in the operation.',
        type: 'Float',
      },
      {
        name: 'y',
        desc: 'Sign to use in the operation.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns a value with the magnitude `x` and the sign of `y`.',
    example: 'import "math"\n\nmath.copysign(x: 1.0, y: 2.0)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/copysign/',
  },
  {
    name: 'math.cos',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the cosine of the radian argument `x`.',
    example:
      'import "math"\nimport "sampledata"\n\nsampledata.float()\n    |> map(fn: (r) => ({_time: r._time, _value: math.cos(x: r._value)}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/cos/',
  },
  {
    name: 'math.cosh',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the hyperbolic cosine of `x`.',
    example:
      'import "math"\nimport "sampledata"\n\nsampledata.float()\n    |> map(fn: (r) => ({_time: r._time, _value: math.cosh(x: r._value)}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/cosh/',
  },
  {
    name: 'math.dim',
    args: [
      {
        name: 'x',
        desc: 'x-value to use in the operation.',
        type: 'Float',
      },
      {
        name: 'y',
        desc: 'y-value to use in the operation.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the maximum of `x - y` or `0`.',
    example: 'import "math"\n\nmath.dim(x: 12.2, y: 8.1)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/dim/',
  },
  {
    name: 'math.erf',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the error function of `x`.',
    example: 'import "math"\n\nmath.erf(x: 22.6)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/erf/',
  },
  {
    name: 'math.erfc',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the complementary error function of `x`.',
    example: 'import "math"\n\nmath.erfc(x: 22.6)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/erfc/',
  },
  {
    name: 'math.erfcinv',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the inverse of `math.erfc()`.',
    example: 'import "math"\n\nmath.erfcinv(x: 0.42345)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/erfcinv/',
  },
  {
    name: 'math.erfinv',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the inverse error function of `x`.',
    example: 'import "math"\n\nmath.erfinv(x: 0.22)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/erfinv/',
  },
  {
    name: 'math.exp',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns `e**x`, the base-e exponential of `x`.',
    example: 'import "math"\n\nmath.exp(x: 21.0)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/exp/',
  },
  {
    name: 'math.exp2',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns `2**x`, the base-2 exponential of `x`.',
    example: 'import "math"\n\nmath.exp2(x: 21.0)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/exp2/',
  },
  {
    name: 'math.expm1',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc:
      'Returns `e**x - 1`, the base-e exponential of `x` minus 1. It is more accurate than `math.exp(x:x) - 1` when `x` is near zero.',
    example: 'import "math"\n\nmath.expm1(x: 0.022)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/expm1/',
  },
  {
    name: 'math.float64bits',
    args: [
      {
        name: 'f',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc:
      'Returns the IEEE 754 binary representation of `f`, with the sign bit of `f` and the result in the same bit position.',
    example: 'import "math"\n\nmath.float64bits(f: 1234.56)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/float64bits/',
  },
  {
    name: 'math.floor',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the greatest integer value less than or equal to `x`.',
    example: 'import "math"\n\nmath.floor(x: 1.22)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/floor/',
  },
  {
    name: 'math.frexp',
    args: [
      {
        name: 'f',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Breaks `f` into a normalized fraction and an integral part of two.',
    example: 'import "math"\n\nmath.frexp(f: 22.0)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/frexp/',
  },
  {
    name: 'math.gamma',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the gamma function of `x`.',
    example: 'import "math"\n\nmath.gamma(x: 2.12)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/gamma/',
  },
  {
    name: 'math.hypot',
    args: [
      {
        name: 'p',
        desc: 'p-value to use in the operation.',
        type: 'Float',
      },
      {
        name: 'q',
        desc: 'q-value to use in the operation.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc:
      'Returns the square root of `p*p + q*q`, taking care to avoid overflow and underflow.',
    example: 'import "math"\n\nmath.hypot(p: 2.0, q: 5.0)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/hypot/',
  },
  {
    name: 'math.ilogb',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the binary exponent of `x` as an integer.',
    example: 'import "math"\n\nmath.ilogb(x: 123.45)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/ilogb/',
  },
  {
    name: 'math.isInf',
    args: [
      {
        name: 'f',
        desc: 'is the value used in the evaluation.',
        type: 'Float',
      },
      {
        name: 'sign',
        desc: 'is the sign used in the evaluation.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Reports whether `f` is an infinity, according to `sign`.',
    example: 'import "math"\n\nmath.isInf(f: 2.12, sign: 3)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/isinf/',
  },
  {
    name: 'math.isNaN',
    args: [
      {
        name: 'f',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Reports whether `f` is an IEEE 754 "not-a-number" value.',
    example: 'import "math"\n\nmath.isNaN(f: 12.345)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/isnan/',
  },
  {
    name: 'math.j0',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the order-zero Bessel function of the first kind.',
    example: 'import "math"\n\nmath.j0(x: 1.23)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/j0/',
  },
  {
    name: 'math.j1',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc:
      'Is a function that returns the order-one Bessel function for the first kind.',
    example: 'import "math"\n\nmath.j1(x: 1.23)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/j1/',
  },
  {
    name: 'math.jn',
    args: [
      {
        name: 'n',
        desc: 'Order number.',
        type: 'Float',
      },
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the order-n Bessel function of the first kind.',
    example: 'import "math"\n\nmath.jn(n: 2, x: 1.23)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/jn/',
  },
  {
    name: 'math.ldexp',
    args: [
      {
        name: 'frac',
        desc: 'Fraction to use in the operation.',
        type: 'Float',
      },
      {
        name: 'exp',
        desc: 'Exponent to use in the operation.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Is the inverse of `math.frexp()`. It returns `frac x 2**exp`.',
    example: 'import "math"\n\nmath.ldexp(frac: 0.5, exp: 6)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/ldexp/',
  },
  {
    name: 'math.lgamma',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc:
      'Returns the natural logarithm and sign (-1 or +1) of `math.gamma(x:x)`.',
    example: 'import "math"\n\nmath.lgamma(x: 3.14)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/lgamma/',
  },
  {
    name: 'math.log',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the natural logarithm of `x`.',
    example: 'import "math"\n\nmath.log(x: 3.14)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/log/',
  },
  {
    name: 'math.log1p',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc:
      'Returns the natural logarithm of 1 plus `x`. This operation is more accurate than `math.log(x: 1 + x)` when `x` is near zero.',
    example: 'import "math"\n\nmath.log1p(x: 0.56)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/log1p/',
  },
  {
    name: 'math.log2',
    args: [
      {
        name: 'x',
        desc: 'the value used in the operation.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Is a function returns the binary logarithm of `x`.',
    example: 'import "math"\n\nmath.log2(x: 3.14)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/log2/',
  },
  {
    name: 'math.logb',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the binary exponent of `x`.',
    example: 'import "math"\n\nmath.logb(x: 3.14)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/logb/',
  },
  {
    name: 'math.mInf',
    args: [
      {
        name: 'sign',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc:
      'Returns positive infinity if `sign >= 0`, negative infinity if `sign < 0`.',
    example: 'import "math"\n\nmath.mInf(sign: 1)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/minf/',
  },
  {
    name: 'math.mMax',
    args: [
      {
        name: 'x',
        desc: 'x-value to use in the operation.',
        type: 'Float',
      },
      {
        name: 'y',
        desc: 'y-value to use in the operation.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the larger of `x` or `y`.',
    example: 'import "math"\n\nmath.mMax(x: 1.23, y: 4.56)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/mmax/',
  },
  {
    name: 'math.mMin',
    args: [
      {
        name: 'x',
        desc: 'x-value to use in the operation.',
        type: 'Float',
      },
      {
        name: 'y',
        desc: 'y-value to use in the operation.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Is a function that returns the lesser of `x` or `y`.',
    example: 'import "math"\n\nmath.mMin(x: 1.23, y: 4.56)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/mmin/',
  },
  {
    name: 'math.mod',
    args: [
      {
        name: 'x',
        desc: 'x-value to use in the operation.',
        type: 'Float',
      },
      {
        name: 'y',
        desc: 'y-value to use in the operation.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns a floating-point remainder of `x/y`.',
    example: 'import "math"\n\nmath.mod(x: 4.56, y: 1.23)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/mod/',
  },
  {
    name: 'math.modf',
    args: [
      {
        name: 'f',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc:
      'Returns integer and fractional floating-point numbers that sum to `f`.',
    example: 'import "math"\n\nmath.modf(f: 3.14)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/modf/',
  },
  {
    name: 'math.NaN',
    args: [],
    package: 'math',
    desc: 'Returns a IEEE 754 "not-a-number" value.',
    example: 'import "math"\n\nmath.NaN()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/nan/',
  },
  {
    name: 'math.nextafter',
    args: [
      {
        name: 'x',
        desc: 'x-value to use in the operation.',
        type: 'Float',
      },
      {
        name: 'y',
        desc: 'y-value to use in the operation.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the next representable float value after `x` towards `y`.',
    example: 'import "math"\n\nmath.nextafter(x: 1.23, y: 4.56)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/nextafter/',
  },
  {
    name: 'math.pow',
    args: [
      {
        name: 'x',
        desc: 'Base value to operate on.',
        type: 'Float',
      },
      {
        name: 'y',
        desc: 'Exponent value.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns `x**y`, the base-x exponential of `y`.',
    example: 'import "math"\n\nmath.pow(x: 2.0, y: 3.0)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/pow/',
  },
  {
    name: 'math.pow10',
    args: [
      {
        name: 'n',
        desc: 'Exponent value.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns 10**n, the base-10 exponential of `n`.',
    example: 'import "math"\n\nmath.pow10(n: 3)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/pow10/',
  },
  {
    name: 'math.remainder',
    args: [
      {
        name: 'x',
        desc: 'Numerator to use in the operation.',
        type: 'Float',
      },
      {
        name: 'y',
        desc: 'Denominator to use in the operation.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the IEEE 754 floating-point remainder of `x/y`.',
    example: 'import "math"\n\nmath.remainder(x: 21.0, y: 4.0)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/remainder/',
  },
  {
    name: 'math.round',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the nearest integer, rounding half away from zero.',
    example: 'import "math"\n\nmath.round(x: 2.12)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/round/',
  },
  {
    name: 'math.roundtoeven',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the nearest integer, rounding ties to even.',
    example:
      'import "math"\n\nmath.roundtoeven(x: 3.14)\n\nmath.roundtoeven(x: 3.5)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/roundtoeven/',
  },
  {
    name: 'math.signbit',
    args: [
      {
        name: 'x',
        desc: 'Value to evaluate.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Reports whether `x` is negative or negative zero.',
    example: 'import "math"\n\nmath.signbit(x: -1.2)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/signbit/',
  },
  {
    name: 'math.sin',
    args: [
      {
        name: 'x',
        desc: 'Radian value to use in the operation.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the sine of the radian argument `x`.',
    example: 'import "math"\n\nmath.sin(x: 3.14)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/sin/',
  },
  {
    name: 'math.sincos',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the values of `math.sin(x:x)` and `math.cos(x:x)`.',
    example: 'import "math"\n\nmath.sincos(x: 1.23)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/sincos/',
  },
  {
    name: 'math.sinh',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the hyperbolic sine of `x`.',
    example: 'import "math"\n\nmath.sinh(x: 1.23)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/sinh/',
  },
  {
    name: 'math.sqrt',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the square root of `x`.',
    example: 'import "math"\n\nmath.sqrt(x: 4.0)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/sqrt/',
  },
  {
    name: 'math.tan',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the tangent of the radian argument `x`.',
    example: 'import "math"\n\nmath.tan(x: 3.14)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/tan/',
  },
  {
    name: 'math.tanh',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the hyperbolic tangent of `x`.',
    example: 'import "math"\n\nmath.tanh(x: 1.23)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/tanh/',
  },
  {
    name: 'math.trunc',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the integer value of `x`.',
    example: 'import "math"\n\nmath.trunc(x: 3.14)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/trunc/',
  },
  {
    name: 'math.y0',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the order-zero Bessel function of the second kind.',
    example: 'import "math"\n\nmath.y0(x: 3.14)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/y0/',
  },
  {
    name: 'math.y1',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the order-one Bessel function of the second kind.',
    example: 'import "math"\n\nmath.y1(x: 3.14)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/y1/',
  },
  {
    name: 'math.yn',
    args: [
      {
        name: 'n',
        desc: 'Order number to use in the operation.',
        type: 'Float',
      },
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the order-n Bessel function of the second kind.',
    example: 'import "math"\n\nmath.yn(n: 3, x: 3.14)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/yn/',
  },
  {
    name: 'max',
    args: [
      {
        name: 'column',
        desc: 'Column to return maximum values from. Default is `_value`.',
        type: 'String',
      },
    ],
    package: '',
    desc:
      'Returns the row with the maximum value in a specified column from each input table.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> max()',
    category: 'Selectors',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/max/',
  },
  {
    name: 'mean',
    args: [
      {
        name: 'column',
        desc: 'Column to use to compute means. Default is `_value`.',
        type: 'String',
      },
    ],
    package: '',
    desc:
      'Returns the average of non-null values in a specified column from each input table.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> mean()',
    category: 'Aggregates',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/mean/',
  },
  {
    name: 'median',
    args: [
      {
        name: 'column',
        desc: 'Column to use to compute the median. Default is `_value`.',
        type: 'String',
      },
      {
        name: 'method',
        desc: 'Computation method. Default is `estimate_tdigest`.',
        type: 'String',
      },
      {
        name: 'compression',
        desc: 'Number of centroids to use when compressing the dataset.',
        type: 'Float',
      },
    ],
    package: '',
    desc:
      'Returns the median `_value` of an input table or all non-null records in the input table with values that fall within the 0.5 quantile (50th percentile).',
    example: 'import "sampledata"\n\nsampledata.float()\n    |> median()',
    category: 'Aggregates',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/median/',
  },
  {
    name: 'min',
    args: [
      {
        name: 'column',
        desc: 'Column to return minimum values from. Default is `_value`.',
        type: 'String',
      },
    ],
    package: '',
    desc:
      'Returns the row with the minimum value in a specified column from each input table.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> min()',
    category: 'Selectors',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/min/',
  },
  {
    name: 'mode',
    args: [
      {
        name: 'column',
        desc: 'Column to return the mode from. Default is `_value`.',
        type: 'String',
      },
    ],
    package: '',
    desc:
      'Returns the non-null value or values that occur most often in a specified column in each input table.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> mode()',
    category: 'Aggregates',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/mode/',
  },
  {
    name: 'movingAverage',
    args: [
      {
        name: 'n',
        desc: 'Number of values to average.',
        type: 'Duration',
      },
    ],
    package: '',
    desc:
      'Calculates the mean of non-null values using the current value and `n - 1` previous values in the `_values` column.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> movingAverage(n: 3)',
    category: 'Aggregates',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/movingaverage/',
  },
  {
    name: 'mqtt.to',
    args: [
      {
        name: 'broker',
        desc: 'MQTT broker connection string.',
        type: 'String',
      },
      {
        name: 'topic',
        desc: 'MQTT topic to send data to.',
        type: 'String',
      },
      {
        name: 'qos',
        desc:
          'MQTT Quality of Service (QoS) level. Values range from `[0-2]`. Default is `0`.',
        type: 'Integer',
      },
      {
        name: 'retain',
        desc: 'MQTT retain flag. Default is `false`.',
        type: 'Boolean',
      },
      {
        name: 'clientid',
        desc: 'MQTT client ID.',
        type: 'String',
      },
      {
        name: 'username',
        desc: 'Username to send to the MQTT broker.',
        type: 'String',
      },
      {
        name: 'password',
        desc: 'Password to send to the MQTT broker.',
        type: 'String',
      },
      {
        name: 'name',
        desc: 'Name for the MQTT message.',
        type: 'String',
      },
      {
        name: 'timeout',
        desc: 'MQTT connection timeout. Default is `1s`.',
        type: 'Duration',
      },
      {
        name: 'timeColumn',
        desc: 'Column to use as time values in the output line protocol.',
        type: 'String',
      },
      {
        name: 'tagColumns',
        desc: 'Columns to use as tag sets in the output line protocol.',
        type: 'Array of Strings',
      },
      {
        name: 'valueColumns',
        desc: 'Columns to use as field values in the output line protocol.',
        type: 'Array of Strings',
      },
    ],
    package: 'experimental/mqtt',
    desc:
      'Outputs data from a stream of tables to an MQTT broker using MQTT protocol.',
    example:
      'import "experimental/mqtt"\nimport "sampledata"\n\nsampledata.float()\n    |> mqtt.to(\n        broker: "tcp://localhost:8883",\n        topic: "example-topic",\n        clientid: r.id,\n        tagColumns: ["id"],\n        valueColumns: ["_value"],\n    )',
    category: 'Outputs',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/mqtt/to/',
  },
  {
    name: 'pearsonr',
    args: [
      {
        name: 'x',
        desc: 'First input stream.',
        type: 'Object',
      },
      {
        name: 'y',
        desc: 'Second input stream.',
        type: 'Object',
      },
      {
        name: 'on',
        desc: 'List of columns to join on.',
        type: 'Array of Strings',
      },
    ],
    package: '',
    desc:
      'Returns the covariance of two streams of tables normalized to the Pearson R coefficient.',
    example:
      '// setup and processing omitted\n\npearsonr(x: stream1, y: stream2, on: ["_time"])',
    category: 'Aggregates',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/pearsonr/',
  },
  {
    name: 'pivot',
    args: [
      {
        name: 'rowKey',
        desc: 'Columns to use to uniquely identify an output row.',
        type: 'Array of Strings',
      },
      {
        name: 'columnKey',
        desc: 'Columns to use to identify new output columns.',
        type: 'Array of Strings',
      },
      {
        name: 'valueColumn',
        desc:
          'Column to use to populate the value of pivoted `columnKey` columns.',
        type: 'String',
      },
    ],
    package: '',
    desc:
      'Collects unique values stored vertically (column-wise) and aligns them horizontally (row-wise) into logical sets.',
    example:
      'data\n    |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/pivot/',
  },
  {
    name: 'prometheus.histogramQuantile',
    args: [
      {
        name: 'quantile',
        desc: 'Quantile to compute. Must be a float value between 0.0 and 1.0.',
        type: 'Float',
      },
      {
        name: 'metricVersion',
        desc:
          'Prometheus metric parsing format (/influxdb/v2/reference/prometheus-metrics/)',
        type: 'Object',
      },
      {
        name: 'onNonmonotonic',
        desc: 'Describes behavior when counts are not monotonically increasing',
        type: 'String',
      },
    ],
    package: 'experimental/prometheus',
    desc: 'Calculates a quantile on a set of Prometheus histogram values.',
    example:
      'import "experimental/prometheus"\n\nprometheus.scrape(url: "http://localhost:8086/metrics")\n    |> filter(fn: (r) => r._measurement == "prometheus")\n    |> filter(fn: (r) => r._field == "qc_all_duration_seconds")\n    |> prometheus.histogramQuantile(quantile: 0.99)',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/prometheus/histogramquantile/',
  },
  {
    name: 'prometheus.scrape',
    args: [
      {
        name: 'url',
        desc: 'URL to scrape Prometheus metrics from.',
        type: 'String',
      },
    ],
    package: 'experimental/prometheus',
    desc:
      'Scrapes Prometheus metrics from an HTTP-accessible endpoint and returns them as a stream of tables.',
    example:
      'import "experimental/prometheus"\n\nprometheus.scrape(url: "http://localhost:8086/metrics")',
    category: 'Inputs',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/prometheus/scrape/',
  },
  {
    name: 'quantile',
    args: [
      {
        name: 'column',
        desc: 'Column to use to compute the quantile. Default is `_value`.',
        type: 'String',
      },
      {
        name: 'q',
        desc: 'Quantile to compute. Must be between `0.0` and `1.0`.',
        type: 'Float',
      },
      {
        name: 'method',
        desc: 'Computation method. Default is `estimate_tdigest`.',
        type: 'String',
      },
      {
        name: 'compression',
        desc: 'Number of centroids to use when compressing the dataset.',
        type: 'Float',
      },
    ],
    package: '',
    desc:
      'Returns rows from each input table with values that fall within a specified quantile or returns the row with the value that represents the specified quantile.',
    example:
      'import "sampledata"\n\nsampledata.float()\n    |> quantile(q: 0.99, method: "estimate_tdigest")',
    category: 'Aggregates',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/quantile/',
  },
  {
    name: 'query.filterFields',
    args: [
      {
        name: 'fields',
        desc: 'Fields to filter by. Default is `[]`.',
        type: 'Array of Strings',
      },
      {
        name: 'table',
        desc: 'Input data. Default is piped-forward data (`<-`).',
        type: 'Stream of tables',
      },
    ],
    package: 'experimental/query',
    desc: 'Filters input data by field.',
    example:
      'import "experimental/query"\n\nquery.fromRange(bucket: "telegraf", start: -1h)\n    |> query.filterFields(fields: ["used_percent", "available_percent"])',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/query/filterfields/',
  },
  {
    name: 'query.filterMeasurement',
    args: [
      {
        name: 'measurement',
        desc: 'InfluxDB measurement name to filter by.',
        type: 'String',
      },
      {
        name: 'table',
        desc: 'Input data. Default is piped-forward data (`<-`).',
        type: 'Stream of tables',
      },
    ],
    package: 'experimental/query',
    desc: 'Filters input data by measurement.',
    example:
      'import "experimental/query"\n\nquery.fromRange(bucket: "example-bucket", start: -1h)\n    |> query.filterMeasurement(measurement: "example-measurement")',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/query/filtermeasurement/',
  },
  {
    name: 'query.fromRange',
    args: [
      {
        name: 'bucket',
        desc: 'InfluxDB bucket name.',
        type: 'String',
      },
      {
        name: 'start',
        desc: 'Earliest time to include in results.',
        type: 'Duration | Time',
      },
      {
        name: 'stop',
        desc: 'Latest time to include in results. Default is `now()`.',
        type: 'Duration | Time',
      },
    ],
    package: 'experimental/query',
    desc: 'Returns all data from a specified bucket within given time bounds.',
    example:
      'import "experimental/query"\n\nquery.fromRange(bucket: "example-bucket", start: -1h)',
    category: 'Inputs',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/query/fromrange/',
  },
  {
    name: 'query.inBucket',
    args: [
      {
        name: 'bucket',
        desc: 'InfluxDB bucket name.',
        type: 'String',
      },
      {
        name: 'measurement',
        desc: 'InfluxDB measurement name to filter by.',
        type: 'String',
      },
      {
        name: 'start',
        desc: 'Earliest time to include in results.',
        type: 'Duration | Time',
      },
      {
        name: 'stop',
        desc: 'Latest time to include in results. Default is `now()`.',
        type: 'Duration | Time',
      },
      {
        name: 'fields',
        desc: 'Fields to filter by. Default is `[]`.',
        type: 'Array of Strings',
      },
      {
        name: 'predicate',
        desc:
          'Predicate function that evaluates column values and returns `true` or `false`.',
        type: 'Function',
      },
    ],
    package: 'experimental/query',
    desc:
      'Queries data from a specified InfluxDB bucket within given time bounds, filters data by measurement, field, and optional predicate expressions.',
    example:
      'import "experimental/query"\n\nquery.inBucket(\n    bucket: "example-buckt",\n    start: -1h,\n    measurement: "mem",\n    fields: ["field1", "field2"],\n    predicate: (r) => r.host == "host1",\n)',
    category: 'Inputs',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/query/inbucket/',
  },
  {
    name: 'range',
    args: [
      {
        name: 'start',
        desc: 'Earliest time to include in results.',
        type: 'Duration | Time',
      },
      {
        name: 'stop',
        desc: 'Latest time to include in results. Default is `now()`.',
        type: 'Duration | Time',
      },
    ],
    package: '',
    desc: 'Filters rows based on time bounds.',
    example: 'from(bucket: "example-bucket")\n    |> range(start: -12h)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/range/',
  },
  {
    name: 'reduce',
    args: [
      {
        name: 'fn',
        desc: 'Reducer function to apply to each row record (`r`).',
        type: 'Function',
      },
      {
        name: 'identity',
        desc:
          'Record that defines the reducer record and provides initial values',
        type: 'Object',
      },
    ],
    package: '',
    desc:
      'Aggregates rows in each input table using a reducer function (`fn`).',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> reduce(fn: (r, accumulator) => ({sum: r._value + accumulator.sum}), identity: {sum: 0})',
    category: 'Aggregates',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/reduce/',
  },
  {
    name: 'regexp.compile',
    args: [
      {
        name: 'v',
        desc: 'String value to parse into a regular expression.',
        type: 'String',
      },
    ],
    package: 'regexp',
    desc:
      'Parses a string into a regular expression and returns a regexp type that can be used to match against strings.',
    example: 'import "regexp"\n\nregexp.compile(v: "abcd")',
    category: 'Type Conversions',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/regexp/compile/',
  },
  {
    name: 'regexp.findString',
    args: [
      {
        name: 'r',
        desc: 'Regular expression used to search `v`.',
        type: 'Regexp',
      },
      {
        name: 'v',
        desc: 'String value to search.',
        type: 'String',
      },
    ],
    package: 'regexp',
    desc: 'Returns the left-most regular expression match in a string.',
    example:
      'import "regexp"\n\nregexp.findString(r: /foo.?/, v: "seafood fool")',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/regexp/findstring/',
  },
  {
    name: 'regexp.findStringIndex',
    args: [
      {
        name: 'r',
        desc: 'Regular expression used to search `v`.',
        type: 'Regexp',
      },
      {
        name: 'v',
        desc: 'String value to search.',
        type: 'String',
      },
    ],
    package: 'regexp',
    desc:
      'Returns a two-element array of integers that represent the beginning and ending indexes of the first regular expression match in a string.',
    example: 'import "regexp"\n\nregexp.findStringIndex(r: /ab?/, v: "tablet")',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/regexp/findstringindex/',
  },
  {
    name: 'regexp.getString',
    args: [
      {
        name: 'r',
        desc: 'Regular expression object to convert to a string.',
        type: 'Regexp',
      },
    ],
    package: 'regexp',
    desc: 'Returns the source string used to compile a regular expression.',
    example: 'regexp.getString()',
    category: 'Type Conversions',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/regexp/getstring/',
  },
  {
    name: 'regexp.matchRegexpString',
    args: [
      {
        name: 'r',
        desc: 'Regular expression used to search `v`.',
        type: 'Regexp',
      },
      {
        name: 'v',
        desc: 'String value to search.',
        type: 'String',
      },
    ],
    package: 'regexp',
    desc: 'Tests if a string contains any match to a regular expression.',
    example:
      'import "regexp"\n\nregexp.matchRegexpString(r: /(gopher){2}/, v: "gophergophergopher")',
    category: 'Tests',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/regexp/matchregexpstring/',
  },
  {
    name: 'regexp.quoteMeta',
    args: [
      {
        name: 'v',
        desc:
          'String that contains regular expression metacharacters to escape.',
        type: 'String',
      },
    ],
    package: 'regexp',
    desc: 'Escapes all regular expression metacharacters in a string.',
    example: 'import "regexp"\n\nregexp.quoteMeta(v: ".+*?()|[]{}^$")',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/regexp/quotemeta/',
  },
  {
    name: 'regexp.replaceAllString',
    args: [
      {
        name: 'r',
        desc: 'Regular expression used to search `v`.',
        type: 'Regexp',
      },
      {
        name: 'v',
        desc: 'String value to search.',
        type: 'String',
      },
      {
        name: 't',
        desc: 'Replacement for matches to `r`.',
        type: 'String',
      },
    ],
    package: 'regexp',
    desc:
      'Replaces all reguar expression matches in a string with a specified replacement.',
    example:
      'import "regexp"\n\nregexp.replaceAllString(r: /a(x*)b/, v: "-ab-axxb-", t: "T")',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/regexp/replaceallstring/',
  },
  {
    name: 'regexp.splitRegexp',
    args: [
      {
        name: 'r',
        desc: 'Regular expression used to search `v`.',
        type: 'Regexp',
      },
      {
        name: 'v',
        desc: 'String value to be searched.',
        type: 'String',
      },
      {
        name: 'i',
        desc: 'Maximum number of substrings to return.',
        type: 'Integer',
      },
    ],
    package: 'regexp',
    desc:
      'Splits a string into substrings separated by regular expression matches and returns an array of `i` substrings between matches.',
    example:
      'import "regexp"\n\nregexp.splitRegexp(r: /a*/, v: "abaabaccadaaae", i: -1)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/regexp/splitregexp/',
  },
  {
    name: 'relativeStrengthIndex',
    args: [
      {
        name: 'n',
        desc: 'Number of values to use to calculate the RSI.',
        type: 'Integer',
      },
      {
        name: 'columns',
        desc: 'Columns to operate on. Default is `["_value"]`.',
        type: 'Array of Strings`',
      },
    ],
    package: '',
    desc: 'Measures the relative speed and change of values in input tables.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> relativeStrengthIndex(n: 3)',
    category: 'Aggregates',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/universe/relativestrengthindex/',
  },
  {
    name: 'rename',
    args: [
      {
        name: 'columns',
        desc: 'Record that maps old column names to new column names.',
        type: 'Object',
      },
      {
        name: 'fn',
        desc:
          'Function that takes the current column name (`column`) and returns a',
        type: 'Function',
      },
    ],
    package: '',
    desc: 'Renames columns in a table.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> rename(columns: {tag: "uid", _value: "val"})',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/rename/',
  },
  {
    name: 'runtime.version',
    args: [],
    package: 'runtime',
    desc: 'Returns the current Flux version.',
    example:
      'import "array"\nimport "runtime"\n\narray.from(rows: [{version: runtime.version()}])',
    category: 'Miscellaneous',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/runtime/version/',
  },
  {
    name: 'sample',
    args: [
      {
        name: 'n',
        desc: 'Sample every Nth element.',
        type: 'Integer',
      },
      {
        name: 'pos',
        desc:
          'Position offset from the start of results where sampling begins.',
        type: 'Integer',
      },
      {
        name: 'column',
        desc: 'Column to operate on.',
        type: 'String',
      },
    ],
    package: '',
    desc: 'Selects a subset of the rows from each input table.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> sample(n: 2, pos: 1)',
    category: 'Selectors',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/sample/',
  },
  {
    name: 'secrets.get',
    args: [
      {
        name: 'key',
        desc: 'Secret key to retrieve.',
        type: 'String',
      },
    ],
    package: 'influxdata/influxdb/secrets',
    desc: 'Retrieves a secret from the InfluxDB secret store.',
    example:
      'import "influxdata/influxdb/secrets"\n\nsecrets.get(key: "KEY_NAME")',
    category: 'Miscellaneous',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/secrets/get/',
  },
  {
    name: 'set',
    args: [
      {
        name: 'key',
        desc: 'Label of the column to modify or set.',
        type: 'String',
      },
      {
        name: 'value',
        desc: 'String value to set.',
        type: 'String',
      },
    ],
    package: '',
    desc: 'Assigns a static column value to each row in the input tables.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> set(key: "host", value: "prod1")',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/set/',
  },
  {
    name: 'skew',
    args: [
      {
        name: 'column',
        desc: 'Column to operate on. Default is `_value`.',
        type: 'String',
      },
    ],
    package: '',
    desc:
      'Returns the skew of non-null records in each input table as a float.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> skew()',
    category: 'Aggregates',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/skew/',
  },
  {
    name: 'sort',
    args: [
      {
        name: 'columns',
        desc: 'List of columns to sort by. Default is `["_value"]`.',
        type: 'Array of Strings',
      },
      {
        name: 'desc',
        desc: 'Sort results in descending order. Default is `false`.',
        type: 'Boolean',
      },
    ],
    package: '',
    desc:
      'Orders rows in each input table based on values in specified columns.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> sort()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/sort/',
  },
  {
    name: 'spread',
    args: [
      {
        name: 'column',
        desc: 'Column to operate on. Default is `_value`.',
        type: 'String',
      },
    ],
    package: '',
    desc:
      'Returns the difference between the minimum and maximum values in a specified column.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> spread()',
    category: 'Aggregates',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/spread/',
  },
  {
    name: 'sql.from',
    args: [
      {
        name: 'driverName',
        desc: 'Driver to use to connect to the SQL database.',
        type: 'String',
      },
      {
        name: 'dataSourceName',
        desc: 'Data source name (DNS) or connection string used to connect',
        type: 'String',
      },
      {
        name: 'query',
        desc: 'Query to run against the SQL database.',
        type: 'String',
      },
    ],
    package: 'sql',
    desc: 'Retrieves data from a SQL data source.',
    example: 'sql.from()',
    category: 'Inputs',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/sql/from/',
  },
  {
    name: 'sql.to',
    args: [
      {
        name: 'driverName',
        desc: 'Driver used to connect to the SQL database.',
        type: 'String',
      },
      {
        name: 'dataSourceName',
        desc: 'Data source name (DNS) or connection string used',
        type: 'String',
      },
      {
        name: 'table',
        desc: 'Destination table.',
        type: 'String',
      },
      {
        name: 'batchSize',
        desc: 'Number of parameters or columns that can be queued within each',
        type: 'Integer',
      },
    ],
    package: 'sql',
    desc: 'Writes data to an SQL database.',
    example: 'sql.to()',
    category: 'Outputs',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/sql/to/',
  },
  {
    name: 'stateCount',
    args: [
      {
        name: 'fn',
        desc: 'Predicate function that identifies the state of a record.',
        type: 'Function',
      },
      {
        name: 'column',
        desc: 'Column to store the state count in. Default is `stateCount`.',
        type: 'String',
      },
    ],
    package: '',
    desc: 'Returns the number of consecutive rows in a given state.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> stateCount(fn: (r) => r._value < 10)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/statecount/',
  },
  {
    name: 'stateDuration',
    args: [
      {
        name: 'fn',
        desc: 'Predicate function that identifies the state of a record.',
        type: 'Function',
      },
      {
        name: 'column',
        desc:
          'Column to store the state duration in. Default is `stateDuration`.',
        type: 'String',
      },
      {
        name: 'timeColumn',
        desc: 'Time column to use to calculate elapsed time between rows.',
        type: 'String',
      },
      {
        name: 'unit',
        desc:
          'Unit of time to use to increment state duration. Default is `1s` (seconds).',
        type: 'Duration',
      },
    ],
    package: '',
    desc: 'Returns the cumulative duration of a given state.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> stateDuration(fn: (r) => r._value < 15)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/stateduration/',
  },
  {
    name: 'stddev',
    args: [
      {
        name: 'column',
        desc: 'Column to operate on. Default is `_value`.',
        type: 'String',
      },
      {
        name: 'mode',
        desc:
          'Standard deviation mode or type of standard deviation to calculate.',
        type: 'String',
      },
    ],
    package: '',
    desc:
      'Returns the standard deviation of non-null values in a specified column.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> stddev()',
    category: 'Aggregates',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/stddev/',
  },
  {
    name: 'string',
    args: [
      {
        name: 'v',
        desc: 'Value to convert.',
        type: 'Integer, UInteger, Float, Boolean, Duration, Time',
      },
    ],
    package: '',
    desc: 'Converts a value to a string type.',
    example:
      'string(v: true)\n\nstring(v: 1m)\n\nstring(v: 2021-01-01T00:00:00Z)\n\nstring(v: 10.12)',
    category: 'Type Conversions',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/string/',
  },
  {
    name: 'strings.compare',
    args: [
      {
        name: 'v',
        desc: 'String value to compare.',
        type: 'String',
      },
      {
        name: 't',
        desc: 'String value to compare against.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc: 'Compares the lexicographical order of two strings.',
    example:
      'import "strings"\n\ndata\n    |> map(fn: (r) => ({r with same: strings.compare(v: r.string1, t: r.string2)}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/compare/',
  },
  {
    name: 'strings.containsAny',
    args: [
      {
        name: 'v',
        desc: 'String value to search.',
        type: 'String',
      },
      {
        name: 'chars',
        desc: 'Characters to search for.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc:
      'Reports whether a specified string contains characters from another string.',
    example:
      'import "sampledata"\nimport "strings"\n\nsampledata.string()\n    |> filter(fn: (r) => strings.containsAny(v: r._value, chars: "a79"))',
    category: 'Tests',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/containsany/',
  },
  {
    name: 'strings.containsStr',
    args: [
      {
        name: 'v',
        desc: 'String value to search.',
        type: 'String',
      },
      {
        name: 'substr',
        desc: 'Substring value to search for.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc: 'Reports whether a string contains a specified substring.',
    example:
      'import "sampledata"\nimport "strings"\n\nsampledata.string()\n    |> filter(fn: (r) => strings.containsStr(v: r._value, substr: "5"))',
    category: 'Tests',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/containsstr/',
  },
  {
    name: 'strings.countStr',
    args: [
      {
        name: 'v',
        desc: 'String value to search.',
        type: 'String',
      },
      {
        name: 'substr',
        desc: 'Substring to count occurrences of.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc:
      'Counts the number of non-overlapping instances of a substring appears in a string.',
    example:
      'import "sampledata"\nimport "strings"\n\nsampledata.string()\n    |> map(fn: (r) => ({r with _value: strings.countStr(v: r._value, substr: "p")}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/countstr/',
  },
  {
    name: 'strings.equalFold',
    args: [
      {
        name: 'v',
        desc: 'String value to compare.',
        type: 'String',
      },
      {
        name: 't',
        desc: 'String value to compare against.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc:
      'Reports whether two UTF-8 strings are equal under Unicode case-folding.',
    example:
      'import "strings"\n\ndata\n    |> map(fn: (r) => ({r with same: strings.equalFold(v: r.string1, t: r.string2)}))',
    category: 'Tests',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/equalfold/',
  },
  {
    name: 'strings.hasPrefix',
    args: [
      {
        name: 'v',
        desc: 'String value to search.',
        type: 'String',
      },
      {
        name: 'prefix',
        desc: 'Prefix to search for.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc: 'Indicates if a string begins with a specified prefix.',
    example:
      'import "sampledata"\nimport "strings"\n\nsampledata.string()\n    |> filter(fn: (r) => strings.hasPrefix(v: r._value, prefix: "smpl_5"))',
    category: 'Tests',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/hasprefix/',
  },
  {
    name: 'strings.hasSuffix',
    args: [
      {
        name: 'v',
        desc: 'String value to search.',
        type: 'String',
      },
      {
        name: 'suffix',
        desc: 'Suffix to search for.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc: 'Indicates if a string ends with a specified suffix.',
    example:
      'import "sampledata"\nimport "strings"\n\nsampledata.string()\n    |> filter(fn: (r) => strings.hasSuffix(v: r._value, suffix: "4"))',
    category: 'Tests',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/hassuffix/',
  },
  {
    name: 'strings.index',
    args: [
      {
        name: 'v',
        desc: 'String value to search.',
        type: 'String',
      },
      {
        name: 'substr',
        desc: 'Substring to search for.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc:
      'Returns the index of the first instance of a substring in a string. If the substring is not present, it returns `-1`.',
    example:
      'import "sampledata"\nimport "strings"\n\nsampledata.string()\n    |> map(fn: (r) => ({r with _value: strings.index(v: r._value, substr: "g")}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/index-fn/',
  },
  {
    name: 'strings.indexAny',
    args: [
      {
        name: 'v',
        desc: 'String value to search.',
        type: 'String',
      },
      {
        name: 'chars',
        desc: 'Characters to search for.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc:
      'Returns the index of the first instance of specified characters in a string. If none of the specified characters are present, it returns `-1`.',
    example:
      'import "sampledata"\nimport "strings"\n\nsampledata.string()\n    |> map(fn: (r) => ({r with _value: strings.indexAny(v: r._value, chars: "g7t")}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/indexany/',
  },
  {
    name: 'strings.isDigit',
    args: [
      {
        name: 'v',
        desc: 'Single-character string to test.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc: 'Tests if a single-character string is a digit (0-9).',
    example:
      'import "strings"\n\ndata\n    |> filter(fn: (r) => strings.isDigit(v: r._value))',
    category: 'Tests',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/isdigit/',
  },
  {
    name: 'strings.isLetter',
    args: [
      {
        name: 'v',
        desc: 'Single-character string to test.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc: 'Tests if a single character string is a letter (a-z, A-Z).',
    example:
      'import "strings"\n\ndata\n    |> filter(fn: (r) => strings.isLetter(v: r._value))',
    category: 'Tests',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/isletter/',
  },
  {
    name: 'strings.isLower',
    args: [
      {
        name: 'v',
        desc: 'Single-character string value to test.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc: 'Tests if a single-character string is lowercase.',
    example:
      'import "strings"\n\ndata\n    |> filter(fn: (r) => strings.isLower(v: r._value))',
    category: 'Tests',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/islower/',
  },
  {
    name: 'strings.isUpper',
    args: [
      {
        name: 'v',
        desc: 'Single-character string value to test.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc: 'Tests if a single character string is uppercase.',
    example:
      'import "strings"\n\ndata\n    |> filter(fn: (r) => strings.isUpper(v: r._value))',
    category: 'Tests',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/isupper/',
  },
  {
    name: 'strings.joinStr',
    args: [
      {
        name: 'arr',
        desc: 'Array of strings to concatenate.',
        type: 'Array of Strings',
      },
      {
        name: 'v',
        desc: 'Separator to use in the concatenated value.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc:
      'Concatenates elements of a string array into a single string using a specified separator.',
    example:
      'import "strings"\n\nstrings.joinStr(arr: ["foo", "bar", "baz", "quz"], v: ", ")',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/joinstr/',
  },
  {
    name: 'strings.lastIndex',
    args: [
      {
        name: 'v',
        desc: 'String value to search.',
        type: 'String',
      },
      {
        name: 'substr',
        desc: 'Substring to search for.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc:
      'Returns the index of the last instance of a substring in a string. If the substring is not present, the function returns -1.',
    example:
      'import "sampledata"\nimport "strings"\n\nsampledata.string()\n    |> map(fn: (r) => ({r with _value: strings.lastIndex(v: r._value, substr: "g")}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/lastindex/',
  },
  {
    name: 'strings.lastIndexAny',
    args: [
      {
        name: 'v',
        desc: 'String value to search.',
        type: 'String',
      },
      {
        name: 'chars',
        desc: 'Characters to search for.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc:
      'Returns the index of the last instance of any specified characters in a string. If none of the specified characters are present, the function returns `-1`.',
    example:
      'import "sampledata"\nimport "strings"\n\nsampledata.string()\n    |> map(fn: (r) => ({r with _value: strings.lastIndexAny(v: r._value, chars: "g7t")}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/lastindexany/',
  },
  {
    name: 'strings.repeat',
    args: [
      {
        name: 'v',
        desc: 'String value to repeat.',
        type: 'String',
      },
      {
        name: 'i',
        desc: 'Number of times to repeat `v`.',
        type: 'Integer',
      },
    ],
    package: 'strings',
    desc: 'Returns a string consisting of `i` copies of a specified string.',
    example:
      'import "strings"\n\ndata\n    |> map(fn: (r) => ({r with _value: strings.repeat(v: "ha", i: r._value)}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/repeat/',
  },
  {
    name: 'strings.replace',
    args: [
      {
        name: 'v',
        desc: 'String value to search.',
        type: 'String',
      },
      {
        name: 't',
        desc: 'Substring value to replace.',
        type: 'String',
      },
      {
        name: 'u',
        desc: 'Replacement for `i` instances of `t`.',
        type: 'String',
      },
      {
        name: 'i',
        desc: 'Number of non-overlapping `t` matches to replace.',
        type: 'Integer',
      },
    ],
    package: 'strings',
    desc:
      'Replaces the first `i` non-overlapping instances of a substring with a specified replacement.',
    example:
      'import "sampledata"\nimport "strings"\n\nsampledata.string()\n    |> map(fn: (r) => ({r with _value: strings.replace(v: r._value, t: "p", u: "XX", i: 2)}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/replace/',
  },
  {
    name: 'strings.replaceAll',
    args: [
      {
        name: 'v',
        desc: 'String value to search.',
        type: 'String',
      },
      {
        name: 't',
        desc: 'Substring to replace.',
        type: 'String',
      },
      {
        name: 'u',
        desc: 'Replacement for all instances of `t`.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc:
      'Replaces all non-overlapping instances of a substring with a specified replacement.',
    example:
      'import "sampledata"\nimport "strings"\n\nsampledata.string()\n    |> map(fn: (r) => ({r with _value: strings.replaceAll(v: r._value, t: "p", u: "XX")}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/replaceall/',
  },
  {
    name: 'strings.split',
    args: [
      {
        name: 'v',
        desc: 'String value to split.',
        type: 'String',
      },
      {
        name: 't',
        desc: 'String value that acts as the separator.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc:
      'Splits a string on a specified separator and returns an array of substrings.',
    example:
      'import "strings"\n\nstrings.split(v: "foo, bar, baz, quz", t: ", ")',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/split/',
  },
  {
    name: 'strings.splitAfter',
    args: [
      {
        name: 'v',
        desc: 'String value to split.',
        type: 'String',
      },
      {
        name: 't',
        desc: 'String value that acts as the separator.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc:
      'Splits a string after a specified separator and returns an array of substrings. Split substrings include the separator, `t`.',
    example:
      'import "strings"\n\nstrings.splitAfter(v: "foo, bar, baz, quz", t: ", ")',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/splitafter/',
  },
  {
    name: 'strings.splitAfterN',
    args: [
      {
        name: 'v',
        desc: 'String value to split.',
        type: 'String',
      },
      {
        name: 't',
        desc: 'String value that acts as the separator.',
        type: 'String',
      },
      {
        name: 'i',
        desc: 'Maximum number of split substrings to return.',
        type: 'Integer',
      },
    ],
    package: 'strings',
    desc:
      'Splits a string after a specified separator and returns an array of `i` substrings. Split substrings include the separator, `t`.',
    example:
      'import "strings"\n\nstrings.splitAfterN(v: "foo, bar, baz, quz", t: ", ", i: 3)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/splitaftern/',
  },
  {
    name: 'strings.splitN',
    args: [
      {
        name: 'v',
        desc: 'String value to split.',
        type: 'String',
      },
      {
        name: 't',
        desc: 'String value that acts as the separator.',
        type: 'String',
      },
      {
        name: 'i',
        desc: 'Maximum number of split substrings to return.',
        type: 'Integer',
      },
    ],
    package: 'strings',
    desc:
      'Splits a string on a specified separator and returns an array of `i` substrings.',
    example:
      'import "strings"\n\nstrings.splitN(v: "foo, bar, baz, quz", t: ", ", i: 3)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/splitn/',
  },
  {
    name: 'strings.strlen',
    args: [
      {
        name: 'v',
        desc: 'String value to measure.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc:
      'Returns the length of a string. String length is determined by the number of UTF code points a string contains.',
    example:
      'import "strings"\n\ndata\n    |> filter(fn: (r) => strings.strlen(v: r._value) <= 6)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/strlen/',
  },
  {
    name: 'strings.substring',
    args: [
      {
        name: 'v',
        desc: 'String value to search for.',
        type: 'String',
      },
      {
        name: 'start',
        desc: 'Starting inclusive index of the substring.',
        type: 'Integer',
      },
      {
        name: 'end',
        desc: 'Ending exclusive index of the substring.',
        type: 'Integer',
      },
    ],
    package: 'strings',
    desc:
      'Returns a substring based on start and end parameters. These parameters are represent indices of UTF code points in the string.',
    example:
      'import "sampledata"\nimport "strings"\n\nsampledata.string()\n    |> map(fn: (r) => ({r with _value: strings.substring(v: r._value, start: 5, end: 9)}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/substring/',
  },
  {
    name: 'strings.title',
    args: [
      {
        name: 'v',
        desc: 'String value to convert.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc: 'Converts a string to title case.',
    example:
      'import "sampledata"\nimport "strings"\n\nsampledata.string()\n    |> map(fn: (r) => ({r with _value: strings.title(v: r._value)}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/title/',
  },
  {
    name: 'strings.toLower',
    args: [
      {
        name: 'v',
        desc: 'String value to convert.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc: 'Converts a string to lowercase.',
    example:
      'import "sampledata"\nimport "strings"\n\nsampledata.string()\n    |> map(fn: (r) => ({r with _value: strings.toLower(v: r._value)}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/tolower/',
  },
  {
    name: 'strings.toTitle',
    args: [
      {
        name: 'v',
        desc: 'String value to convert.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc: 'Converts all characters in a string to title case.',
    example:
      'import "sampledata"\nimport "strings"\n\nsampledata.string()\n    |> map(fn: (r) => ({r with _value: strings.toTitle(v: r._value)}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/totitle/',
  },
  {
    name: 'strings.toUpper',
    args: [
      {
        name: 'v',
        desc: 'String value to convert.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc: 'Converts a string to uppercase.',
    example:
      'import "sampledata"\nimport "strings"\n\nsampledata.string()\n    |> map(fn: (r) => ({r with _value: strings.toUpper(v: r._value)}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/toupper/',
  },
  {
    name: 'strings.trim',
    args: [
      {
        name: 'v',
        desc: 'String to remove characters from.',
        type: 'String',
      },
      {
        name: 'cutset',
        desc: 'Leading and trailing characters to remove from the string.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc:
      'Removes leading and trailing characters specified in the cutset from a string.',
    example:
      'import "strings"\n\ndata\n    |> map(fn: (r) => ({r with _value: strings.trim(v: r._value, cutset: "smpl_")}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/trim/',
  },
  {
    name: 'strings.trimLeft',
    args: [
      {
        name: 'v',
        desc: 'String to to remove characters from.',
        type: 'String',
      },
      {
        name: 'cutset',
        desc: 'Leading characters to trim from the string.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc: 'Removes specified leading characters from a string.',
    example:
      'import "strings"\n\ndata\n    |> map(fn: (r) => ({r with _value: strings.trimLeft(v: r._value, cutset: ".")}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/trimleft/',
  },
  {
    name: 'strings.trimPrefix',
    args: [
      {
        name: 'v',
        desc: 'String to trim.',
        type: 'String',
      },
      {
        name: 'prefix',
        desc: 'Prefix to remove.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc:
      'Removes a prefix from a string. Strings that do not start with the prefix are returned unchanged.',
    example:
      'import "sampledata"\nimport "strings"\n\nsampledata.string()\n    |> map(fn: (r) => ({r with _value: strings.trimPrefix(v: r._value, prefix: "smpl_")}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/trimprefix/',
  },
  {
    name: 'strings.trimRight',
    args: [
      {
        name: 'v',
        desc: 'String to to remove characters from.',
        type: 'String',
      },
      {
        name: 'cutset',
        desc: 'Trailing characters to trim from the string.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc: 'Removes trailing characters specified in the cutset from a string.',
    example:
      'import "strings"\n\ndata\n    |> map(fn: (r) => ({r with _value: strings.trimRight(v: r._value, cutset: ".")}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/trimright/',
  },
  {
    name: 'strings.trimSpace',
    args: [
      {
        name: 'v',
        desc: 'String to remove spaces from.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc: 'Removes leading and trailing spaces from a string.',
    example:
      'import "strings"\n\ndata\n    |> map(fn: (r) => ({r with _value: strings.trimSpace(v: r._value)}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/trimspace/',
  },
  {
    name: 'strings.trimSuffix',
    args: [
      {
        name: 'v',
        desc: 'String to trim.',
        type: 'String',
      },
      {
        name: 'suffix',
        desc: 'Suffix to remove.',
        type: 'String',
      },
    ],
    package: 'strings',
    desc: 'Removes a suffix from a string.',
    example:
      'import "strings"\n\ndata\n    |> map(fn: (r) => ({r with _value: strings.trimSuffix(v: r._value, suffix: "_ex1")}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/strings/trimsuffix/',
  },
  {
    name: 'sum',
    args: [
      {
        name: 'column',
        desc: 'Column to operate on. Default is `_value`.',
        type: 'String',
      },
    ],
    package: '',
    desc: 'Returns the sum of non-null values in a specified column.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> sum()',
    category: 'Aggregates',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/sum/',
  },
  {
    name: 'system.time',
    args: [],
    package: 'system',
    desc: 'Returns the current system time.',
    example:
      'import "array"\nimport "system"\n\narray.from(rows: [{time: system.time()}])',
    category: 'Miscellaneous',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/system/time/',
  },
  {
    name: 'tableFind',
    args: [
      {
        name: 'fn',
        desc: 'Predicate function to evaluate input table group keys.',
        type: 'Function',
      },
    ],
    package: '',
    desc:
      'Extracts the first table in a stream with group key values that match a specified predicate.',
    example:
      'import "sampledata"\n\nt =\n    sampledata.int()\n        |> tableFind(\n            fn: (key) => key.tag == "t2",\n        )',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/tablefind/',
  },
  {
    name: 'tail',
    args: [
      {
        name: 'n',
        desc: 'Maximum number of rows to output.',
        type: 'Integer',
      },
      {
        name: 'offset',
        desc: 'Number of records to skip at the end of a table table before',
        type: 'Integer',
      },
    ],
    package: '',
    desc: 'Limits each output table to the last `n` rows.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> tail(n: 3)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/tail/',
  },
  {
    name: 'testing.assertEmpty',
    args: [],
    package: 'testing',
    desc:
      'Tests if an input stream is empty. If not empty, the function returns an error.',
    example:
      'import "sampledata"\nimport "testing"\n\nwant = sampledata.int()\ngot = sampledata.float() |> toInt()\n\ngot\n    |> testing.diff(want: want)\n    |> testing.assertEmpty()',
    category: 'Tests',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/testing/assertempty/',
  },
  {
    name: 'testing.assertEquals',
    args: [
      {
        name: 'name',
        desc: 'Unique assertion name.',
        type: 'String',
      },
      {
        name: 'got',
        desc: 'Data to test. Default is piped-forward data (`<-`).',
        type: 'Stream of tables',
      },
      {
        name: 'want',
        desc: 'Expected data to test against.',
        type: 'Stream of tables',
      },
    ],
    package: 'testing',
    desc: 'Tests whether two streams of tables are identical.',
    example:
      'import "sampledata"\nimport "testing"\n\nwant = sampledata.int()\ngot = sampledata.float() |> toInt()\n\ntesting.assertEquals(name: "test_equality", got: got, want: want)',
    category: 'Tests',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/testing/assertequals/',
  },
  {
    name: 'testing.diff',
    args: [
      {
        name: 'got',
        desc:
          'Stream containing data to test. Default is piped-forward data (`<-`).',
        type: 'Stream of tables',
      },
      {
        name: 'want',
        desc: 'Stream that contains data to test against.',
        type: 'Stream of tables',
      },
      {
        name: 'epsilon',
        desc:
          'Specify how far apart two float values can be, but still considered equal. Defaults to 0.000000001.',
        type: 'Object',
      },
      {
        name: 'verbose',
        desc: 'Include detailed differences in output. Default is `false`.',
        type: 'Object',
      },
      {
        name: 'nansEqual',
        desc: 'Consider `NaN` float values equal. Default is `false`.',
        type: 'Object',
      },
    ],
    package: 'testing',
    desc: 'Produces a diff between two streams.',
    example:
      'import "sampledata"\nimport "testing"\n\nwant = sampledata.int()\ngot =\n    sampledata.int()\n        |> map(fn: (r) => ({r with _value: if r._value > 15 then r._value + 1 else r._value}))\n\ntesting.diff(got: got, want: want)',
    category: 'Tests',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/testing/diff/',
  },
  {
    name: 'time',
    args: [
      {
        name: 'v',
        desc: 'Value to convert.',
        type: 'String, Integer, UInteger',
      },
    ],
    package: '',
    desc: 'Converts a value to a time type.',
    example: 'time(v: "2021-01-01T00:00:00Z")',
    category: 'Type Conversions',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/time/',
  },
  {
    name: 'timedMovingAverage',
    args: [
      {
        name: 'every',
        desc: 'Frequency of time window.',
        type: 'Duration',
      },
      {
        name: 'period',
        desc: 'Length of each averaged time window.',
        type: 'Duration',
      },
      {
        name: 'column',
        desc: 'Column to operate on. Default is `_value`.',
        type: 'String',
      },
    ],
    package: '',
    desc:
      'Returns the mean of values in a defined time range at a specified frequency.',
    example: 'data\n    |> timedMovingAverage(every: 1y, period: 5y)',
    category: 'Aggregates',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/universe/timedmovingaverage/',
  },
  {
    name: 'timeShift',
    args: [
      {
        name: 'duration',
        desc:
          'Amount of time to add to each time value. May be a negative duration.',
        type: 'String',
      },
      {
        name: 'columns',
        desc:
          'List of time columns to operate on. Default is `["_start", "_stop", "_time"]`.',
        type: 'Array of Strings',
      },
    ],
    package: '',
    desc: 'Adds a fixed duration to time columns.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> timeShift(duration: 12h)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/timeshift/',
  },
  {
    name: 'to',
    args: [
      {
        name: 'bucket',
        desc: 'Name of the bucket to write to.',
        type: 'String',
      },
      {
        name: 'bucketID',
        desc: 'String-encoded bucket ID to to write to.',
        type: 'String',
      },
      {
        name: 'host',
        desc: 'URL of the InfluxDB instance to write to.',
        type: 'String',
      },
      {
        name: 'org',
        desc: 'Organization name.',
        type: 'String',
      },
      {
        name: 'orgID',
        desc: 'String-encoded organization ID to query.',
        type: 'String',
      },
      {
        name: 'token',
        desc: 'InfluxDB API token.',
        type: 'String',
      },
      {
        name: 'timeColumn',
        desc: 'Time column of the output. Default is `"_time"`.',
        type: 'String',
      },
      {
        name: 'measurementColumn',
        desc: 'Measurement column of the output. Default is `"_measurement"`.',
        type: 'String',
      },
      {
        name: 'tagColumns',
        desc: 'Tag columns in the output. Defaults to all columns with type',
        type: 'Array of Strings',
      },
      {
        name: 'fieldFn',
        desc:
          'Function that maps a field key to a field value and returns a record.',
        type: 'Function',
      },
    ],
    package: '',
    desc:
      'Writes data to an InfluxDB Cloud or 2.x bucket and returns the written data.',
    example:
      '// setup and processing omitted\n\n\ndata\n    |> to(\n        bucket: "example-bucket",\n        org: "example-org",\n        token: "mYSuP3rSecR37t0k3N",\n        host: "http://localhost:8086",\n    )',
    category: 'Outputs',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/to/',
  },
  {
    name: 'toBool',
    args: [],
    package: '',
    desc: 'Converts all values in the `_value` column to boolean types.',
    example: 'import "sampledata"\n\nsampledata.numericBool()\n    |> toBool()',
    category: 'Type Conversions',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/tobool/',
  },
  {
    name: 'toFloat',
    args: [],
    package: '',
    desc: 'Converts all values in the `_value` column to float types.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> toFloat()',
    category: 'Type Conversions',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/tofloat/',
  },
  {
    name: 'toInt',
    args: [],
    package: '',
    desc: 'Converts all values in the `_value` column to integer types.',
    example: 'import "sampledata"\n\nsampledata.float()\n    |> toInt()',
    category: 'Type Conversions',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/toint/',
  },
  {
    name: 'toString',
    args: [],
    package: '',
    desc: 'Converts all values in the `_value` column to string types.',
    example: 'import "sampledata"\n\nsampledata.float()\n    |> toString()',
    category: 'Type Conversions',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/tostring/',
  },
  {
    name: 'toTime',
    args: [],
    package: '',
    desc: 'Converts all values in the `_value` column to time types.',
    example: 'data\n    |> toTime()',
    category: 'Type Conversions',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/totime/',
  },
  {
    name: 'toUInt',
    args: [],
    package: '',
    desc:
      'Converts all values in the `_value` column to unsigned integer types.',
    example: 'import "sampledata"\n\nsampledata.float()\n    |> toUInt()',
    category: 'Type Conversions',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/touint/',
  },
  {
    name: 'top',
    args: [
      {
        name: 'n',
        desc: 'Number of rows to return from each input table.',
        type: 'Integer',
      },
      {
        name: 'columns',
        desc: 'List of columns to sort by. Default is `["_value"]`.',
        type: 'Array of Strings',
      },
    ],
    package: '',
    desc:
      'Sorts each input table by specified columns and keeps the top `n` records in each table.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> top(n: 3)',
    category: 'Selectors',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/top/',
  },
  {
    name: 'tripleEMA',
    args: [
      {
        name: 'n',
        desc: 'Number of points to use in the calculation.',
        type: 'Integer',
      },
    ],
    package: '',
    desc:
      'Returns the triple exponential moving average (TEMA) of values in the `_value` column.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> tripleEMA(n: 3)',
    category: 'Aggregates',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/tripleema/',
  },
  {
    name: 'tripleExponentialDerivative',
    args: [
      {
        name: 'n',
        desc: 'Number of points to use in the calculation.',
        type: 'Integer',
      },
    ],
    package: '',
    desc:
      'Returns the triple exponential derivative (TRIX) values using `n` points.',
    example:
      'import "sampledata"\n\nsampledata.float()\n    |> tripleExponentialDerivative(n: 2)',
    category: 'Aggregates',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/universe/tripleexponentialderivative/',
  },
  {
    name: 'truncateTimeColumn',
    args: [
      {
        name: 'unit',
        desc: 'Unit of time to truncate to.',
        type: 'Duration',
      },
      {
        name: 'timeColumn',
        desc: 'Time column to truncate. Default is `_time`.',
        type: 'Object',
      },
    ],
    package: '',
    desc: 'Truncates all input time values in the `_time` to a specified unit.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> truncateTimeColumn(unit: 1m)',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/universe/truncatetimecolumn/',
  },
  {
    name: 'uint',
    args: [
      {
        name: 'v',
        desc: 'Value to convert.',
        type: 'String, Integer, Boolean',
      },
    ],
    package: '',
    desc: 'Converts a value to an unsigned integer type.',
    example:
      'uint(v: "3")\n\nuint(v: 1m)\n\nuint(v: 2022-01-01T00:00:00Z)\n\nuint(v: 10.12)\n\nuint(v: -100)',
    category: 'Type Conversions',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/uint/',
  },
  {
    name: 'union',
    args: [
      {
        name: 'tables',
        desc: 'List of two or more streams of tables to union together.',
        type: 'Array of Strings',
      },
    ],
    package: '',
    desc: 'Merges two or more input streams into a single output stream.',
    example: '// setup and processing omitted\n\nunion(tables: [t1, t2])',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/union/',
  },
  {
    name: 'unique',
    args: [
      {
        name: 'column',
        desc: 'Column to search for unique values. Default is `_value`.',
        type: 'String',
      },
    ],
    package: '',
    desc: 'Returns all records containing unique values in a specified column.',
    example: 'import "sampledata"\n\nsampledata.int()\n    |> unique()',
    category: 'Selectors',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/unique/',
  },
  {
    name: 'v1.fieldsAsCols',
    args: [],
    package: 'influxdata/influxdb/v1',
    desc:
      'Is a special application of `pivot()` that pivots input data on `_field` and `_time` columns to align fields within each input table that have the same timestamp.',
    example:
      'import "influxdata/influxdb/v1"\n\ndata\n    |> v1.fieldsAsCols()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/v1/fieldsascols/',
  },
  {
    name: 'v1.measurementTagKeys',
    args: [
      {
        name: 'bucket',
        desc: 'Bucket to return tag keys from for a specific measurement.',
        type: 'String',
      },
      {
        name: 'measurement',
        desc: 'Measurement to return tag keys from.',
        type: 'String',
      },
      {
        name: 'start',
        desc: 'Oldest time to include in results. Default is `-30d`.',
        type: 'Object',
      },
      {
        name: 'stop',
        desc: 'Newest time include in results.',
        type: 'Object',
      },
    ],
    package: 'influxdata/influxdb/v1',
    desc: 'Returns the list of tag keys for a specific measurement.',
    example: 'import "influxdata/influxdb/schema"',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/v1/measurementtagkeys/',
  },
  {
    name: 'v1.measurementTagValues',
    args: [
      {
        name: 'bucket',
        desc: 'Bucket to return tag values from for a specific measurement.',
        type: 'String',
      },
      {
        name: 'measurement',
        desc: 'Measurement to return tag values from.',
        type: 'String',
      },
      {
        name: 'tag',
        desc: 'Tag to return all unique values from.',
        type: 'String',
      },
      {
        name: 'start',
        desc: 'Oldest time to include in results. Default is `-30d`.',
        type: 'Object',
      },
      {
        name: 'stop',
        desc: 'Newest time include in results.',
        type: 'Object',
      },
    ],
    package: 'influxdata/influxdb/v1',
    desc: 'Returns a list of tag values for a specific measurement.',
    example: 'import "influxdata/influxdb/schema"',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/v1/measurementtagvalues/',
  },
  {
    name: 'v1.measurements',
    args: [
      {
        name: 'bucket',
        desc: 'Bucket to retrieve measurements from.',
        type: 'String',
      },
      {
        name: 'start',
        desc: 'Oldest time to include in results. Default is `-30d`.',
        type: 'Object',
      },
      {
        name: 'stop',
        desc: 'Newest time include in results.',
        type: 'Object',
      },
    ],
    package: 'influxdata/influxdb/v1',
    desc: 'Returns a list of measurements in a specific bucket.',
    example: 'import "influxdata/influxdb/schema"',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/v1/measurements/',
  },
  {
    name: 'v1.tagKeys',
    args: [
      {
        name: 'bucket',
        desc: 'Bucket to return tag keys from.',
        type: 'String',
      },
      {
        name: 'predicate',
        desc: 'Predicate function that filters tag keys.',
        type: 'Function',
      },
      {
        name: 'start',
        desc: 'Oldest time to include in results. Default is `-30d`.',
        type: 'Duration | Time',
      },
      {
        name: 'stop',
        desc: 'Newest time include in results.',
        type: 'Object',
      },
    ],
    package: 'influxdata/influxdb/v1',
    desc:
      'Returns a list of tag keys for all series that match the `predicate`.',
    example:
      'import "influxdata/influxdb/v1"\n\nv1.tagKeys(bucket: "example-bucket")',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/v1/tagkeys/',
  },
  {
    name: 'v1.tagValues',
    args: [
      {
        name: 'bucket',
        desc: 'Bucket to return unique tag values from.',
        type: 'String',
      },
      {
        name: 'tag',
        desc: 'Tag to return unique values from.',
        type: 'String',
      },
      {
        name: 'predicate',
        desc: 'Predicate function that filters tag values.',
        type: 'Function',
      },
      {
        name: 'start',
        desc: 'Oldest time to include in results. Default is `-30d`.',
        type: 'Duration | Time',
      },
      {
        name: 'stop',
        desc: 'Newest time include in results.',
        type: 'Object',
      },
    ],
    package: 'influxdata/influxdb/v1',
    desc: 'Returns a list of unique values for a given tag.',
    example:
      'import "influxdata/influxdb/v1"\n\nv1.tagValues(bucket: "example-bucket", tag: "host")',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/v1/tagvalues/',
  },
  {
    name: 'window',
    args: [
      {
        name: 'every',
        desc: 'Duration of time between windows.',
        type: 'Duration',
      },
      {
        name: 'period',
        desc: 'Duration of windows. Default is the `every` value.',
        type: 'Duration',
      },
      {
        name: 'offset',
        desc: 'Duration to shift the window boundaries by. Default is `0s`.',
        type: 'Duration',
      },
      {
        name: 'location',
        desc:
          'Location used to determine timezone. Default is the `location` option.',
        type: 'Object',
      },
      {
        name: 'timeColumn',
        desc: 'Column that contains time values. Default is `_time`.',
        type: 'String',
      },
      {
        name: 'startColumn',
        desc: 'Column to store the window start time in. Default is `_start`.',
        type: 'String',
      },
      {
        name: 'stopColumn',
        desc: 'Column to store the window stop time in. Default is `_stop`.',
        type: 'String',
      },
      {
        name: 'createEmpty',
        desc: 'Create empty tables for empty window. Default is `false`.',
        type: 'Boolean',
      },
    ],
    package: '',
    desc: 'Groups records using regular time intervals.',
    example: 'data\n    |> window(every: 30s)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/window/',
  },
  {
    name: 'yield',
    args: [
      {
        name: 'name',
        desc: 'Unique name for the yielded results. Default is `_results`.',
        type: 'String',
      },
    ],
    package: '',
    desc: 'Delivers input data as a result of the query.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> yield(name: "unmodified")\n    |> map(fn: (r) => ({r with _value: r._value * r._value}))\n    |> yield(name: "squared")',
    category: 'Outputs',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/yield/',
  },
  {
    name: 'alerta.alert',
    args: [
      {
        name: 'url',
        desc: '(Required) Alerta URL.',
        type: 'String',
      },
      {
        name: 'apiKey',
        desc: '(Required) Alerta API key.',
        type: 'String',
      },
      {
        name: 'resource',
        desc: '(Required) Resource associated with the alert.',
        type: 'Object',
      },
      {
        name: 'event',
        desc: '(Required) Event name.',
        type: 'Object',
      },
      {
        name: 'environment',
        desc:
          'Alerta environment. Valid values: "Production", "Development" or empty string (default).',
        type: 'Object',
      },
      {
        name: 'severity',
        desc:
          '(Required) Event severity. See Alerta severities (https://docs.alerta.io/en/latest/api/alert.html#alert-severities).',
        type: 'Object',
      },
      {
        name: 'service',
        desc: 'List of affected services. Default is `[]`.',
        type: 'Object',
      },
      {
        name: 'group',
        desc: 'Alerta event group. Default is `""`.',
        type: 'Object',
      },
      {
        name: 'value',
        desc: 'Event value. Default is `""`.',
        type: 'Object',
      },
      {
        name: 'text',
        desc: 'Alerta text description. Default is `""`.',
        type: 'Object',
      },
      {
        name: 'tags',
        desc: 'List of event tags. Default is `[]`.',
        type: 'Object',
      },
      {
        name: 'attributes',
        desc: '(Required) Alert attributes.',
        type: 'Object',
      },
      {
        name: 'origin',
        desc: 'monitoring component.',
        type: 'Object',
      },
      {
        name: 'type',
        desc: 'Event type. Default is `""`.',
        type: 'Object',
      },
      {
        name: 'timestamp',
        desc: 'time alert was generated. Default is `now()`.',
        type: 'Object',
      },
    ],
    package: 'contrib/bonitoo-io/alerta',
    desc: 'Sends an alert to Alerta (https://alerta.io/).',
    example:
      'import "contrib/bonitoo-io/alerta"\n\n// setup and processing omitted\n\nalerta.alert(\n    url: "https://alerta.io:8080/alert",\n    apiKey: apiKey,\n    resource: "example-resource",\n    event: "Example event",\n    environment: "Production",\n    severity: severity,\n    service: ["example-service"],\n    group: "example-group",\n    value: string(v: lastReported._value),\n    text: "Service is ${severity}. The last reported value was ${string(v: lastReported._value)}.",\n    tags: ["ex1", "ex2"],\n    attributes: {},\n    origin: "InfluxDB",\n    type: "exampleAlertType",\n    timestamp: now(),\n)',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/bonitoo-io/alerta/alert/',
  },
  {
    name: 'alerta.endpoint',
    args: [
      {
        name: 'url',
        desc: '(Required) Alerta URL.',
        type: 'String',
      },
      {
        name: 'apiKey',
        desc: '(Required) Alerta API key.',
        type: 'String',
      },
      {
        name: 'environment',
        desc: 'Alert environment. Default is `""`.',
        type: 'Object',
      },
      {
        name: 'origin',
        desc: 'Alert origin. Default is `"InfluxDB"`.',
        type: 'Object',
      },
    ],
    package: 'contrib/bonitoo-io/alerta',
    desc: 'Sends alerts to Alerta using data from input rows.',
    example:
      'import "contrib/bonitoo-io/alerta"\n\n// setup and processing omitted\n\n    alerta.endpoint(\n        url: "https://alerta.io:8080/alert",\n        apiKey: apiKey,\n        environment: "Production",\n        origin: "InfluxDB",\n    )',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/bonitoo-io/alerta/endpoint/',
  },
  {
    name: 'anomalydetection.mad',
    args: [
      {
        name: 'threshold',
        desc: 'Deviation threshold for anomalies.',
        type: 'Object',
      },
      {
        name: 'table',
        desc: 'Input data. Default is piped-forward data (`<-`).',
        type: 'Stream of tables',
      },
    ],
    package: 'contrib/anaisdg/anomalydetection',
    desc:
      'Uses the median absolute deviation (MAD) algorithm to detect anomalies in a data set.',
    example:
      'import "contrib/anaisdg/anomalydetection"\nimport "sampledata"\n\nsampledata.float()\n    |> anomalydetection.mad(threshold: 1.0)',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/anaisdg/anomalydetection/mad/',
  },
  {
    name: 'array.concat',
    args: [
      {
        name: 'arr',
        desc: 'First array. Default is the piped-forward array (`<-`).',
        type: 'Array',
      },
      {
        name: 'v',
        desc: 'Array to append to the first array.',
        type: 'Array',
      },
    ],
    package: 'array',
    desc: 'Appends two arrays and returns a new array.',
    example:
      'import "array"\n\na = [1, 2, 3]\nb = [4, 5, 6]\n\nc = a |> array.concat(v: b)\n\narray.from(rows: c |> array.map(fn: (x) => ({_value: x})))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/array/concat/',
  },
  {
    name: 'array.filter',
    args: [
      {
        name: 'arr',
        desc: 'Array to filter. Default is the piped-forward array (`<-`).',
        type: 'Array',
      },
      {
        name: 'fn',
        desc: 'Predicate function to evaluate on each element.',
        type: 'Function',
      },
    ],
    package: 'array',
    desc:
      'Iterates over an array, evaluates each element with a predicate function, and then returns a new array with only elements that match the predicate.',
    example:
      'import "array"\n\na = [\n    1,\n    2,\n    3,\n    4,\n    5,\n]\nb = a |> array.filter(fn: (x) => x >= 3)\n\narray.from(rows: b |> array.map(fn: (x) => ({_value: x})))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/array/filter/',
  },
  {
    name: 'array.from',
    args: [
      {
        name: 'rows',
        desc:
          'Array of records to construct a table with. Default is the piped-forward array (`<-`).',
        type: 'Array',
      },
    ],
    package: 'array',
    desc: 'Constructs a table from an array of records.',
    example:
      'import "array"\n\nrows = [{foo: "bar", baz: 21.2}, {foo: "bar", baz: 23.8}]\n\narray.from(rows: rows)',
    category: 'Inputs',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/array/from/',
  },
  {
    name: 'array.map',
    args: [
      {
        name: 'arr',
        desc:
          'Array to operate on. Defaults is the piped-forward array (`<-`).',
        type: 'Array',
      },
      {
        name: 'fn',
        desc:
          'Function to apply to elements. The element is represented by `x` in the function.',
        type: 'Function',
      },
    ],
    package: 'array',
    desc:
      'Iterates over an array, applies a function to each element to produce a new element, and then returns a new array.',
    example:
      'import "array"\n\na = [\n    1,\n    2,\n    3,\n    4,\n    5,\n]\nb = a |> array.map(fn: (x) => ({_value: x}))\n\narray.from(rows: b)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/array/map/',
  },
  {
    name: 'array.toBool',
    args: [
      {
        name: 'arr',
        desc:
          'Array of values to convert. Default is the piped-forward array (`<-`).',
        type: 'Array',
      },
    ],
    package: 'experimental/array',
    desc: 'Converts all values in an array to booleans.',
    example:
      'import "experimental/array"\n\narr = [\n    1,\n    1,\n    0,\n    1,\n    0,\n]\n\narray.toBool(arr: arr)',
    category: 'Type Conversions',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/array/tobool/',
  },
  {
    name: 'array.toDuration',
    args: [
      {
        name: 'arr',
        desc:
          'Array of values to convert. Default is the piped-forward array (`<-`).',
        type: 'Array',
      },
    ],
    package: 'experimental/array',
    desc: 'Converts all values in an array to durations.',
    example:
      'import "experimental/array"\n\narr = [80000000000, 56000000000, 132000000000]\n\narray.toDuration(arr: arr)',
    category: 'Type Conversions',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/array/toduration/',
  },
  {
    name: 'array.toFloat',
    args: [
      {
        name: 'arr',
        desc:
          'Array of values to convert. Default is the piped-forward array (`<-`).',
        type: 'Array',
      },
    ],
    package: 'experimental/array',
    desc: 'Converts all values in an array to floats.',
    example:
      'import "experimental/array"\n\narr = [12, 24, 36, 48]\n\narray.toFloat(arr: arr)',
    category: 'Type Conversions',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/array/tofloat/',
  },
  {
    name: 'array.toInt',
    args: [
      {
        name: 'arr',
        desc:
          'Array of values to convert. Default is the piped-forward array (`<-`).',
        type: 'Array',
      },
    ],
    package: 'experimental/array',
    desc: 'Converts all values in an array to integers.',
    example:
      'import "experimental/array"\n\narr = [12.1, 24.2, 36.3, 48.4]\n\narray.toInt(arr: arr)',
    category: 'Type Conversions',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/array/toint/',
  },
  {
    name: 'array.toString',
    args: [
      {
        name: 'arr',
        desc:
          'Array of values to convert. Default is the piped-forward array (`<-`).',
        type: 'Array',
      },
    ],
    package: 'experimental/array',
    desc: 'Converts all values in an array to strings.',
    example:
      'import "experimental/array"\n\narr = [12.0, 1.2300, NaN, 24.2]\n\narray.toString(arr: arr)',
    category: 'Type Conversions',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/array/tostring/',
  },
  {
    name: 'array.toTime',
    args: [
      {
        name: 'arr',
        desc:
          'Array of values to convert. Default is the piped-forward array (`<-`).',
        type: 'Array',
      },
    ],
    package: 'experimental/array',
    desc: 'Converts all values in an array to times.',
    example:
      'import "experimental/array"\n\narr = [1640995200000000000, 1643673600000000000, 1646092800000000000]\n\narray.toTime(arr: arr)',
    category: 'Type Conversions',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/array/totime/',
  },
  {
    name: 'array.toUInt',
    args: [
      {
        name: 'arr',
        desc:
          'Array of values to convert. Default is the piped-forward array (`<-`).',
        type: 'Array',
      },
    ],
    package: 'experimental/array',
    desc: 'Converts all values in an array to unsigned integers.',
    example: 'import "experimental/array"',
    category: 'Type Conversions',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/array/touint/',
  },
  {
    name: 'bigpanda.endpoint',
    args: [
      {
        name: 'url',
        desc:
          'BigPanda alerts API URL (https://docs.bigpanda.io/reference#alerts-how-it-works).',
        type: 'String',
      },
      {
        name: 'token',
        desc:
          'BigPanda API Authorization token (API key) (https://docs.bigpanda.io/docs/api-key-management).',
        type: 'String',
      },
      {
        name: 'appKey',
        desc:
          'BigPanda App Key (https://docs.bigpanda.io/reference#integrating-monitoring-systems).',
        type: 'Object',
      },
    ],
    package: 'contrib/rhajek/bigpanda',
    desc: 'Sends alerts to BigPanda using data from input rows.',
    example:
      'import "contrib/rhajek/bigpanda"\n\n// setup and processing omitted\n\nendpoint = bigpanda.endpoint(token: token, appKey: "example-app-key")',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/rhajek/bigpanda/endpoint/',
  },
  {
    name: 'bigpanda.sendAlert',
    args: [
      {
        name: 'url',
        desc:
          'BigPanda alerts API URL (https://docs.bigpanda.io/reference#alerts-how-it-works).',
        type: 'String',
      },
      {
        name: 'token',
        desc:
          'BigPanda API Authorization token (API key) (https://docs.bigpanda.io/docs/api-key-management).',
        type: 'String',
      },
      {
        name: 'appKey',
        desc:
          'BigPanda App Key (https://docs.bigpanda.io/reference#integrating-monitoring-systems).',
        type: 'Object',
      },
      {
        name: 'status',
        desc:
          'BigPanda alert status (https://docs.bigpanda.io/reference#alerts).',
        type: 'Object',
      },
      {
        name: 'rec',
        desc:
          'Additional alert parameters (https://docs.bigpanda.io/reference#alert-object) to send to the BigPanda alert API.',
        type: 'Object',
      },
    ],
    package: 'contrib/rhajek/bigpanda',
    desc: 'Sends an alert to BigPanda (https://www.bigpanda.io/).',
    example:
      'import "contrib/rhajek/bigpanda"\nimport "json"\n\n// setup and processing omitted\n\nbigpanda.sendAlert(\n    token: token,\n    appKey: "example-app-key",\n    status: bigpanda.statusFromLevel(level: "${lastReported.status}"),\n    rec: {\n        tags: json.encode(v: [{"name": "host", "value": "my-host"}]),\n        check: "my-check",\n        description: "${lastReported._field} is ${lastReported.status}: ${string(\n                v: lastReported._value,\n            )}",\n    },\n)',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/rhajek/bigpanda/sendalert/',
  },
  {
    name: 'bigpanda.statusFromLevel',
    args: [
      {
        name: 'level',
        desc: 'Alert level.',
        type: 'String',
      },
    ],
    package: 'contrib/rhajek/bigpanda',
    desc: 'Converts an alert level to a BigPanda status.',
    example:
      'import "contrib/rhajek/bigpanda"\n\nbigpanda.statusFromLevel(level: "crit")',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/rhajek/bigpanda/statusfromlevel/',
  },
  {
    name: 'bitwise.sand',
    args: [
      {
        name: 'a',
        desc: 'Left hand operand.',
        type: 'Integer',
      },
      {
        name: 'b',
        desc: 'Right hand operand.',
        type: 'Integer',
      },
    ],
    package: 'bitwise',
    desc: 'Performs the bitwise operation, `a AND b`, with integers.',
    example: 'import "bitwise"\n\nbitwise.sand(a: 1234, b: 4567)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/bitwise/sand/',
  },
  {
    name: 'bitwise.sclear',
    args: [
      {
        name: 'a',
        desc: 'Left hand operand.',
        type: 'Integer',
      },
      {
        name: 'b',
        desc: 'Bits to clear.',
        type: 'Integer',
      },
    ],
    package: 'bitwise',
    desc:
      'Performs the bitwise operation `a AND NOT b`. Both `a` and `b` are integers.',
    example: 'import "bitwise"\n\nbitwise.sclear(a: 1234, b: 4567)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/bitwise/sclear/',
  },
  {
    name: 'bitwise.slshift',
    args: [
      {
        name: 'a',
        desc: 'Left hand operand.',
        type: 'Integer',
      },
      {
        name: 'b',
        desc: 'Number of bits to shift.',
        type: 'Integer',
      },
    ],
    package: 'bitwise',
    desc:
      'Shifts the bits in `a` left by `b` bits. Both `a` and `b` are integers.',
    example: 'import "bitwise"\n\nbitwise.slshift(a: 1234, b: 2)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/bitwise/slshift/',
  },
  {
    name: 'bitwise.snot',
    args: [
      {
        name: 'a',
        desc: 'Integer to invert.',
        type: 'Integer',
      },
    ],
    package: 'bitwise',
    desc: 'Inverts every bit in `a`, an integer.',
    example: 'import "bitwise"\n\nbitwise.snot(a: 1234)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/bitwise/snot/',
  },
  {
    name: 'bitwise.sor',
    args: [
      {
        name: 'a',
        desc: 'Left hand operand.',
        type: 'Integer',
      },
      {
        name: 'b',
        desc: 'Right hand operand.',
        type: 'Integer',
      },
    ],
    package: 'bitwise',
    desc: 'Performs the bitwise operation, `a OR b`, with integers.',
    example: 'import "bitwise"\n\nbitwise.sor(a: 1234, b: 4567)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/bitwise/sor/',
  },
  {
    name: 'bitwise.srshift',
    args: [
      {
        name: 'a',
        desc: 'Left hand operand.',
        type: 'Integer',
      },
      {
        name: 'b',
        desc: 'Number of bits to shift.',
        type: 'Integer',
      },
    ],
    package: 'bitwise',
    desc:
      'Shifts the bits in `a` right by `b` bits. Both `a` and `b` are integers.',
    example: 'import "bitwise"\n\nbitwise.srshift(a: 1234, b: 2)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/bitwise/srshift/',
  },
  {
    name: 'bitwise.sxor',
    args: [
      {
        name: 'a',
        desc: 'Left hand operand.',
        type: 'Integer',
      },
      {
        name: 'b',
        desc: 'Right hand operand.',
        type: 'Integer',
      },
    ],
    package: 'bitwise',
    desc: 'Performs the bitwise operation, `a XOR b`, with integers.',
    example: 'import "bitwise"\n\nbitwise.sxor(a: 1234, b: 4567)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/bitwise/sxor/',
  },
  {
    name: 'bitwise.uand',
    args: [
      {
        name: 'a',
        desc: 'Left hand operand.',
        type: 'UInteger',
      },
      {
        name: 'b',
        desc: 'Right hand operand.',
        type: 'UInteger',
      },
    ],
    package: 'bitwise',
    desc: 'Performs the bitwise operation, `a AND b`, with unsigned integers.',
    example:
      'import "bitwise"\n\nbitwise.uand(a: uint(v: 1234), b: uint(v: 4567))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/bitwise/uand/',
  },
  {
    name: 'bitwise.uclear',
    args: [
      {
        name: 'a',
        desc: 'Left hand operand.',
        type: 'UInteger',
      },
      {
        name: 'b',
        desc: 'Bits to clear.',
        type: 'UInteger',
      },
    ],
    package: 'bitwise',
    desc:
      'Performs the bitwise operation `a AND NOT b`, with unsigned integers.',
    example:
      'import "bitwise"\n\nbitwise.uclear(a: uint(v: 1234), b: uint(v: 4567))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/bitwise/uclear/',
  },
  {
    name: 'bitwise.ulshift',
    args: [
      {
        name: 'a',
        desc: 'Left hand operand.',
        type: 'UInteger',
      },
      {
        name: 'b',
        desc: 'Number of bits to shift.',
        type: 'UInteger',
      },
    ],
    package: 'bitwise',
    desc:
      'Shifts the bits in `a` left by `b` bits. Both `a` and `b` are unsigned integers.',
    example:
      'import "bitwise"\n\nbitwise.ulshift(a: uint(v: 1234), b: uint(v: 2))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/bitwise/ulshift/',
  },
  {
    name: 'bitwise.unot',
    args: [
      {
        name: 'a',
        desc: 'Unsigned integer to invert.',
        type: 'UInteger',
      },
    ],
    package: 'bitwise',
    desc: 'Inverts every bit in `a`, an unsigned integer.',
    example: 'import "bitwise"\n\nbitwise.unot(a: uint(v: 1234))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/bitwise/unot/',
  },
  {
    name: 'bitwise.uor',
    args: [
      {
        name: 'a',
        desc: 'Left hand operand.',
        type: 'UInteger',
      },
      {
        name: 'b',
        desc: 'Right hand operand.',
        type: 'UInteger',
      },
    ],
    package: 'bitwise',
    desc: 'Performs the bitwise operation, `a OR b`, with unsigned integers.',
    example:
      'import "bitwise"\n\nbitwise.uor(a: uint(v: 1234), b: uint(v: 4567))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/bitwise/uor/',
  },
  {
    name: 'bitwise.urshift',
    args: [
      {
        name: 'a',
        desc: 'Left hand operand.',
        type: 'UInteger',
      },
      {
        name: 'b',
        desc: 'Number of bits to shift.',
        type: 'UInteger',
      },
    ],
    package: 'bitwise',
    desc:
      'Shifts the bits in `a` right by `b` bits. Both `a` and `b` are unsigned integers.',
    example:
      'import "bitwise"\n\nbitwise.urshift(a: uint(v: 1234), b: uint(v: 2))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/bitwise/urshift/',
  },
  {
    name: 'bitwise.uxor',
    args: [
      {
        name: 'a',
        desc: 'Left hand operand.',
        type: 'UInteger',
      },
      {
        name: 'b',
        desc: 'Right hand operand.',
        type: 'UInteger',
      },
    ],
    package: 'bitwise',
    desc: 'Performs the bitwise operation, `a XOR b`, with unsigned integers.',
    example:
      'import "bitwise"\n\nbitwise.uxor(a: uint(v: 1234), b: uint(v: 4567))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/bitwise/uxor/',
  },
  {
    name: 'boundaries.friday',
    args: [],
    package: 'experimental/date/boundaries',
    desc:
      'Returns a record with `start` and `stop` boundary timestamps for last Friday.',
    example:
      'import "experimental/date/boundaries"\n\noption location = timezone.fixed(offset: -8h)\noption now = () => 2021-12-30T00:40:44Z\n\nboundaries.friday()',
    category: 'Date/time',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/date/boundaries/friday/',
  },
  {
    name: 'boundaries.monday',
    args: [],
    package: 'experimental/date/boundaries',
    desc:
      'Returns a record with `start` and `stop` boundary timestamps of last Monday. Last Monday is relative to `now()`. If today is Monday, the function returns boundaries for the previous Monday.',
    example:
      'import "experimental/date/boundaries"\n\noption location = timezone.fixed(offset: -8h)\noption now = () => 2021-12-30T00:40:44Z\n\nboundaries.monday()',
    category: 'Date/time',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/date/boundaries/monday/',
  },
  {
    name: 'boundaries.month',
    args: [
      {
        name: 'month_offset',
        desc:
          'Number of months to offset from the current month. Default is `0`.',
        type: 'Integer',
      },
    ],
    package: 'experimental/date/boundaries',
    desc:
      'Returns a record with `start` and `stop` boundary timestamps for the current month.',
    example:
      'import "experimental/date/boundaries"\n\noption now = () => 2022-05-10T10:10:00Z\n\nboundaries.month(\n\n)',
    category: 'Date/time',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/date/boundaries/month/',
  },
  {
    name: 'boundaries.saturday',
    args: [],
    package: 'experimental/date/boundaries',
    desc:
      'Returns a record with `start` and `stop` boundary timestamps for last Saturday.',
    example:
      'import "experimental/date/boundaries"\n\noption location = timezone.fixed(offset: -8h)\noption now = () => 2021-12-30T00:40:44Z\n\nboundaries.saturday()',
    category: 'Date/time',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/date/boundaries/saturday/',
  },
  {
    name: 'boundaries.sunday',
    args: [],
    package: 'experimental/date/boundaries',
    desc:
      'Returns a record with `start` and `stop` boundary timestamps for last Sunday.',
    example:
      'import "experimental/date/boundaries"\n\noption location = timezone.fixed(offset: -8h)\noption now = () => 2021-12-30T00:40:44Z\n\nboundaries.sunday()',
    category: 'Date/time',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/date/boundaries/sunday/',
  },
  {
    name: 'boundaries.thursday',
    args: [],
    package: 'experimental/date/boundaries',
    desc:
      'Returns a record with `start` and `stop` boundary timestamps for last Thursday.',
    example:
      'import "experimental/date/boundaries"\n\noption location = timezone.fixed(offset: -8h)\noption now = () => 2021-12-30T00:40:44Z\n\nboundaries.thursday()',
    category: 'Date/time',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/date/boundaries/thursday/',
  },
  {
    name: 'boundaries.tuesday',
    args: [],
    package: 'experimental/date/boundaries',
    desc:
      'Returns a record with `start` and `stop` boundary timestamps of last Tuesday.',
    example:
      'import "experimental/date/boundaries"\n\noption location = timezone.fixed(offset: -8h)\noption now = () => 2021-12-30T00:40:44Z\n\nboundaries.tuesday()',
    category: 'Date/time',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/date/boundaries/tuesday/',
  },
  {
    name: 'boundaries.wednesday',
    args: [],
    package: 'experimental/date/boundaries',
    desc:
      'Returns a record with `start` and `stop` boundary timestamps for last Wednesday.',
    example:
      'import "experimental/date/boundaries"\n\nday = boundaries.wednesday()\n\nfrom(bucket: "example-bucket")\n    |> range(start: day.start, stop: day.stop)',
    category: 'Date/time',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/date/boundaries/wednesday/',
  },
  {
    name: 'boundaries.week',
    args: [
      {
        name: 'start_sunday',
        desc: 'Indicate if the week starts on Sunday. Default is `false`.',
        type: 'Boolean',
      },
      {
        name: 'week_offset',
        desc:
          'Number of weeks to offset from the current week. Default is `0`.',
        type: 'Integer',
      },
    ],
    package: 'experimental/date/boundaries',
    desc:
      'Returns a record with `start` and `stop` boundary timestamps of the current week. By default, weeks start on Monday.',
    example:
      'import "experimental/date/boundaries"\n\noption now = () => 2022-05-10T00:00:00.00001Z\n\nboundaries.week(\n\n)',
    category: 'Date/time',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/date/boundaries/week/',
  },
  {
    name: 'boundaries.yesterday',
    args: [],
    package: 'experimental/date/boundaries',
    desc:
      'Returns a record with `start` and `stop` boundary timestamps for yesterday.',
    example:
      'import "experimental/date/boundaries"\n\noption now = () => 2022-01-02T13:45:28Z\n\nboundaries.yesterday(\n\n)',
    category: 'Date/time',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/date/boundaries/yesterday/',
  },
  {
    name: 'buckets',
    args: [
      {
        name: 'org',
        desc: 'Organization name. Default is the current organization.',
        type: 'String',
      },
      {
        name: 'orgID',
        desc: 'Organization ID. Default is the ID of the current organization.',
        type: 'String',
      },
      {
        name: 'host',
        desc: 'URL of the InfluxDB instance.',
        type: 'String',
      },
      {
        name: 'token',
        desc: 'InfluxDB API token.',
        type: 'String',
      },
    ],
    package: 'influxdata/influxdb',
    desc: 'Returns a list of buckets in the specified organization.',
    example:
      'import "influxdata/influxdb"\n\nbuckets(org: "example-org", host: "http://localhost:8086", token: "mYSuP3rSecR37t0k3N")',
    category: 'Metadata',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/buckets/',
  },
  {
    name: 'clickhouse.query',
    args: [
      {
        name: 'url',
        desc: 'ClickHouse HTTP API URL. Default is `http://127.0.0.1:8123`.',
        type: 'String',
      },
      {
        name: 'query',
        desc: 'ClickHouse query to execute.',
        type: 'String',
      },
      {
        name: 'limit',
        desc: 'Query rows limit. Defaults is `100`.',
        type: 'Object',
      },
      {
        name: 'cors',
        desc: 'Request remote CORS headers. Defaults is `1`.',
        type: 'String',
      },
      {
        name: 'max_bytes',
        desc: 'Query bytes limit. Default is `10000000`.',
        type: 'Object',
      },
      {
        name: 'format',
        desc: 'Query format. Default is `CSVWithNames`.',
        type: 'String',
      },
    ],
    package: 'contrib/qxip/clickhouse',
    desc: 'Queries data from ClickHouse using specified parameters.',
    example:
      'import "contrib/qxip/clickhouse"\n\noption clickhouse.defaultURL = "https://play@play.clickhouse.com"\n\nclickhouse.query(query: "SELECT version()")',
    category: 'Inputs',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/qxip/clickhouse/query/',
  },
  {
    name: 'date.add',
    args: [
      {
        name: 'd',
        desc: 'Duration to add.',
        type: 'Duration',
      },
      {
        name: 'to',
        desc: 'Time to add the duration to.',
        type: 'Object',
      },
      {
        name: 'location',
        desc: 'Location to use for the time value.',
        type: 'Object',
      },
    ],
    package: 'date',
    desc:
      'Adds a duration to a time value and returns the resulting time value.',
    example: 'import "date"\n\ndate.add(d: 6h, to: 2019-09-16T12:00:00Z)',
    category: 'Date/time',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/date/add/',
  },
  {
    name: 'date.scale',
    args: [
      {
        name: 'd',
        desc: 'Duration to scale.',
        type: 'Duration',
      },
      {
        name: 'n',
        desc: 'Amount to scale the duration by.',
        type: 'Integer',
      },
    ],
    package: 'date',
    desc: 'Will multiply the duration by the given value.',
    example:
      'import "date"\n\nn = 5\nd = date.scale(d: 1h, n: n)\n\ndate.add(d: d, to: 2022-05-10T00:00:00Z)',
    category: 'Date/time',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/date/scale/',
  },
  {
    name: 'date.sub',
    args: [
      {
        name: 'from',
        desc: 'Time to subtract the duration from.',
        type: 'Object',
      },
      {
        name: 'd',
        desc: 'Duration to subtract.',
        type: 'Duration',
      },
      {
        name: 'location',
        desc: 'Location to use for the time value.',
        type: 'Object',
      },
    ],
    package: 'date',
    desc:
      'Subtracts a duration from a time value and returns the resulting time value.',
    example: 'import "date"\n\ndate.sub(from: 2019-09-16T12:00:00Z, d: 6h)',
    category: 'Date/time',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/date/sub/',
  },
  {
    name: 'date.time',
    args: [
      {
        name: 't',
        desc: 'Duration or time value.',
        type: 'Object',
      },
      {
        name: 'location',
        desc: 'Location used to determine timezone.',
        type: 'Object',
      },
    ],
    package: 'date',
    desc: 'Returns the time value of a specified relative duration or time.',
    example: 'import "date"\n\ndate.time(t: 2020-02-11T12:21:03.29353494Z)',
    category: 'Date/time',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/date/time/',
  },
  {
    name: 'debug.feature',
    args: [
      {
        name: 'key',
        desc: 'Feature flag name.',
        type: 'String',
      },
    ],
    package: 'internal/debug',
    desc: 'Returns the value associated with the given feature flag.',
    example: 'debug.feature()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/internal/debug/feature/',
  },
  {
    name: 'debug.getOption',
    args: [
      {
        name: 'pkg',
        desc: 'Full path of the package.',
        type: 'String',
      },
      {
        name: 'name',
        desc: 'Option name.',
        type: 'String',
      },
    ],
    package: 'internal/debug',
    desc: 'Gets the value of an option using a form of reflection.',
    example: 'debug.getOption()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/internal/debug/getoption/',
  },
  {
    name: 'debug.null',
    args: [
      {
        name: 'type',
        desc: 'Null type.',
        type: 'String',
      },
    ],
    package: 'internal/debug',
    desc: 'Returns the null value with a given type.',
    example:
      'import "array"\nimport "internal/debug"\n\narray.from(rows: [{a: 1, b: 2, c: 3}, {a: debug.null(type: "int"), b: 5, c: 6}])',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/internal/debug/null/',
  },
  {
    name: 'debug.opaque',
    args: [],
    package: 'internal/debug',
    desc:
      'Works like `pass` in that it passes any incoming tables directly to the following transformation, save for its type signature does not indicate that the input type has any correlation with the output type.',
    example: 'debug.opaque()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/internal/debug/opaque/',
  },
  {
    name: 'debug.pass',
    args: [],
    package: 'internal/debug',
    desc:
      'Will pass any incoming tables directly next to the following transformation. It is best used to interrupt any planner rules that rely on a specific ordering.',
    example: 'debug.pass()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/internal/debug/pass/',
  },
  {
    name: 'debug.sink',
    args: [],
    package: 'internal/debug',
    desc: 'Will discard all data that comes into it.',
    example: 'debug.sink()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/internal/debug/sink/',
  },
  {
    name: 'debug.slurp',
    args: [],
    package: 'internal/debug',
    desc:
      'Will read the incoming tables and concatenate buffers with the same group key into a single in memory table buffer. This is useful for testing the performance impact of multiple buffers versus a single buffer.',
    example: 'debug.slurp()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/internal/debug/slurp/',
  },
  {
    name: 'dict.fromList',
    args: [
      {
        name: 'pairs',
        desc: 'List of records with `key` and `value` properties.',
        type: 'Array',
      },
    ],
    package: 'dict',
    desc:
      'Creates a dictionary from a list of records with `key` and `value` properties.',
    example:
      'import "dict"\n\nd =\n    dict.fromList(\n        pairs: [{key: 1, value: "foo"}, {key: 2, value: "bar"}],\n    )',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/dict/fromlist/',
  },
  {
    name: 'dict.get',
    args: [
      {
        name: 'dict',
        desc: 'Dictionary to return a value from.',
        type: 'Array',
      },
      {
        name: 'key',
        desc: 'Key to return from the dictionary.',
        type: 'Object',
      },
      {
        name: 'default',
        desc: 'Default value to return if the key does not exist in the',
        type: 'Object',
      },
    ],
    package: 'dict',
    desc:
      'Returns the value of a specified key in a dictionary or a default value if the key does not exist.',
    example:
      'import "dict"\n\nd = [1: "foo", 2: "bar"]\n\ndict.get(dict: d, key: 1, default: "")',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/dict/get/',
  },
  {
    name: 'dict.insert',
    args: [
      {
        name: 'dict',
        desc: 'Dictionary to update.',
        type: 'Array',
      },
      {
        name: 'key',
        desc: 'Key to insert into the dictionary.',
        type: 'Object',
      },
      {
        name: 'value',
        desc: 'Value to insert into the dictionary.',
        type: 'Object',
      },
    ],
    package: 'dict',
    desc:
      'Inserts a key-value pair into a dictionary and returns a new, updated dictionary.',
    example:
      'import "dict"\n\nd = [1: "foo", 2: "bar"]\n\ndict.insert(dict: d, key: 3, value: "baz")',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/dict/insert/',
  },
  {
    name: 'dict.remove',
    args: [
      {
        name: 'dict',
        desc: 'Dictionary to remove the key-value pair from.',
        type: 'Array',
      },
      {
        name: 'key',
        desc: 'Key to remove from the dictionary.',
        type: 'Object',
      },
    ],
    package: 'dict',
    desc:
      'Removes a key value pair from a dictionary and returns an updated dictionary.',
    example:
      'import "dict"\n\nd = [1: "foo", 2: "bar"]\n\ndict.remove(dict: d, key: 1)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/dict/remove/',
  },
  {
    name: 'die',
    args: [
      {
        name: 'msg',
        desc: 'Error message to return.',
        type: 'String',
      },
    ],
    package: '',
    desc: 'Stops the Flux script execution and returns an error message.',
    example: 'die(msg: "This is an error message")',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/die/',
  },
  {
    name: 'discord.endpoint',
    args: [
      {
        name: 'webhookToken',
        desc:
          'Discord webhook token (https://discord.com/developers/docs/resources/webhook).',
        type: 'String',
      },
      {
        name: 'webhookID',
        desc:
          'Discord webhook ID (https://discord.com/developers/docs/resources/webhook).',
        type: 'String',
      },
      {
        name: 'username',
        desc: 'Override the Discord webhook’s default username.',
        type: 'Object',
      },
      {
        name: 'avatar_url',
        desc: 'Override the Discord webhook’s default avatar.',
        type: 'Object',
      },
    ],
    package: 'contrib/chobbs/discord',
    desc:
      'Sends a single message to a Discord channel using a Discord webhook (https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks&?page=3) and data from table rows.',
    example: 'import "influxdata/influxdb/secrets"',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/chobbs/discord/endpoint/',
  },
  {
    name: 'discord.send',
    args: [
      {
        name: 'webhookToken',
        desc:
          'Discord webhook token (https://discord.com/developers/docs/resources/webhook).',
        type: 'String',
      },
      {
        name: 'webhookID',
        desc:
          'Discord webhook ID (https://discord.com/developers/docs/resources/webhook).',
        type: 'String',
      },
      {
        name: 'username',
        desc: 'Override the Discord webhook’s default username.',
        type: 'Object',
      },
      {
        name: 'content',
        desc: 'Message to send to Discord (2000 character limit).',
        type: 'Object',
      },
      {
        name: 'avatar_url',
        desc: 'Override the Discord webhook’s default avatar.',
        type: 'Object',
      },
    ],
    package: 'contrib/chobbs/discord',
    desc:
      'Sends a single message to a Discord channel using a Discord webhook.',
    example:
      'import "contrib/chobbs/discord"\n\n// setup and processing omitted\n\ndiscord.send(\n    webhookToken: token,\n    webhookID: "1234567890",\n    username: "chobbs",\n    content: "The current status is \\"${lastReported.status}\\".",\n    avatar_url: "https://staff-photos.net/pic.jpg",\n)',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/chobbs/discord/send/',
  },
  {
    name: 'display',
    args: [
      {
        name: 'v',
        desc: 'Value to convert for display.',
        type: 'Object',
      },
    ],
    package: '',
    desc: 'Returns the Flux literal representation of any value as a string.',
    example:
      'import "array"\n\narray.from(\n    rows: [\n        {\n            dict: display(v: ["a": 1, "b": 2]),\n            record: display(v: {x: 1, y: 2}),\n            array: display(v: [5, 6, 7]),\n        },\n    ],\n)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/display/',
  },
  {
    name: 'dynamic.asArray',
    args: [
      {
        name: 'v',
        desc:
          'Dynamic value to convert. Default is the piped-forward value (`<-`).',
        type: 'Object',
      },
    ],
    package: 'experimental/dynamic',
    desc: 'Converts a dynamic value into an array of dynamic elements.',
    example: 'dynamic.asArray()',
    category: 'Type Conversions',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/dynamic/asarray/',
  },
  {
    name: 'dynamic.dynamic',
    args: [
      {
        name: 'v',
        desc: 'Value to wrap as dynamic.',
        type: 'Object',
      },
    ],
    package: 'experimental/dynamic',
    desc: 'Wraps a value so it can be used as a `dynamic` value.',
    example: 'dynamic.dynamic()',
    category: 'Type Conversions',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/dynamic/dynamic/',
  },
  {
    name: 'dynamic.isType',
    args: [
      {
        name: 'v',
        desc: 'Value to test.',
        type: 'Object',
      },
      {
        name: 'type',
        desc: 'String describing the type to check against.',
        type: 'String',
      },
    ],
    package: 'experimental/dynamic',
    desc: 'Tests if a dynamic type holds a value of a specified type.',
    example: 'dynamic.isType()',
    category: 'Tests',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/dynamic/istype/',
  },
  {
    name: 'dynamic.jsonEncode',
    args: [
      {
        name: 'v',
        desc: 'Value to encode into JSON.',
        type: 'Object',
      },
    ],
    package: 'experimental/dynamic',
    desc: 'Converts a dynamic value into JSON bytes.',
    example: 'dynamic.jsonEncode()',
    category: 'Type Conversions',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/dynamic/jsonencode/',
  },
  {
    name: 'dynamic.jsonParse',
    args: [
      {
        name: 'data',
        desc: 'JSON data (as bytes) to parse.',
        type: 'Bytes',
      },
    ],
    package: 'experimental/dynamic',
    desc: 'Takes JSON data as bytes and returns dynamic values.',
    example: 'dynamic.jsonParse()',
    category: 'Type Conversions',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/dynamic/jsonparse/',
  },
  {
    name: 'events.duration',
    args: [
      {
        name: 'unit',
        desc: 'Duration unit of the calculated state duration.',
        type: 'Duration',
      },
      {
        name: 'columnName',
        desc: 'Name of the result column.',
        type: 'String',
      },
      {
        name: 'timeColumn',
        desc: 'Name of the time column.',
        type: 'String',
      },
      {
        name: 'stopColumn',
        desc: 'Name of the stop column.',
        type: 'String',
      },
      {
        name: 'stop',
        desc: 'The latest time to use when calculating results.',
        type: 'Time',
      },
    ],
    package: 'contrib/tomhollingworth/events',
    desc: 'Calculates the duration of events.',
    example:
      'import "array"\nimport "contrib/tomhollingworth/events"\n\ndata\n    |> events.duration(unit: 1m, stop: 2020-01-02T00:00:00Z)',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/tomhollingworth/events/duration/',
  },
  {
    name: 'expect.planner',
    args: [
      {
        name: 'rules',
        desc: 'Mapping of rules names to expected counts.',
        type: 'Array',
      },
    ],
    package: 'testing/expect',
    desc:
      'Will cause the present testcase to expect the given planner rules will be invoked exactly as many times as the number given.',
    example: 'expect.planner()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/testing/expect/planner/',
  },
  {
    name: 'experimental.alignTime',
    args: [
      {
        name: 'alignTo',
        desc: 'Time to align tables to. Default is `1970-01-01T00:00:00Z`.',
        type: 'Object',
      },
    ],
    package: 'experimental',
    desc:
      'Shifts time values in input tables to all start at a common start time.',
    example:
      'import "experimental"\n\ndata\n    |> window(every: 1mo)\n    |> experimental.alignTime(alignTo: 2021-01-01T00:00:00Z)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/aligntime/',
  },
  {
    name: 'experimental.catch',
    args: [
      {
        name: 'fn',
        desc: 'Function to call.',
        type: 'Function',
      },
    ],
    package: 'experimental',
    desc:
      'Calls a function and returns any error as a string value. If the function does not error the returned value is made into a string and returned.',
    example:
      'import "experimental"\n\nexperimental.catch(fn: () => die(msg: "error message"))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/catch/',
  },
  {
    name: 'experimental.chain',
    args: [
      {
        name: 'first',
        desc: 'First query to execute.',
        type: 'Stream of tables',
      },
      {
        name: 'second',
        desc: 'Second query to execute.',
        type: 'Stream of tables',
      },
    ],
    package: 'experimental',
    desc:
      'Runs two queries in a single Flux script sequentially and outputs the results of the second query.',
    example:
      'import "experimental"\n\n// setup and processing omitted\n\nexperimental.chain(first: downsampled_max, second: average_max)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/chain/',
  },
  {
    name: 'experimental.count',
    args: [],
    package: 'experimental',
    desc: 'Returns the number of records in each input table.',
    example:
      'import "experimental"\nimport "sampledata"\n\nsampledata.int()\n    |> experimental.count()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/count/',
  },
  {
    name: 'experimental.diff',
    args: [
      {
        name: 'want',
        desc: 'Input stream for the `-` side of the diff.',
        type: 'Stream of tables',
      },
      {
        name: 'got',
        desc: 'Input stream for the `+` side of the diff.',
        type: 'Stream of tables',
      },
    ],
    package: 'experimental',
    desc: 'Takes two table streams as input and produces a diff.',
    example:
      'import "sampledata"\nimport "experimental"\n\nwant = sampledata.int()\ngot =\n    sampledata.int()\n        |> map(fn: (r) => ({r with _value: if r._value > 15 then r._value + 1 else r._value}))\n\nexperimental.diff(got: got, want: want)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/diff/',
  },
  {
    name: 'experimental.distinct',
    args: [],
    package: 'experimental',
    desc: 'Returns unique values from the `_value` column.',
    example:
      'import "experimental"\nimport "sampledata"\n\nsampledata.int(includeNull: true)\n    |> experimental.distinct()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/distinct/',
  },
  {
    name: 'experimental.fill',
    args: [
      {
        name: 'value',
        desc: 'Value to replace null values with.',
        type: 'Object',
      },
      {
        name: 'usePrevious',
        desc:
          'Replace null values with the value of the previous non-null row.',
        type: 'Boolean',
      },
    ],
    package: 'experimental',
    desc:
      'Replaces all null values in the `_value` column with a non-null value.',
    example:
      'import "experimental"\nimport "sampledata"\n\nsampledata.int(includeNull: true)\n    |> experimental.fill(value: 0)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/fill/',
  },
  {
    name: 'experimental.first',
    args: [],
    package: 'experimental',
    desc:
      'Returns the first record with a non-null value in the `_value` column for each input table.',
    example:
      'import "experimental"\nimport "sampledata"\n\nsampledata.int(includeNull: true)\n    |> experimental.first()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/first/',
  },
  {
    name: 'experimental.histogram',
    args: [
      {
        name: 'bins',
        desc:
          'List of upper bounds to use when computing histogram frequencies,',
        type: 'Array',
      },
      {
        name: 'normalize',
        desc: 'Convert count values into frequency values between 0 and 1.',
        type: 'Boolean',
      },
    ],
    package: 'experimental',
    desc:
      'Approximates the cumulative distribution of a dataset by counting data frequencies for a list of bins.',
    example:
      'import "experimental"\nimport "sampledata"\n\n\nsampledata.float()\n    |> experimental.histogram(\n        bins: [\n            0.0,\n            5.0,\n            10.0,\n            15.0,\n            20.0,\n        ],\n    )',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/histogram/',
  },
  {
    name: 'experimental.histogramQuantile',
    args: [
      {
        name: 'quantile',
        desc: 'Quantile to compute (`[0.0 - 1.0]`).',
        type: 'Float',
      },
      {
        name: 'minValue',
        desc: 'Assumed minimum value of the dataset. Default is `0.0`.',
        type: 'Float',
      },
    ],
    package: 'experimental',
    desc:
      'Approximates a quantile given a histogram with the cumulative distribution of the dataset.',
    example:
      'import "experimental"\n\nhistogramData\n    |> experimental.histogramQuantile(quantile: 0.9)',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/histogramquantile/',
  },
  {
    name: 'experimental.integral',
    args: [
      {
        name: 'unit',
        desc: 'Time duration used to compute the integral.',
        type: 'Duration',
      },
      {
        name: 'interpolate',
        desc:
          'Type of interpolation to use. Default is `""` (no interpolation).',
        type: 'String',
      },
    ],
    package: 'experimental',
    desc:
      'Computes the area under the curve per unit of time of subsequent non-null records.',
    example:
      'import "experimental"\nimport "sampledata"\n\ndata =\n    sampledata.int()\n        |> range(start: sampledata.start, stop: sampledata.stop)\n\ndata\n    |> experimental.integral(unit: 20s)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/integral/',
  },
  {
    name: 'experimental.kaufmansAMA',
    args: [
      {
        name: 'n',
        desc: 'Period or number of points to use in the calculation.',
        type: 'Integer',
      },
    ],
    package: 'experimental',
    desc:
      "Calculates the Kaufman's Adaptive Moving Average (KAMA) of input tables using the `_value` column in each table.",
    example:
      'import "experimental"\nimport "sampledata"\n\nsampledata.int()\n    |> experimental.kaufmansAMA(n: 3)',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/kaufmansama/',
  },
  {
    name: 'experimental.last',
    args: [],
    package: 'experimental',
    desc:
      'Returns the last record with a non-null value in the `_value` column for each input table.',
    example:
      'import "experimental"\nimport "sampledata"\n\nsampledata.int(includeNull: true)\n    |> experimental.last()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/last/',
  },
  {
    name: 'experimental.max',
    args: [],
    package: 'experimental',
    desc:
      'Returns the record with the highest value in the `_value` column for each input table.',
    example:
      'import "experimental"\nimport "sampledata"\n\nsampledata.int()\n    |> experimental.max()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/max/',
  },
  {
    name: 'experimental.mean',
    args: [],
    package: 'experimental',
    desc:
      'Computes the mean or average of non-null values in the `_value` column of each input table.',
    example:
      'import "experimental"\nimport "sampledata"\n\nsampledata.float()\n    |> experimental.mean()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/mean/',
  },
  {
    name: 'experimental.min',
    args: [],
    package: 'experimental',
    desc:
      'Returns the record with the lowest value in the `_value` column for each input table.',
    example:
      'import "experimental"\nimport "sampledata"\n\nsampledata.int()\n    |> experimental.min()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/min/',
  },
  {
    name: 'experimental.mode',
    args: [],
    package: 'experimental',
    desc:
      'Computes the mode or value that occurs most often in the `_value` column in each input table.',
    example:
      'import "experimental"\nimport "sampledata"\n\nsampledata.int()\n    |> experimental.mode()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/mode/',
  },
  {
    name: 'experimental.preview',
    args: [
      {
        name: 'nrows',
        desc: 'Maximum number of rows per table to return. Default is `5`.',
        type: 'Integer',
      },
      {
        name: 'ntables',
        desc: 'Maximum number of tables to return.',
        type: 'Integer',
      },
    ],
    package: 'experimental',
    desc: 'Limits the number of rows and tables in the stream.',
    example:
      'import "experimental"\nimport "sampledata"\n\nsampledata.int()\n    |> experimental.preview()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/preview/',
  },
  {
    name: 'experimental.quantile',
    args: [
      {
        name: 'q',
        desc: 'Quantile to compute (`[0 - 1]`).',
        type: 'Float',
      },
      {
        name: 'method',
        desc: 'Computation method. Default is `estimate_tdigest`.',
        type: 'String',
      },
      {
        name: 'compression',
        desc: 'Number of centroids to use when compressing the dataset.',
        type: 'Float',
      },
    ],
    package: 'experimental',
    desc:
      'Returns non-null records with values in the `_value` column that fall within the specified quantile or represent the specified quantile.',
    example:
      'import "experimental"\nimport "sampledata"\n\nsampledata.float()\n    |> experimental.quantile(q: 0.5)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/quantile/',
  },
  {
    name: 'experimental.skew',
    args: [],
    package: 'experimental',
    desc:
      'Returns the skew of non-null values in the `_value` column for each input table as a float.',
    example:
      'import "experimental"\nimport "sampledata"\n\nsampledata.float()\n    |> experimental.skew()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/skew/',
  },
  {
    name: 'experimental.spread',
    args: [],
    package: 'experimental',
    desc:
      'Returns the difference between the minimum and maximum values in the `_value` column for each input table.',
    example:
      'import "experimental"\nimport "sampledata"\n\nsampledata.float()\n    |> experimental.spread()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/spread/',
  },
  {
    name: 'experimental.stddev',
    args: [
      {
        name: 'mode',
        desc:
          'Standard deviation mode or type of standard deviation to calculate.',
        type: 'String',
      },
    ],
    package: 'experimental',
    desc:
      'Returns the standard deviation of non-null values in the `_value` column for each input table.',
    example:
      'import "experimental"\nimport "sampledata"\n\nsampledata.float()\n    |> experimental.stddev()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/stddev/',
  },
  {
    name: 'experimental.sum',
    args: [],
    package: 'experimental',
    desc:
      'Returns the sum of non-null values in the `_value` column for each input table.',
    example:
      'import "experimental"\nimport "sampledata"\n\nsampledata.int()\n    |> experimental.sum()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/sum/',
  },
  {
    name: 'experimental.unique',
    args: [],
    package: 'experimental',
    desc:
      'Returns all records containing unique values in the `_value` column.',
    example:
      'import "experimental"\nimport "sampledata"\n\nsampledata.int(includeNull: true)\n    |> experimental.unique()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/unique/',
  },
  {
    name: 'experimental.unpivot',
    args: [
      {
        name: 'otherColumns',
        desc:
          'List of column names that are not in the group key but are also not field columns. Default is `["_time"]`.',
        type: 'Array',
      },
    ],
    package: 'experimental',
    desc:
      'Creates `_field` and `_value` columns pairs using all columns (other than `_time`) _not_ in the group key. The `_field` column contains the original column label and the `_value` column contains the original column value.',
    example: 'import "experimental"\n\ndata\n    |> experimental.unpivot()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/unpivot/',
  },
  {
    name: 'experimental.window',
    args: [
      {
        name: 'every',
        desc: 'Duration of time between windows. Default is the `0s`.',
        type: 'Duration',
      },
      {
        name: 'period',
        desc: 'Duration of the window. Default is `0s`.',
        type: 'Duration',
      },
      {
        name: 'offset',
        desc: 'Duration to shift the window boundaries by. Default is 0s.',
        type: 'Duration',
      },
      {
        name: 'location',
        desc:
          'Location used to determine timezone. Default is the `location` option.',
        type: 'Object',
      },
      {
        name: 'createEmpty',
        desc: 'Create empty tables for empty windows. Default is `false`.',
        type: 'Boolean',
      },
    ],
    package: 'experimental',
    desc: 'Groups records based on time.',
    example:
      'import "experimental"\n\ndata\n    |> experimental.window(every: 30s)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/window/',
  },
  {
    name: 'findColumn',
    args: [
      {
        name: 'column',
        desc: 'Column to extract.',
        type: 'String',
      },
      {
        name: 'fn',
        desc: 'Predicate function to evaluate input table group keys.',
        type: 'Function',
      },
    ],
    package: '',
    desc:
      'Returns an array of values in a specified column from the first table in a stream of tables that matches the specified predicate function.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> findColumn(fn: (key) => key.tag == "t1", column: "_value")',
    category: 'Dynamic queries',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/findcolumn/',
  },
  {
    name: 'findRecord',
    args: [
      {
        name: 'idx',
        desc: 'Index of the record to extract.',
        type: 'Integer',
      },
      {
        name: 'fn',
        desc: 'Predicate function to evaluate input table group keys.',
        type: 'Function',
      },
    ],
    package: '',
    desc:
      'Returns a row at a specified index as a record from the first table in a stream of tables that matches the specified predicate function.',
    example:
      'import "sampledata"\n\nsampledata.int()\n    |> findRecord(\n        fn: (key) => key.tag == "t1",\n        idx: 0,\n    )',
    category: 'Dynamic queries',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/findrecord/',
  },
  {
    name: 'gen.tables',
    args: [
      {
        name: 'n',
        desc: 'Number of rows to generate.',
        type: 'Integer',
      },
      {
        name: 'nulls',
        desc:
          'Percentage chance that a null value will be used in the input. Valid value range is `[0.0 - 1.0]`.',
        type: 'Float',
      },
      {
        name: 'tags',
        desc: 'Set of tags with their cardinality to generate.',
        type: 'Array',
      },
      {
        name: 'seed',
        desc:
          'Pass seed to tables generator to get the very same sequence each time.',
        type: 'Integer',
      },
    ],
    package: 'internal/gen',
    desc: 'Generates a stream of table data.',
    example: 'gen.tables()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/internal/gen/tables/',
  },
  {
    name: 'generate.from',
    args: [
      {
        name: 'count',
        desc: 'Number of rows to generate.',
        type: 'Integer',
      },
      {
        name: 'fn',
        desc: 'Function used to generate values.',
        type: 'Function',
      },
      {
        name: 'start',
        desc: 'Beginning of the time range to generate values in.',
        type: 'Object',
      },
      {
        name: 'stop',
        desc: 'End of the time range to generate values in.',
        type: 'Object',
      },
    ],
    package: 'generate',
    desc: 'Generates data using the provided parameter values.',
    example:
      'import "generate"\n\ngenerate.from(\n    count: 6,\n    fn: (n) => (n + 1) * (n + 2),\n    start: 2021-01-01T00:00:00Z,\n    stop: 2021-01-02T00:00:00Z,\n)',
    category: 'Inputs',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/generate/from/',
  },
  {
    name: 'geo.ST_Contains',
    args: [
      {
        name: 'region',
        desc: 'Region to test. Specify record properties for the shape.',
        type: 'Object',
      },
      {
        name: 'geometry',
        desc:
          'GIS geometry to test. Can be either point or linestring geometry.',
        type: 'Object',
      },
      {
        name: 'units',
        desc: 'Record that defines the unit of measurement for distance.',
        type: 'Object',
      },
    ],
    package: 'experimental/geo',
    desc:
      'Returns boolean indicating whether the defined region contains a specified GIS geometry.',
    example: 'geo.ST_Contains()',
    category: 'Geotemporal',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/geo/st_contains/',
  },
  {
    name: 'geo.ST_DWithin',
    args: [
      {
        name: 'region',
        desc: 'Region to test. Specify record properties for the shape.',
        type: 'Object',
      },
      {
        name: 'geometry',
        desc:
          'GIS geometry to test. Can be either point or linestring geometry.',
        type: 'Object',
      },
      {
        name: 'distance',
        desc: 'Maximum distance allowed between the region and geometry.',
        type: 'Object',
      },
      {
        name: 'units',
        desc: 'Record that defines the unit of measurement for distance.',
        type: 'Object',
      },
    ],
    package: 'experimental/geo',
    desc:
      'Tests if the specified region is within a defined distance from the specified GIS geometry and returns `true` or `false`.',
    example: 'geo.ST_DWithin()',
    category: 'Geotemporal',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/geo/st_dwithin/',
  },
  {
    name: 'geo.ST_Distance',
    args: [
      {
        name: 'region',
        desc: 'Region to test. Specify record properties for the shape.',
        type: 'Object',
      },
      {
        name: 'geometry',
        desc:
          'GIS geometry to test. Can be either point or linestring geometry.',
        type: 'Object',
      },
      {
        name: 'units',
        desc: 'Record that defines the unit of measurement for distance.',
        type: 'Object',
      },
    ],
    package: 'experimental/geo',
    desc:
      'Returns the distance from a given region to a specified GIS geometry.',
    example: 'geo.ST_Distance()',
    category: 'Geotemporal',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/geo/st_distance/',
  },
  {
    name: 'geo.ST_Intersects',
    args: [
      {
        name: 'region',
        desc: 'Region to test. Specify record properties for the shape.',
        type: 'Object',
      },
      {
        name: 'geometry',
        desc:
          'GIS geometry to test. Can be either point or linestring geometry.',
        type: 'Object',
      },
      {
        name: 'units',
        desc: 'Record that defines the unit of measurement for distance.',
        type: 'Object',
      },
    ],
    package: 'experimental/geo',
    desc:
      'Tests if the specified GIS geometry intersects with the specified region and returns `true` or `false`.',
    example: 'geo.ST_Intersects()',
    category: 'Geotemporal',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/geo/st_intersects/',
  },
  {
    name: 'geo.ST_Length',
    args: [
      {
        name: 'geometry',
        desc:
          'GIS geometry to test. Can be either point or linestring geometry.',
        type: 'Object',
      },
      {
        name: 'units',
        desc: 'Record that defines the unit of measurement for distance.',
        type: 'Object',
      },
    ],
    package: 'experimental/geo',
    desc:
      'Returns the spherical length or distance (https://mathworld.wolfram.com/SphericalDistance.html) of the specified GIS geometry.',
    example: 'geo.ST_Length()',
    category: 'Geotemporal',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/geo/st_length/',
  },
  {
    name: 'geo.ST_LineString',
    args: [],
    package: 'experimental/geo',
    desc: 'Converts a series of geographic points into linestring.',
    example: 'import "experimental/geo"\n\ndata\n    |> geo.ST_LineString()',
    category: 'Geotemporal',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/geo/st_linestring/',
  },
  {
    name: 'geo.getGrid',
    args: [
      {
        name: 'region',
        desc: 'Region used to return S2 cell ID tokens.',
        type: 'Object',
      },
      {
        name: 'minSize',
        desc: 'Minimum number of cells that cover the specified region.',
        type: 'Integer',
      },
      {
        name: 'maxSize',
        desc: 'Minimum number of cells that cover the specified region.',
        type: 'Integer',
      },
      {
        name: 'level',
        desc: 'S2 cell level of grid cells.',
        type: 'Integer',
      },
      {
        name: 'maxLevel',
        desc: 'Maximumn S2 cell level of grid cells.',
        type: 'Integer',
      },
      {
        name: 'units',
        desc: 'Record that defines the unit of measurement for distance.',
        type: 'Object',
      },
    ],
    package: 'experimental/geo',
    desc: 'Calculates a grid or set of cell ID tokens for a specified region.',
    example: 'geo.getGrid()',
    category: 'Geotemporal',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/geo/getgrid/',
  },
  {
    name: 'geo.getLevel',
    args: [
      {
        name: 'token',
        desc: 'S2 cell ID token.',
        type: 'String',
      },
    ],
    package: 'experimental/geo',
    desc: 'Returns the S2 cell level of specified cell ID token.',
    example: 'import "experimental/geo"\n\ngeo.getLevel(token: "166b59")',
    category: 'Geotemporal',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/geo/getlevel/',
  },
  {
    name: 'geo.s2CellLatLon',
    args: [
      {
        name: 'token',
        desc: 'S2 cell ID token.',
        type: 'String',
      },
    ],
    package: 'experimental/geo',
    desc: 'Returns the latitude and longitude of the center of an S2 cell.',
    example: 'import "experimental/geo"\n\ngeo.s2CellLatLon(token: "89c284")',
    category: 'Geotemporal',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/geo/s2celllatlon/',
  },
  {
    name: 'geo.stContains',
    args: [
      {
        name: 'region',
        desc: 'Region to test. Specify record properties for the shape.',
        type: 'Object',
      },
      {
        name: 'geometry',
        desc:
          'GIS geometry to test. Can be either point or linestring geometry.',
        type: 'Object',
      },
      {
        name: 'units',
        desc: 'Record that defines the unit of measurement for distance.',
        type: 'Object',
      },
    ],
    package: 'experimental/geo',
    desc:
      'Returns boolean indicating whether the defined region contains a specified GIS geometry.',
    example: 'geo.stContains()',
    category: 'Geotemporal',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/geo/stcontains/',
  },
  {
    name: 'geo.stDistance',
    args: [
      {
        name: 'region',
        desc: 'Region to test. Specify record properties for the shape.',
        type: 'Object',
      },
      {
        name: 'geometry',
        desc:
          'GIS geometry to test. Can be either point or linestring geometry.',
        type: 'Object',
      },
      {
        name: 'units',
        desc: 'Record that defines the unit of measurement for distance.',
        type: 'Object',
      },
    ],
    package: 'experimental/geo',
    desc:
      'Returns the distance from a given region to a specified GIS geometry.',
    example: 'geo.stDistance()',
    category: 'Geotemporal',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/geo/stdistance/',
  },
  {
    name: 'geo.stLength',
    args: [
      {
        name: 'geometry',
        desc:
          'GIS geometry to test. Can be either point or linestring geometry.',
        type: 'Object',
      },
      {
        name: 'units',
        desc: 'Record that defines the unit of measurement for distance.',
        type: 'Object',
      },
    ],
    package: 'experimental/geo',
    desc:
      'Returns the spherical length or distance (https://mathworld.wolfram.com/SphericalDistance.html) of the specified GIS geometry.',
    example: 'geo.stLength()',
    category: 'Geotemporal',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/geo/stlength/',
  },
  {
    name: 'geo.totalDistance',
    args: [
      {
        name: 'outputColumn',
        desc: 'Total distance output column. Default is `_value`.',
        type: 'Object',
      },
    ],
    package: 'experimental/geo',
    desc:
      'Calculates the total distance covered by subsequent points in each input table.',
    example: 'import "experimental/geo"\n\ndata\n    |> geo.totalDistance()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/geo/totaldistance/',
  },
  {
    name: 'hash.b64',
    args: [
      {
        name: 'v',
        desc: 'String to hash.',
        type: 'Object',
      },
    ],
    package: 'contrib/qxip/hash',
    desc: 'Converts a string value to a Base64 string.',
    example: 'import "contrib/qxip/hash"\n\nhash.b64(v: "Hello, world!")',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/contrib/qxip/hash/b64/',
  },
  {
    name: 'hash.cityhash64',
    args: [
      {
        name: 'v',
        desc: 'String to hash.',
        type: 'Object',
      },
    ],
    package: 'contrib/qxip/hash',
    desc:
      'Converts a string value to a 64-bit hexadecimal hash using the CityHash64 algorithm.',
    example:
      'import "contrib/qxip/hash"\n\nhash.cityhash64(v: "Hello, world!")',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/qxip/hash/cityhash64/',
  },
  {
    name: 'hash.hmac',
    args: [
      {
        name: 'v',
        desc: 'String to hash.',
        type: 'Object',
      },
      {
        name: 'k',
        desc: 'Key to sign hash.',
        type: 'Object',
      },
    ],
    package: 'contrib/qxip/hash',
    desc: 'Converts a string value to an MD5-signed SHA-1 hash.',
    example:
      'import "contrib/qxip/hash"\n\nhash.hmac(v: "helloworld", k: "123456")',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/contrib/qxip/hash/hmac/',
  },
  {
    name: 'hash.md5',
    args: [
      {
        name: 'v',
        desc: 'String to hash.',
        type: 'Object',
      },
    ],
    package: 'contrib/qxip/hash',
    desc: 'Converts a string value to an MD5 hash.',
    example: 'import "contrib/qxip/hash"\n\nhash.md5(v: "Hello, world!")',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/contrib/qxip/hash/md5/',
  },
  {
    name: 'hash.sha1',
    args: [
      {
        name: 'v',
        desc: 'String to hash.',
        type: 'Object',
      },
    ],
    package: 'contrib/qxip/hash',
    desc:
      'Converts a string value to a hexadecimal hash using the SHA-1 hash algorithm.',
    example:
      'import "contrib/qxip/hash"\n\nhash.sha1(\n    v: "Hello, world!",\n)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/contrib/qxip/hash/sha1/',
  },
  {
    name: 'hash.sha256',
    args: [
      {
        name: 'v',
        desc: 'String to hash.',
        type: 'Object',
      },
    ],
    package: 'contrib/qxip/hash',
    desc:
      'Converts a string value to a hexadecimal hash using the SHA 256 hash algorithm.',
    example:
      'import "contrib/qxip/hash"\n\nhash.sha256(\n    v: "Hello, world!",\n)',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/qxip/hash/sha256/',
  },
  {
    name: 'hash.xxhash64',
    args: [
      {
        name: 'v',
        desc: 'String to hash.',
        type: 'Object',
      },
    ],
    package: 'contrib/qxip/hash',
    desc:
      'Converts a string value to a 64-bit hexadecimal hash using the xxHash algorithm.',
    example: 'import "contrib/qxip/hash"\n\nhash.xxhash64(v: "Hello, world!")',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/qxip/hash/xxhash64/',
  },
  {
    name: 'hex.bytes',
    args: [
      {
        name: 'v',
        desc: 'String to convert.',
        type: 'String',
      },
    ],
    package: 'contrib/bonitoo-io/hex',
    desc: 'Converts a hexadecimal string to bytes.',
    example: 'import "contrib/bonitoo-io/hex"\n\nhex.bytes(v: "FF5733")',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/bonitoo-io/hex/bytes/',
  },
  {
    name: 'hex.int',
    args: [
      {
        name: 'v',
        desc: 'String to convert.',
        type: 'String',
      },
    ],
    package: 'contrib/bonitoo-io/hex',
    desc: 'Converts a hexadecimal string to an integer.',
    example: 'import "contrib/bonitoo-io/hex"\n\nhex.int(v: "4d2")',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/bonitoo-io/hex/int/',
  },
  {
    name: 'hex.string',
    args: [
      {
        name: 'v',
        desc: 'Value to convert.',
        type: 'Object',
      },
    ],
    package: 'contrib/bonitoo-io/hex',
    desc: 'Converts a Flux basic type to a hexadecimal string.',
    example: 'import "contrib/bonitoo-io/hex"\n\nhex.string(v: 1234)',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/bonitoo-io/hex/string/',
  },
  {
    name: 'hex.uint',
    args: [
      {
        name: 'v',
        desc: 'String to convert.',
        type: 'String',
      },
    ],
    package: 'contrib/bonitoo-io/hex',
    desc: 'Converts a hexadecimal string to an unsigned integer.',
    example: 'import "contrib/bonitoo-io/hex"\n\nhex.uint(v: "4d2")',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/bonitoo-io/hex/uint/',
  },
  {
    name: 'http.basicAuth',
    args: [
      {
        name: 'u',
        desc: 'Username to use in the basic authentication header.',
        type: 'String',
      },
      {
        name: 'p',
        desc: 'Password to use in the basic authentication header.',
        type: 'String',
      },
    ],
    package: 'http',
    desc:
      'Returns a Base64-encoded basic authentication header using a specified username and password combination.',
    example:
      'import "http"\n\nusername = "myawesomeuser"\npassword = "mySupErSecRetPasSW0rD"\n\nhttp.post(\n    url: "http://myawesomesite.com/api/",\n    headers: {Authorization: http.basicAuth(u: username, p: password)},\n    data: bytes(v: "Something I want to send."),\n)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/http/basicauth/',
  },
  {
    name: 'http.endpoint',
    args: [
      {
        name: 'url',
        desc: 'URL to send the POST request to.',
        type: 'String',
      },
    ],
    package: 'http',
    desc:
      'Iterates over input data and sends a single POST request per input row to a specified URL.',
    example:
      'import "http"\n\n// setup and processing omitted\n\n    http.endpoint(url: "http://example.com/")(\n        mapfn: (r) =>\n            ({\n                headers: {header1: "example1", header2: "example2"},\n                data: bytes(v: "The value is ${r._value}"),\n            }),\n    )',
    category: 'Notification endpoints',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/http/endpoint/',
  },
  {
    name: 'http.pathEscape',
    args: [
      {
        name: 'inputString',
        desc: 'String to escape.',
        type: 'String',
      },
    ],
    package: 'http',
    desc:
      'Escapes special characters in a string (including `/`) and replaces non-ASCII characters with hexadecimal representations (`%XX`).',
    example: 'import "http"\n\nhttp.pathEscape(inputString: "Hello world!")',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/http/pathescape/',
  },
  {
    name: 'influxdb.api',
    args: [
      {
        name: 'method',
        desc: 'HTTP request method.',
        type: 'String',
      },
      {
        name: 'path',
        desc: 'InfluxDB API path.',
        type: 'String',
      },
      {
        name: 'host',
        desc:
          'InfluxDB host URL _(Required when executed outside of InfluxDB)_.',
        type: 'String',
      },
      {
        name: 'token',
        desc: 'InfluxDB API token (/influxdb/cloud/admin/tokens/)',
        type: 'String',
      },
      {
        name: 'headers',
        desc: 'HTTP request headers.',
        type: 'Array',
      },
      {
        name: 'query',
        desc: 'URL query parameters.',
        type: 'Array',
      },
      {
        name: 'timeout',
        desc: 'HTTP request timeout. Default is `30s`.',
        type: 'Duration',
      },
      {
        name: 'body',
        desc: 'HTTP request body as bytes.',
        type: 'Bytes',
      },
    ],
    package: 'experimental/influxdb',
    desc:
      'Submits an HTTP request to the specified InfluxDB API path and returns a record containing the HTTP status code, response headers, and the response body.',
    example:
      'import "experimental/influxdb"\nimport "influxdata/influxdb/secrets"\n\ntoken = secrets.get(key: "INFLUX_TOKEN")\n\nresponse = influxdb.api(method: "get", path: "/health", host: "http://localhost:8086", token: token)\n\nstring(v: response.body)',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/influxdb/api/',
  },
  {
    name: 'influxdb.cardinality',
    args: [
      {
        name: 'bucket',
        desc: 'Bucket to query cardinality from.',
        type: 'String',
      },
      {
        name: 'bucketID',
        desc: 'String-encoded bucket ID to query cardinality from.',
        type: 'String',
      },
      {
        name: 'org',
        desc: 'Organization name.',
        type: 'String',
      },
      {
        name: 'orgID',
        desc: 'String-encoded organization ID.',
        type: 'String',
      },
      {
        name: 'host',
        desc: 'URL of the InfluxDB instance to query.',
        type: 'String',
      },
      {
        name: 'token',
        desc: 'InfluxDB API token.',
        type: 'String',
      },
      {
        name: 'start',
        desc: 'Earliest time to include when calculating cardinality.',
        type: 'Object',
      },
      {
        name: 'stop',
        desc: 'Latest time to include when calculating cardinality.',
        type: 'Object',
      },
      {
        name: 'predicate',
        desc: 'Predicate function that filters records.',
        type: 'Function',
      },
    ],
    package: 'influxdata/influxdb',
    desc: 'Returns the series cardinality of data retrieved from InfluxDB.',
    example:
      'import "influxdata/influxdb"\n\ninfluxdb.cardinality(bucket: "example-bucket", start: time(v: 1))',
    category: 'Metadata',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/cardinality/',
  },
  {
    name: 'influxdb.select',
    args: [
      {
        name: 'from',
        desc: 'Name of the bucket to query.',
        type: 'String',
      },
      {
        name: 'start',
        desc: 'Earliest time to include in results.',
        type: 'Object',
      },
      {
        name: 'stop',
        desc: 'Latest time to include in results. Default is `now()`.',
        type: 'Object',
      },
      {
        name: 'm',
        desc: 'Name of the measurement to query.',
        type: 'Object',
      },
      {
        name: 'fields',
        desc: 'List of fields to query. Default is`[]`.',
        type: 'Array',
      },
      {
        name: 'where',
        desc:
          'Single argument predicate function that evaluates `true` or `false`',
        type: 'Function',
      },
      {
        name: 'host',
        desc: 'URL of the InfluxDB instance to query.',
        type: 'String',
      },
      {
        name: 'org',
        desc: 'Organization name.',
        type: 'String',
      },
      {
        name: 'token',
        desc: 'InfluxDB API token (/influxdb/v2/security/tokens/).',
        type: 'String',
      },
    ],
    package: 'contrib/jsternberg/influxdb',
    desc:
      'Is an alternate implementation of `from()`, `range()`, `filter()` and `pivot()` that returns pivoted query results and masks the `_measurement`, `_start`, and `_stop` columns. Results are similar to those returned by InfluxQL `SELECT` statements.',
    example:
      'import "contrib/jsternberg/influxdb"\n\ninfluxdb.select(from: "example-bucket", start: -1d, m: "example-measurement", fields: ["field1"])',
    category: 'Inputs',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/jsternberg/influxdb/select/',
  },
  {
    name: 'influxdb.wideTo',
    args: [
      {
        name: 'bucket',
        desc: 'Name of the bucket to write to.',
        type: 'String',
      },
      {
        name: 'bucketID',
        desc: 'String-encoded bucket ID to to write to.',
        type: 'String',
      },
      {
        name: 'host',
        desc: 'URL of the InfluxDB instance to write to.',
        type: 'String',
      },
      {
        name: 'org',
        desc: 'Organization name.',
        type: 'String',
      },
      {
        name: 'orgID',
        desc: 'String-encoded organization ID to query.',
        type: 'String',
      },
      {
        name: 'token',
        desc: 'InfluxDB API token.',
        type: 'String',
      },
    ],
    package: 'influxdata/influxdb',
    desc:
      'Writes wide data to an InfluxDB 2.x or InfluxDB Cloud bucket. Wide data is _pivoted_ in that its fields are represented as columns making the table wider.',
    example: 'import "influxdata/influxdb"',
    category: 'Outputs',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/wideto/',
  },
  {
    name: 'interpolate.linear',
    args: [
      {
        name: 'every',
        desc: 'Duration of time between interpolated points.',
        type: 'Duration',
      },
    ],
    package: 'interpolate',
    desc:
      'Inserts rows at regular intervals using linear interpolation to determine values for inserted rows.',
    example:
      'import "interpolate"\n\ndata\n    |> interpolate.linear(every: 1d)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/interpolate/linear/',
  },
  {
    name: 'iox.from',
    args: [
      {
        name: 'bucket',
        desc: 'IOx bucket to read data from.',
        type: 'String',
      },
      {
        name: 'measurement',
        desc: 'Measurement to read data from.',
        type: 'String',
      },
    ],
    package: 'experimental/iox',
    desc:
      'Reads from the selected bucket and measurement in an IOx storage node.',
    example:
      'import "experimental/iox"\n\niox.from(bucket: "example-bucket", measurement: "example-measurement")\n    |> range(start: -1d)\n    |> filter(fn: (r) => r._field == "example-field")',
    category: 'Inputs',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/iox/from/',
  },
  {
    name: 'iox.sql',
    args: [
      {
        name: 'bucket',
        desc: 'IOx bucket to read data from.',
        type: 'String',
      },
      {
        name: 'query',
        desc: 'SQL query to execute.',
        type: 'String',
      },
    ],
    package: 'experimental/iox',
    desc: 'Executes an SQL query against a bucket in an IOx storage node.',
    example:
      'import "experimental/iox"\n\niox.sql(bucket: "example-bucket", query: "SELECT * FROM measurement")',
    category: 'Inputs',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/iox/sql/',
  },
  {
    name: 'iox.sqlInterval',
    args: [
      {
        name: 'd',
        desc: 'Duration value to convert to SQL interval string.',
        type: 'Object',
      },
    ],
    package: 'experimental/iox',
    desc: 'Converts a duration value to a SQL interval string.',
    example:
      'import "experimental/iox"\n\niox.sqlInterval(\n    d: 1y2mo3w4d5h6m7s8ms,\n)',
    category: 'Type Conversions',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/iox/sqlinterval/',
  },
  {
    name: 'join.full',
    args: [
      {
        name: 'left',
        desc: 'Left input stream. Default is piped-forward data (<-).',
        type: 'Stream of tables',
      },
      {
        name: 'right',
        desc: 'Right input stream.',
        type: 'Stream of tables',
      },
      {
        name: 'on',
        desc:
          'Function that takes a left and right record (`l`, and `r` respectively), and returns a boolean.',
        type: 'Function',
      },
      {
        name: 'as',
        desc:
          'Function that takes a left and a right record (`l` and `r` respectively), and returns a record.',
        type: 'Function',
      },
    ],
    package: 'join',
    desc: 'Performs a full outer join on two table streams.',
    example:
      'import "join"\n\n// setup and processing omitted\n\njoin.full(\n    left: left,\n    right: right,\n    on: (l, r) => l.label == r.id and l._time == r._time,\n    as: (l, r) => {\n        time = if exists l._time then l._time else r._time\n        label = if exists l.label then l.label else r.id\n\n        return {_time: time, label: label, v_left: l._value, v_right: r._value}\n    },\n)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/join/full/',
  },
  {
    name: 'join.inner',
    args: [
      {
        name: 'left',
        desc: 'Left input stream. Default is piped-forward data (<-).',
        type: 'Stream of tables',
      },
      {
        name: 'right',
        desc: 'Right input stream.',
        type: 'Stream of tables',
      },
      {
        name: 'on',
        desc:
          'Function that takes a left and right record (`l`, and `r` respectively), and returns a boolean.',
        type: 'Function',
      },
      {
        name: 'as',
        desc:
          'Function that takes a left and a right record (`l` and `r` respectively), and returns a record.',
        type: 'Function',
      },
    ],
    package: 'join',
    desc: 'Performs an inner join on two table streams.',
    example:
      'import "sampledata"\nimport "join"\n\nints = sampledata.int()\nstrings = sampledata.string()\n\njoin.inner(\n    left: ints,\n    right: strings,\n    on: (l, r) => l._time == r._time,\n    as: (l, r) => ({l with label: r._value}),\n)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/join/inner/',
  },
  {
    name: 'join.left',
    args: [
      {
        name: 'left',
        desc: 'Left input stream. Default is piped-forward data (<-).',
        type: 'Stream of tables',
      },
      {
        name: 'right',
        desc: 'Right input stream.',
        type: 'Stream of tables',
      },
      {
        name: 'on',
        desc:
          'Function that takes a left and right record (`l`, and `r` respectively), and returns a boolean.',
        type: 'Function',
      },
      {
        name: 'as',
        desc:
          'Function that takes a left and a right record (`l` and `r` respectively), and returns a record.',
        type: 'Function',
      },
    ],
    package: 'join',
    desc: 'Performs a left outer join on two table streams.',
    example:
      'import "join"\n\n// setup and processing omitted\n\njoin.left(\n    left: left,\n    right: right,\n    on: (l, r) => l.label == r.id and l._time == r._time,\n    as: (l, r) => ({_time: l._time, label: l.label, v_left: l._value, v_right: r._value}),\n)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/join/left/',
  },
  {
    name: 'join.right',
    args: [
      {
        name: 'left',
        desc: 'Left input stream. Default is piped-forward data (<-).',
        type: 'Stream of tables',
      },
      {
        name: 'right',
        desc: 'Right input stream.',
        type: 'Stream of tables',
      },
      {
        name: 'on',
        desc:
          'Function that takes a left and right record (`l`, and `r` respectively), and returns a boolean.',
        type: 'Function',
      },
      {
        name: 'as',
        desc:
          'Function that takes a left and a right record (`l` and `r` respectively), and returns a record.',
        type: 'Function',
      },
    ],
    package: 'join',
    desc: 'Performs a right outer join on two table streams.',
    example:
      'import "join"\n\n// setup and processing omitted\n\njoin.right(\n    left: left,\n    right: right,\n    on: (l, r) => l.label == r.id and l._time == r._time,\n    as: (l, r) => ({_time: r._time, label: r.id, v_left: l._value, v_right: r._value}),\n)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/join/right/',
  },
  {
    name: 'join.tables',
    args: [
      {
        name: 'left',
        desc: 'Left input stream. Default is piped-forward data (`<-`).',
        type: 'Stream of tables',
      },
      {
        name: 'right',
        desc: 'Right input stream.',
        type: 'Stream of tables',
      },
      {
        name: 'on',
        desc:
          'Function that takes a left and right record (`l`, and `r` respectively), and returns a boolean.',
        type: 'Function',
      },
      {
        name: 'as',
        desc:
          'Function that takes a left and a right record (`l` and `r` respectively), and returns a record.',
        type: 'Function',
      },
      {
        name: 'method',
        desc: 'String that specifies the join method.',
        type: 'String',
      },
    ],
    package: 'join',
    desc:
      'Joins two input streams together using a specified method, predicate, and a function to join two corresponding records, one from each input stream.',
    example:
      'import "join"\n\n// setup and processing omitted\n\njoin.tables(\n    method: "inner",\n    left: ints,\n    right: strings,\n    on: (l, r) => l._time == r._time,\n    as: (l, r) => ({l with label: r._value}),\n)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/join/tables/',
  },
  {
    name: 'join.time',
    args: [
      {
        name: 'left',
        desc: 'Left input stream. Default is piped-forward data (<-).',
        type: 'Stream of tables',
      },
      {
        name: 'right',
        desc: 'Right input stream.',
        type: 'Stream of tables',
      },
      {
        name: 'as',
        desc:
          'Function that takes a left and a right record (`l` and `r` respectively), and returns a record.',
        type: 'Function',
      },
      {
        name: 'method',
        desc: 'String that specifies the join method. Default is `inner`.',
        type: 'String',
      },
    ],
    package: 'join',
    desc: 'Joins two table streams together exclusively on the `_time` column.',
    example:
      'import "sampledata"\nimport "join"\n\nints = sampledata.int()\nstrings = sampledata.string()\n\njoin.time(left: ints, right: strings, as: (l, r) => ({l with label: r._value}))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/join/time/',
  },
  {
    name: 'json.parse',
    args: [
      {
        name: 'data',
        desc: 'JSON data (as bytes) to parse.',
        type: 'Bytes',
      },
    ],
    package: 'experimental/json',
    desc: 'Takes JSON data as bytes and returns a value.',
    example:
      'import "experimental/json"\n\n\ndata\n    |> map(\n        fn: (r) => {\n            jsonData = json.parse(data: bytes(v: r._value))',
    category: 'Type Conversions',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/json/parse/',
  },
  {
    name: 'kafka.to',
    args: [
      {
        name: 'brokers',
        desc: 'List of Kafka brokers to send data to.',
        type: 'Array',
      },
      {
        name: 'topic',
        desc: 'Kafka topic to send data to.',
        type: 'String',
      },
      {
        name: 'balancer',
        desc: 'Kafka load balancing strategy. Default is `hash`.',
        type: 'String',
      },
      {
        name: 'name',
        desc: 'Kafka metric name. Default is the value of the `nameColumn`.',
        type: 'String',
      },
      {
        name: 'nameColumn',
        desc: 'Column to use as the Kafka metric name.',
        type: 'String',
      },
      {
        name: 'timeColumn',
        desc: 'Time column. Default is `_time`.',
        type: 'String',
      },
      {
        name: 'tagColumns',
        desc: 'List of tag columns in input data.',
        type: 'Array',
      },
      {
        name: 'valueColumns',
        desc: 'List of value columns in input data. Default is `["_value"]`.',
        type: 'Array',
      },
    ],
    package: 'kafka',
    desc: 'Sends data to Apache Kafka (https://kafka.apache.org/) brokers.',
    example:
      'import "kafka"\nimport "sampledata"\n\nsampledata.int()\n    |> kafka.to(\n        brokers: ["http://127.0.0.1:9092"],\n        topic: "example-topic",\n        name: "example-metric-name",\n        tagColumns: ["tag"],\n    )',
    category: 'Outputs',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/kafka/to/',
  },
  {
    name: 'logql.query_range',
    args: [
      {
        name: 'url',
        desc: 'LogQL/qryn URL and port. Default is `http://qryn:3100`.',
        type: 'String',
      },
      {
        name: 'path',
        desc: 'LogQL query_range API path.',
        type: 'String',
      },
      {
        name: 'limit',
        desc: 'Query limit. Default is 100.',
        type: 'Object',
      },
      {
        name: 'query',
        desc: 'LogQL query to execute.',
        type: 'String',
      },
      {
        name: 'start',
        desc: 'Earliest time to include in results. Default is `-1h`.',
        type: 'Object',
      },
      {
        name: 'end',
        desc: 'Latest time to include in results. Default is `now()`.',
        type: 'Object',
      },
      {
        name: 'step',
        desc: 'Query resolution step width in seconds. Default is 10.',
        type: 'Object',
      },
      {
        name: 'orgid',
        desc:
          'Optional Loki organization ID for partitioning. Default is `""`.',
        type: 'String',
      },
    ],
    package: 'contrib/qxip/logql',
    desc:
      'Queries data from a specified LogQL query within given time bounds, filters data by query, timerange, and optional limit expressions. All values are returned as string values (using `raw` mode in `csv.from`)',
    example:
      'import "contrib/qxip/logql"\n\noption logql.defaultURL = "http://qryn:3100"\n\nlogql.query_range(query: "{job=\\"dummy-server\\"}", start: -1h, end: now(), limit: 100)',
    category: 'Inputs',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/qxip/logql/query_range/',
  },
  {
    name: 'math.float64frombits',
    args: [
      {
        name: 'b',
        desc: 'Value to operate on.',
        type: 'UInteger',
      },
    ],
    package: 'math',
    desc:
      'Returns the floating-point number corresponding to the IEE 754 binary representation `b`, with the sign bit of `b` and the result in the same bit position.',
    example: 'import "math"\n\nmath.float64frombits(b: uint(v: 4))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/float64frombits/',
  },
  {
    name: 'math.log10',
    args: [
      {
        name: 'x',
        desc: 'Value to operate on.',
        type: 'Float',
      },
    ],
    package: 'math',
    desc: 'Returns the decimal logarithm of x.',
    example: 'import "math"\n\nmath.log10(x: 3.14)',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/math/log10/',
  },
  {
    name: 'monitor.check',
    args: [
      {
        name: 'crit',
        desc:
          'Predicate function that determines `crit` status. Default is `(r) => false`.',
        type: 'Function',
      },
      {
        name: 'warn',
        desc:
          'Predicate function that determines `warn` status. Default is `(r) => false`.',
        type: 'Function',
      },
      {
        name: 'info',
        desc:
          'Predicate function that determines `info` status. Default is `(r) => false`.',
        type: 'Function',
      },
      {
        name: 'ok',
        desc:
          'Predicate function that determines `ok` status. `Default is (r) => true`.',
        type: 'Function',
      },
      {
        name: 'messageFn',
        desc:
          'Predicate function that constructs a message to append to each row.',
        type: 'Function',
      },
      {
        name: 'data',
        desc: 'Check data to append to output used to identify this check.',
        type: 'Object',
      },
    ],
    package: 'influxdata/influxdb/monitor',
    desc:
      'Checks input data and assigns a level (`ok`, `info`, `warn`, or `crit`) to each row based on predicate functions.',
    example:
      'import "influxdata/influxdb/monitor"\n\n\nfrom(bucket: "telegraf")\n    |> range(start: -1h)\n    |> filter(fn: (r) => r._measurement == "disk" and r._field == "used_percent")\n    |> monitor.check(\n        crit: (r) => r._value > 90.0,\n        warn: (r) => r._value > 80.0,\n        info: (r) => r._value > 70.0,\n        ok: (r) => r._value <= 60.0,\n        messageFn: (r) =>\n            if r._level == "crit" then\n                "Critical alert!! Disk usage is at ${r._value}%!"\n            else if r._level == "warn" then\n                "Warning! Disk usage is at ${r._value}%."\n            else if r._level == "info" then\n                "Disk usage is at ${r._value}%."\n            else\n                "Things are looking good.",\n        data: {\n            _check_name: "Disk Utilization (Used Percentage)",\n            _check_id: "disk_used_percent",\n            _type: "threshold",\n            tags: {},\n        },\n    )',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/monitor/check/',
  },
  {
    name: 'monitor.deadman',
    args: [
      {
        name: 't',
        desc: 'Time threshold for the deadman check.',
        type: 'Object',
      },
    ],
    package: 'influxdata/influxdb/monitor',
    desc:
      'Detects when a group stops reporting data. It takes a stream of tables and reports if groups have been observed since time `t`.',
    example:
      'import "influxdata/influxdb/monitor"\n\n// setup and processing omitted\n\n\ndata\n    |> monitor.deadman(t: 2021-01-01T00:05:00Z)',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/monitor/deadman/',
  },
  {
    name: 'monitor.from',
    args: [
      {
        name: 'start',
        desc: 'Earliest time to include in results.',
        type: 'Object',
      },
      {
        name: 'stop',
        desc: 'Latest time to include in results. Default is `now()`.',
        type: 'Object',
      },
      {
        name: 'fn',
        desc: 'Predicate function that evaluates true or false.',
        type: 'Function',
      },
    ],
    package: 'influxdata/influxdb/monitor',
    desc:
      'Retrieves check statuses stored in the `statuses` measurement in the `_monitoring` bucket.',
    example:
      'import "influxdata/influxdb/monitor"\n\nmonitor.from(start: -1h, fn: (r) => r._level == "crit")',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/monitor/from/',
  },
  {
    name: 'monitor.log',
    args: [],
    package: 'influxdata/influxdb/monitor',
    desc: 'Persists notification events to an InfluxDB bucket.',
    example: 'monitor.log()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/monitor/log/',
  },
  {
    name: 'monitor.logs',
    args: [
      {
        name: 'start',
        desc: 'Earliest time to include in results.',
        type: 'Object',
      },
      {
        name: 'stop',
        desc: 'Latest time to include in results. Default is `now()`.',
        type: 'Object',
      },
      {
        name: 'fn',
        desc: 'Predicate function that evaluates true or false.',
        type: 'Function',
      },
    ],
    package: 'influxdata/influxdb/monitor',
    desc:
      'Retrieves notification events stored in the `notifications` measurement in the `_monitoring` bucket.',
    example:
      'import "influxdata/influxdb/monitor"\n\nmonitor.logs(start: -2h, fn: (r) => true)',
    category: 'Inputs',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/monitor/logs/',
  },
  {
    name: 'monitor.notify',
    args: [
      {
        name: 'endpoint',
        desc:
          'A function that constructs and sends the notification to an endpoint.',
        type: 'Function',
      },
      {
        name: 'data',
        desc: 'Notification data to append to the output.',
        type: 'Object',
      },
    ],
    package: 'influxdata/influxdb/monitor',
    desc:
      'Sends a notification to an endpoint and logs it in the `notifications` measurement in the `_monitoring` bucket.',
    example:
      'import "influxdata/influxdb/monitor"\n\n// setup and processing omitted\n\n\nmonitor.from(range: -5m, fn: (r) => r._level == "crit")\n    |> range(start: -5m)\n    |> monitor.notify(endpoint: endpoint, data: notification_data)',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/monitor/notify/',
  },
  {
    name: 'monitor.stateChanges',
    args: [
      {
        name: 'fromLevel',
        desc: 'Level to detect a change from. Default is `"any"`.',
        type: 'Object',
      },
      {
        name: 'toLevel',
        desc: 'Level to detect a change to. Default is `"any"`.',
        type: 'Object',
      },
    ],
    package: 'influxdata/influxdb/monitor',
    desc:
      'Detects state changes in a stream of data with a `_level` column and outputs records that change from `fromLevel` to `toLevel`.',
    example:
      'import "influxdata/influxdb/monitor"\n\n// setup and processing omitted\n\n\ndata\n    |> monitor.stateChanges(toLevel: "crit")',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/monitor/statechanges/',
  },
  {
    name: 'monitor.stateChangesOnly',
    args: [],
    package: 'influxdata/influxdb/monitor',
    desc:
      'Takes a stream of tables that contains a _level column and returns a stream of tables grouped by `_level` where each record represents a state change.',
    example:
      'import "influxdata/influxdb/monitor"\n\n// setup and processing omitted\n\n\ndata\n    |> monitor.stateChangesOnly()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/monitor/statechangesonly/',
  },
  {
    name: 'monitor.write',
    args: [],
    package: 'influxdata/influxdb/monitor',
    desc: 'Persists check statuses to an InfluxDB bucket.',
    example: 'monitor.write()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/monitor/write/',
  },
  {
    name: 'mqtt.publish',
    args: [
      {
        name: 'broker',
        desc: 'MQTT broker connection string.',
        type: 'String',
      },
      {
        name: 'topic',
        desc: 'MQTT topic to send data to.',
        type: 'String',
      },
      {
        name: 'message',
        desc: 'Message to send to the MQTT broker.',
        type: 'String',
      },
      {
        name: 'qos',
        desc: 'MQTT Quality of Service (QoS) level. Values range from `[0-2]`.',
        type: 'Integer',
      },
      {
        name: 'retain',
        desc: 'MQTT retain flag. Default is `false`.',
        type: 'Boolean',
      },
      {
        name: 'clientid',
        desc: 'MQTT client ID.',
        type: 'String',
      },
      {
        name: 'username',
        desc: 'Username to send to the MQTT broker.',
        type: 'String',
      },
      {
        name: 'password',
        desc: 'Password to send to the MQTT broker.',
        type: 'String',
      },
      {
        name: 'timeout',
        desc: 'MQTT connection timeout. Default is `1s`.',
        type: 'Duration',
      },
    ],
    package: 'experimental/mqtt',
    desc: 'Sends data to an MQTT broker using MQTT protocol.',
    example:
      'import "experimental/mqtt"\n\nmqtt.publish(\n    broker: "tcp://localhost:8883",\n    topic: "alerts",\n    message: "wake up",\n    clientid: "alert-watcher",\n    retain: true,\n)',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/mqtt/publish/',
  },
  {
    name: 'naiveBayesClassifier.naiveBayes',
    args: [
      {
        name: 'myMeasurement',
        desc: 'Measurement to use as training data.',
        type: 'Object',
      },
      {
        name: 'myField',
        desc: 'Field to use as training data.',
        type: 'Object',
      },
      {
        name: 'myClass',
        desc: 'Class to classify against.',
        type: 'String',
      },
    ],
    package: 'contrib/RohanSreerama5/naiveBayesClassifier',
    desc: 'Performs a naive Bayes classification.',
    example: 'naiveBayesClassifier.naiveBayes()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/RohanSreerama5/naiveBayesClassifier/naivebayes/',
  },
  {
    name: 'now',
    args: [],
    package: '',
    desc:
      'Is a function option that, by default, returns the current system time.',
    example: 'data\n    |> range(start: -10h, stop: now())',
    category: 'Date/time',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/now/',
  },
  {
    name: 'oee.APQ',
    args: [
      {
        name: 'runningState',
        desc: 'State value that represents a running state.',
        type: 'Object',
      },
      {
        name: 'plannedTime',
        desc: 'Total time that equipment is expected to produce parts.',
        type: 'Object',
      },
      {
        name: 'idealCycleTime',
        desc: 'Ideal minimum time to produce one part.',
        type: 'Object',
      },
    ],
    package: 'experimental/oee',
    desc:
      'Computes availability, performance, quality (APQ) and overall equipment effectiveness (OEE) in producing parts.',
    example: 'oee.APQ()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/oee/apq/',
  },
  {
    name: 'oee.computeAPQ',
    args: [
      {
        name: 'productionEvents',
        desc: 'Production events stream that contains the production',
        type: 'Stream of tables',
      },
      {
        name: 'partEvents',
        desc:
          'Part events that contains the running totals of parts produced and',
        type: 'Stream of tables',
      },
      {
        name: 'runningState',
        desc: 'State value that represents a running state.',
        type: 'Object',
      },
      {
        name: 'plannedTime',
        desc: 'Total time that equipment is expected to produce parts.',
        type: 'Object',
      },
      {
        name: 'idealCycleTime',
        desc: 'Ideal minimum time to produce one part.',
        type: 'Object',
      },
    ],
    package: 'experimental/oee',
    desc:
      'Computes availability, performance, and quality (APQ) and overall equipment effectiveness (OEE) using two separate input streams: **production events** and **part events**.',
    example: 'oee.computeAPQ()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/oee/computeapq/',
  },
  {
    name: 'opsgenie.endpoint',
    args: [
      {
        name: 'url',
        desc:
          'Opsgenie API URL. Defaults to `https://api.opsgenie.com/v2/alerts`.',
        type: 'String',
      },
      {
        name: 'apiKey',
        desc: '(Required) Opsgenie API authorization key.',
        type: 'String',
      },
      {
        name: 'entity',
        desc: 'Alert entity used to specify the alert domain.',
        type: 'String',
      },
    ],
    package: 'contrib/sranka/opsgenie',
    desc: 'Sends an alert message to Opsgenie using data from table rows.',
    example:
      'import "contrib/sranka/opsgenie"\n\n// setup and processing omitted\n\nendpoint = opsgenie.endpoint(apiKey: apiKey)',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/sranka/opsgenie/endpoint/',
  },
  {
    name: 'opsgenie.respondersToJSON',
    args: [
      {
        name: 'v',
        desc: '(Required) Array of Opsgenie responder strings.',
        type: 'Array',
      },
    ],
    package: 'contrib/sranka/opsgenie',
    desc:
      'Converts an array of Opsgenie responder strings to a string-encoded JSON array that can be embedded in an alert message.',
    example: 'opsgenie.respondersToJSON()',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/sranka/opsgenie/responderstojson/',
  },
  {
    name: 'opsgenie.sendAlert',
    args: [
      {
        name: 'url',
        desc:
          'Opsgenie API URL. Defaults to `https://api.opsgenie.com/v2/alerts`.',
        type: 'String',
      },
      {
        name: 'apiKey',
        desc: '(Required) Opsgenie API authorization key.',
        type: 'String',
      },
      {
        name: 'message',
        desc: '(Required) Alert message text.',
        type: 'String',
      },
      {
        name: 'alias',
        desc: 'Opsgenie alias usee to de-deduplicate alerts.',
        type: 'String',
      },
      {
        name: 'description',
        desc: 'Alert description. 15000 characters or less.',
        type: 'String',
      },
      {
        name: 'priority',
        desc: 'Opsgenie alert priority.',
        type: 'String',
      },
      {
        name: 'responders',
        desc: 'List of responder teams or users.',
        type: 'Array',
      },
      {
        name: 'tags',
        desc: 'Alert tags.',
        type: 'Object',
      },
      {
        name: 'entity',
        desc: 'Alert entity used to specify the alert domain.',
        type: 'String',
      },
      {
        name: 'actions',
        desc: 'List of actions available for the alert.',
        type: 'Object',
      },
      {
        name: 'details',
        desc:
          'Additional alert details. Must be a JSON-encoded map of key-value string pairs.',
        type: 'Object',
      },
      {
        name: 'visibleTo',
        desc:
          'List of teams and users the alert will be visible to without sending notifications.',
        type: 'Array',
      },
    ],
    package: 'contrib/sranka/opsgenie',
    desc: 'Sends an alert message to Opsgenie.',
    example:
      'import "contrib/sranka/opsgenie"\n\n// setup and processing omitted\n\nopsgenie.sendAlert(\n    apiKey: apiKey,\n    message: "Disk usage is: ${lastReported.status}.",\n    alias: "example-disk-usage",\n    responders: ["user:john@example.com", "team:itcrowd"],\n)',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/sranka/opsgenie/sendalert/',
  },
  {
    name: 'pagerduty.actionFromLevel',
    args: [
      {
        name: 'level',
        desc: 'Monitoring level to convert to a PagerDuty action.',
        type: 'String',
      },
    ],
    package: 'pagerduty',
    desc: 'Converts a monitoring level to a PagerDuty action.',
    example: 'import "pagerduty"\n\npagerduty.actionFromLevel(level: "crit")',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/pagerduty/actionfromlevel/',
  },
  {
    name: 'pagerduty.actionFromSeverity',
    args: [
      {
        name: 'severity',
        desc: 'Severity to convert to a PagerDuty action.',
        type: 'String',
      },
    ],
    package: 'pagerduty',
    desc: 'Converts a severity to a PagerDuty action.',
    example:
      'import "pagerduty"\n\npagerduty.actionFromSeverity(severity: "crit")',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/pagerduty/actionfromseverity/',
  },
  {
    name: 'pagerduty.dedupKey',
    args: [
      {
        name: 'exclude',
        desc:
          'Group key columns to exclude when generating the deduplication key.',
        type: 'Array',
      },
    ],
    package: 'pagerduty',
    desc:
      'Uses the group key of an input table to generate and store a deduplication key in the `_pagerdutyDedupKey`column. The function sorts, newline-concatenates, SHA256-hashes, and hex-encodes the group key to create a unique deduplication key for each input table.',
    example:
      'import "pagerduty"\nimport "sampledata"\n\nsampledata.int()\n    |> pagerduty.dedupKey()',
    category: 'Notification endpoints',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/pagerduty/dedupkey/',
  },
  {
    name: 'pagerduty.endpoint',
    args: [
      {
        name: 'url',
        desc: 'PagerDuty v2 Events API URL.',
        type: 'String',
      },
    ],
    package: 'pagerduty',
    desc:
      'Returns a function that sends a message to PagerDuty that includes output data.',
    example:
      'import "pagerduty"\n\n// setup and processing omitted\n\ntoPagerDuty = pagerduty.endpoint()',
    category: 'Notification endpoints',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/pagerduty/endpoint/',
  },
  {
    name: 'pagerduty.sendEvent',
    args: [
      {
        name: 'pagerdutyURL',
        desc: 'PagerDuty endpoint URL.',
        type: 'String',
      },
      {
        name: 'routingKey',
        desc: 'Routing key generated from your PagerDuty integration.',
        type: 'Object',
      },
      {
        name: 'client',
        desc: 'Name of the client sending the alert.',
        type: 'Object',
      },
      {
        name: 'clientURL',
        desc: 'URL of the client sending the alert.',
        type: 'Object',
      },
      {
        name: 'dedupKey',
        desc: 'Per-alert ID that acts as deduplication key and allows you to',
        type: 'Object',
      },
      {
        name: 'class',
        desc: 'Class or type of the event.',
        type: 'Object',
      },
      {
        name: 'group',
        desc: 'Logical grouping used by PagerDuty.',
        type: 'Object',
      },
      {
        name: 'severity',
        desc: 'Severity of the event.',
        type: 'Object',
      },
      {
        name: 'eventAction',
        desc: 'Event type to send to PagerDuty.',
        type: 'Object',
      },
      {
        name: 'source',
        desc: 'Unique location of the affected system.',
        type: 'Object',
      },
      {
        name: 'component',
        desc: 'Component responsible for the event.',
        type: 'Object',
      },
      {
        name: 'summary',
        desc:
          'Brief text summary of the event used as the summaries or titles of associated alerts.',
        type: 'String',
      },
      {
        name: 'timestamp',
        desc: 'Time the detected event occurred in RFC3339nano format.',
        type: 'Object',
      },
      {
        name: 'customDetails',
        desc: 'Record with additional details about the event.',
        type: 'Object',
      },
    ],
    package: 'pagerduty',
    desc:
      'Sends an event to PagerDuty and returns the HTTP response code of the request.',
    example:
      'import "pagerduty"\nimport "pagerduty"\n\npagerduty.sendEvent(\n    routingKey: "example-routing-key",\n    client: "example-client",\n    clientURL: "http://example-url.com",\n    dedupKey: "example-dedup-key",\n    class: "example-class",\n    eventAction: "trigger",\n    group: "example-group",\n    severity: "crit",\n    component: "example-component",\n    source: "example-source",\n    summary: "example-summary",\n    timestamp: now(),\n    customDetails: {"example-key": "example value"},\n)',
    category: 'Notification endpoints',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/pagerduty/sendevent/',
  },
  {
    name: 'pagerduty.severityFromLevel',
    args: [
      {
        name: 'level',
        desc: 'InfluxDB status level to convert to a PagerDuty severity.',
        type: 'String',
      },
    ],
    package: 'pagerduty',
    desc: 'Converts an InfluxDB status level to a PagerDuty severity.',
    example: 'import "pagerduty"\n\npagerduty.severityFromLevel(level: "crit")',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/pagerduty/severityfromlevel/',
  },
  {
    name: 'polyline.rdp',
    args: [
      {
        name: 'valColumn',
        desc:
          'Column with Y axis values of the given curve. Default is `_value`.',
        type: 'String',
      },
      {
        name: 'timeColumn',
        desc:
          'Column with X axis values of the given curve. Default is `_time`.',
        type: 'String',
      },
      {
        name: 'epsilon',
        desc:
          'Maximum tolerance value that determines the amount of compression.',
        type: 'Float',
      },
      {
        name: 'retention',
        desc: 'Percentage of points to retain after downsampling.',
        type: 'Float',
      },
    ],
    package: 'experimental/polyline',
    desc:
      'Applies the Ramer Douglas Peucker (RDP) algorithm to input data to downsample curves composed of line segments into visually indistinguishable curves with fewer points.',
    example: 'import "experimental/polyline"\n\ndata\n    |> polyline.rdp()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/polyline/rdp/',
  },
  {
    name: 'promql.changes',
    args: [],
    package: 'internal/promql',
    desc:
      "Implements functionality equivalent to PromQL's `changes()` function (https://prometheus.io/docs/prometheus/latest/querying/functions/#changes).",
    example:
      'import "internal/promql"\nimport "sampledata"\n\nsampledata.float()\n    |> promql.changes()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/internal/promql/changes/',
  },
  {
    name: 'promql.emptyTable',
    args: [],
    package: 'internal/promql',
    desc:
      "Returns an empty table, which is used as a helper function to implement PromQL's `time()` (https://prometheus.io/docs/prometheus/latest/querying/functions/#time) and `vector()` (https://prometheus.io/docs/prometheus/latest/querying/functions/#vector) functions.",
    example: 'promql.emptyTable()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/internal/promql/emptytable/',
  },
  {
    name: 'promql.extrapolatedRate',
    args: [
      {
        name: 'isCounter',
        desc: 'Data represents a counter.',
        type: 'Boolean',
      },
      {
        name: 'isRate',
        desc: 'Data represents a rate.',
        type: 'Boolean',
      },
    ],
    package: 'internal/promql',
    desc:
      "Is a helper function that calculates extrapolated rates over counters and is used to implement PromQL's `rate()` (https://prometheus.io/docs/prometheus/latest/querying/functions/#rate), `delta()` (https://prometheus.io/docs/prometheus/latest/querying/functions/#increase), and `increase()` (https://prometheus.io/docs/prometheus/latest/querying/functions/#delta) functions.",
    example: 'promql.extrapolatedRate()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/internal/promql/extrapolatedrate/',
  },
  {
    name: 'promql.holtWinters',
    args: [
      {
        name: 'smoothingFactor',
        desc: 'Exponential smoothing factor.',
        type: 'Float',
      },
      {
        name: 'trendFactor',
        desc: 'Trend factor.',
        type: 'Float',
      },
    ],
    package: 'internal/promql',
    desc:
      "Implements functionality equivalent to PromQL's `holt_winters()` function (https://prometheus.io/docs/prometheus/latest/querying/functions/#holt_winters).",
    example: 'promql.holtWinters()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/internal/promql/holtwinters/',
  },
  {
    name: 'promql.instantRate',
    args: [
      {
        name: 'isRate',
        desc: 'Data represents a rate.',
        type: 'Boolean',
      },
    ],
    package: 'internal/promql',
    desc:
      "Is a helper function that calculates instant rates over counters and is used to implement PromQL's `irate()` (https://prometheus.io/docs/prometheus/latest/querying/functions/#irate) and `idelta()` (https://prometheus.io/docs/prometheus/latest/querying/functions/#idelta) functions.",
    example: 'promql.instantRate()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/internal/promql/instantrate/',
  },
  {
    name: 'promql.join',
    args: [
      {
        name: 'left',
        desc: 'First of two streams of tables to join.',
        type: 'Stream of tables',
      },
      {
        name: 'right',
        desc: 'Second of two streams of tables to join.',
        type: 'Stream of tables',
      },
      {
        name: 'fn',
        desc:
          'Function with left and right arguments that maps a new output record',
        type: 'Function',
      },
    ],
    package: 'internal/promql',
    desc:
      'Joins two streams of tables on the **group key and `_time` column**. See `experimental.join` (/flux/v0/stdlib/experimental/join/).',
    example: 'promql.join()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/internal/promql/join/',
  },
  {
    name: 'promql.labelReplace',
    args: [
      {
        name: 'source',
        desc: 'Input label.',
        type: 'String',
      },
      {
        name: 'destination',
        desc: 'Output label.',
        type: 'String',
      },
      {
        name: 'regex',
        desc: 'Pattern as a regex string.',
        type: 'String',
      },
      {
        name: 'replacement',
        desc: 'Replacement value.',
        type: 'String',
      },
    ],
    package: 'internal/promql',
    desc:
      "Implements functionality equivalent to PromQL's `label_replace()` function (https://prometheus.io/docs/prometheus/latest/querying/functions/#label_replace).",
    example: 'promql.labelReplace()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/internal/promql/labelreplace/',
  },
  {
    name: 'promql.linearRegression',
    args: [
      {
        name: 'predict',
        desc: 'Output should contain a prediction.',
        type: 'Boolean',
      },
      {
        name: 'fromNow',
        desc: 'Time as a floating point value.',
        type: 'Float',
      },
    ],
    package: 'internal/promql',
    desc:
      "Implements linear regression functionality required to implement PromQL's `deriv()` (https://prometheus.io/docs/prometheus/latest/querying/functions/#deriv) and `predict_linear()` (https://prometheus.io/docs/prometheus/latest/querying/functions/#predict_linear) functions.",
    example: 'promql.linearRegression()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/internal/promql/linearregression/',
  },
  {
    name: 'promql.promHistogramQuantile',
    args: [
      {
        name: 'quantile',
        desc: 'Quantile to compute (`[0.0 - 1.0]`).',
        type: 'Float',
      },
      {
        name: 'countColumn',
        desc: 'Count column name.',
        type: 'String',
      },
      {
        name: 'upperBoundColumn',
        desc: 'Upper bound column name.',
        type: 'String',
      },
      {
        name: 'valueColumn',
        desc: 'Output value column name.',
        type: 'String',
      },
    ],
    package: 'internal/promql',
    desc:
      "Implements functionality equivalent to PromQL's `histogram_quantile()` function (https://prometheus.io/docs/prometheus/latest/querying/functions/#histogram_quantile).",
    example: 'promql.promHistogramQuantile()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/internal/promql/promhistogramquantile/',
  },
  {
    name: 'promql.promqlDayOfMonth',
    args: [
      {
        name: 'timestamp',
        desc: 'Time as a floating point value.',
        type: 'Float',
      },
    ],
    package: 'internal/promql',
    desc:
      "Implements functionality equivalent to PromQL's `day_of_month()` function (https://prometheus.io/docs/prometheus/latest/querying/functions/#day_of_month).",
    example: 'promql.promqlDayOfMonth()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/internal/promql/promqldayofmonth/',
  },
  {
    name: 'promql.promqlDayOfWeek',
    args: [
      {
        name: 'timestamp',
        desc: 'Time as a floating point value.',
        type: 'Float',
      },
    ],
    package: 'internal/promql',
    desc:
      "Implements functionality equivalent to PromQL's `day_of_week()` function (https://prometheus.io/docs/prometheus/latest/querying/functions/#day_of_week).",
    example: 'promql.promqlDayOfWeek()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/internal/promql/promqldayofweek/',
  },
  {
    name: 'promql.promqlDaysInMonth',
    args: [
      {
        name: 'timestamp',
        desc: 'Time as a floating point value.',
        type: 'Float',
      },
    ],
    package: 'internal/promql',
    desc:
      "Implements functionality equivalent to PromQL's `days_in_month()` function (https://prometheus.io/docs/prometheus/latest/querying/functions/#days_in_month).",
    example: 'promql.promqlDaysInMonth()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/internal/promql/promqldaysinmonth/',
  },
  {
    name: 'promql.promqlHour',
    args: [
      {
        name: 'timestamp',
        desc: 'Time as a floating point value.',
        type: 'Float',
      },
    ],
    package: 'internal/promql',
    desc:
      "Implements functionality equivalent to PromQL's `hour()` function (https://prometheus.io/docs/prometheus/latest/querying/functions/#hour).",
    example: 'promql.promqlHour()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/internal/promql/promqlhour/',
  },
  {
    name: 'promql.promqlMinute',
    args: [
      {
        name: 'timestamp',
        desc: 'Time as a floating point value.',
        type: 'Float',
      },
    ],
    package: 'internal/promql',
    desc:
      "Implements functionality equivalent to PromQL's `minute()` function ( https://prometheus.io/docs/prometheus/latest/querying/functions/#minute).",
    example: 'promql.promqlMinute()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/internal/promql/promqlminute/',
  },
  {
    name: 'promql.promqlMonth',
    args: [
      {
        name: 'timestamp',
        desc: 'Time as a floating point value.',
        type: 'Float',
      },
    ],
    package: 'internal/promql',
    desc:
      "Implements functionality equivalent to PromQL's `month()` function (https://prometheus.io/docs/prometheus/latest/querying/functions/#month).",
    example: 'promql.promqlMonth()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/internal/promql/promqlmonth/',
  },
  {
    name: 'promql.promqlYear',
    args: [
      {
        name: 'timestamp',
        desc: 'Time as a floating point value.',
        type: 'Float',
      },
    ],
    package: 'internal/promql',
    desc:
      "Implements functionality equivalent to PromQL's `year()` function (https://prometheus.io/docs/prometheus/latest/querying/functions/#year).",
    example: 'promql.promqlYear()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/internal/promql/promqlyear/',
  },
  {
    name: 'promql.quantile',
    args: [
      {
        name: 'q',
        desc: 'Quantile to compute (`[0.0 - 1.0]`).',
        type: 'Float',
      },
      {
        name: 'method',
        desc: 'Quantile method to use.',
        type: 'String',
      },
    ],
    package: 'internal/promql',
    desc:
      'Accounts checks for quantile values that are out of range, above 1.0 or below 0.0, by either returning positive infinity or negative infinity in the `_value` column respectively. `q` must be a float.',
    example: 'promql.quantile()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/internal/promql/quantile/',
  },
  {
    name: 'promql.resets',
    args: [],
    package: 'internal/promql',
    desc:
      "Implements functionality equivalent to PromQL's `resets()` function (https://prometheus.io/docs/prometheus/latest/querying/functions/#resets).",
    example: 'promql.resets()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/internal/promql/resets/',
  },
  {
    name: 'promql.timestamp',
    args: [],
    package: 'internal/promql',
    desc:
      "Implements functionality equivalent to PromQL's `timestamp()` function (https://prometheus.io/docs/prometheus/latest/querying/functions/#timestamp).",
    example:
      'import "internal/promql"\nimport "sampledata"\n\nsampledata.float()\n    |> promql.timestamp()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/internal/promql/timestamp/',
  },
  {
    name: 'pushbullet.endpoint',
    args: [
      {
        name: 'url',
        desc:
          'PushBullet API endpoint URL. Default is `"https://api.pushbullet.com/v2/pushes"`.',
        type: 'String',
      },
      {
        name: 'token',
        desc: 'Pushbullet API token string. Default is `""`.',
        type: 'Object',
      },
    ],
    package: 'pushbullet',
    desc:
      'Creates the endpoint for the Pushbullet API and sends a notification of type note.',
    example:
      'import "pushbullet"\n\n// setup and processing omitted\n\n\ncrit_statuses\n    |> pushbullet.endpoint(token: token)(\n        mapFn: (r) =>\n            ({\n                title: "${r.component} is critical",\n                text: "${r.component} is critical. {$r._field} is {r._value}.",\n            }),\n    )()',
    category: 'Notification endpoints',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/pushbullet/endpoint/',
  },
  {
    name: 'pushbullet.pushData',
    args: [
      {
        name: 'url',
        desc:
          'URL of the PushBullet endpoint. Default is `"https://api.pushbullet.com/v2/pushes"`.',
        type: 'String',
      },
      {
        name: 'token',
        desc: 'API token string. Default is `""`.',
        type: 'Object',
      },
      {
        name: 'data',
        desc:
          "Data to send to the endpoint. Data is JSON-encoded and sent to the Pushbullet's endpoint.",
        type: 'Object',
      },
    ],
    package: 'pushbullet',
    desc: 'Sends a push notification to the Pushbullet API.',
    example:
      'import "pushbullet"\n\npushbullet.pushData(\n    token: "mY5up3Rs3Cre7T0k3n",\n    data: {\n        "type": "link",\n        "title": "Example title",\n        "body": "Example nofication body",\n        "url": "http://example-url.com",\n    },\n)',
    category: 'Notification endpoints',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/pushbullet/pushdata/',
  },
  {
    name: 'pushbullet.pushNote',
    args: [
      {
        name: 'url',
        desc:
          'URL of the PushBullet endpoint. Default is `"https://api.pushbullet.com/v2/pushes"`.',
        type: 'String',
      },
      {
        name: 'token',
        desc: 'API token string. Defaults to: `""`.',
        type: 'Object',
      },
      {
        name: 'title',
        desc: 'Title of the notification.',
        type: 'Object',
      },
      {
        name: 'text',
        desc: 'Text to display in the notification.',
        type: 'Object',
      },
    ],
    package: 'pushbullet',
    desc: 'Sends a push notification of type "note" to the Pushbullet API.',
    example:
      'import "pushbullet"\n\npushbullet.pushNote(\n    token: "mY5up3Rs3Cre7T0k3n",\n    data: {"type": "link", "title": "Example title", "text": "Example note text"},\n)',
    category: 'Notification endpoints',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/pushbullet/pushnote/',
  },
  {
    name: 'record.get',
    args: [
      {
        name: 'r',
        desc: 'Record to retrieve the value from.',
        type: 'Object',
      },
      {
        name: 'key',
        desc: 'Property key to retrieve.',
        type: 'String',
      },
      {
        name: 'default',
        desc:
          'Default value to return if the specified key does not exist in the record.',
        type: 'Object',
      },
    ],
    package: 'experimental/record',
    desc:
      'Returns a value from a record by key name or a default value if the key doesn’t exist in the record.',
    example:
      'import "experimental/record"\n\nkey = "foo"\nexampleRecord = {foo: 1.0, bar: "hello"}\n\nrecord.get(r: exampleRecord, key: key, default: "")',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/record/get/',
  },
  {
    name: 'requests.do',
    args: [
      {
        name: 'method',
        desc: 'method of the http request.',
        type: 'String',
      },
      {
        name: 'url',
        desc: 'URL to request. This should not include any query parameters.',
        type: 'String',
      },
      {
        name: 'params',
        desc: 'Set of key value pairs to add to the URL as query parameters.',
        type: 'Array',
      },
      {
        name: 'headers',
        desc: 'Set of key values pairs to include on the request.',
        type: 'Array',
      },
      {
        name: 'body',
        desc: 'Data to send with the request.',
        type: 'Bytes',
      },
      {
        name: 'config',
        desc: 'Set of options to control how the request should be performed.',
        type: 'Object',
      },
    ],
    package: 'http/requests',
    desc: 'Makes an http request.',
    example:
      'import "http/requests"\n\nresponse = requests.do(url: "http://example.com", method: "GET")\n\nrequests.peek(response: response)',
    category: 'Inputs',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/http/requests/do/',
  },
  {
    name: 'requests.get',
    args: [
      {
        name: 'url',
        desc: 'URL to request. This should not include any query parameters.',
        type: 'String',
      },
      {
        name: 'params',
        desc: 'Set of key value pairs to add to the URL as query parameters.',
        type: 'Array',
      },
      {
        name: 'headers',
        desc: 'Set of key values pairs to include on the request.',
        type: 'Array',
      },
      {
        name: 'body',
        desc: 'Data to send with the request.',
        type: 'Bytes',
      },
      {
        name: 'config',
        desc: 'Set of options to control how the request should be performed.',
        type: 'Object',
      },
    ],
    package: 'http/requests',
    desc:
      'Makes a http GET request. This identical to calling `request.do(method: "GET", ...)`.',
    example:
      'import "http/requests"\n\nresponse = requests.get(url: "http://example.com")\n\nrequests.peek(response: response)',
    category: 'Inputs',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/http/requests/get/',
  },
  {
    name: 'requests.peek',
    args: [
      {
        name: 'response',
        desc: 'Response data from an HTTP request.',
        type: 'Object',
      },
    ],
    package: 'http/requests',
    desc: 'Converts an HTTP response into a table for easy inspection.',
    example:
      'import "http/requests"\n\nrequests.peek(response: requests.get(url: "https://api.agify.io", params: ["name": ["natalie"]]))',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/http/requests/peek/',
  },
  {
    name: 'requests.post',
    args: [
      {
        name: 'url',
        desc: 'URL to request. This should not include any query parameters.',
        type: 'String',
      },
      {
        name: 'params',
        desc: 'Set of key value pairs to add to the URL as query parameters.',
        type: 'Array',
      },
      {
        name: 'headers',
        desc: 'Set of key values pairs to include on the request.',
        type: 'Array',
      },
      {
        name: 'body',
        desc: 'Data to send with the request.',
        type: 'Bytes',
      },
      {
        name: 'config',
        desc: 'Set of options to control how the request should be performed.',
        type: 'Object',
      },
    ],
    package: 'http/requests',
    desc:
      'Makes a http POST request. This identical to calling `request.do(method: "POST", ...)`.',
    example:
      'import "http/requests"\nimport "json"\n\n// setup and processing omitted\n\n    requests.post(\n        url: "https://goolnk.com/api/v1/shorten",\n        body: json.encode(v: {url: "http://www.influxdata.com"}),\n        headers: ["Content-Type": "application/json"],\n    )',
    category: 'Inputs',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/http/requests/post/',
  },
  {
    name: 'sample.alignToNow',
    args: [],
    package: 'influxdata/influxdb/sample',
    desc:
      'Shifts time values in input data to align the chronological last point to _now_.',
    example:
      'import "influxdata/influxdb/sample"\n\nsample.data(set: "birdMigration")\n    |> sample.alignToNow()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/sample/aligntonow/',
  },
  {
    name: 'sample.data',
    args: [
      {
        name: 'set',
        desc: 'Sample data set to download and output.',
        type: 'String',
      },
    ],
    package: 'influxdata/influxdb/sample',
    desc: 'Downloads a specified InfluxDB sample dataset.',
    example: 'sample.data()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/sample/data/',
  },
  {
    name: 'sample.list',
    args: [],
    package: 'influxdata/influxdb/sample',
    desc: 'Outputs information about available InfluxDB sample datasets.',
    example: 'import "influxdata/influxdb/sample"\n\nsample.list()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/sample/list/',
  },
  {
    name: 'sampledata.bool',
    args: [
      {
        name: 'includeNull',
        desc: 'Include null values in the returned dataset.',
        type: 'Boolean',
      },
    ],
    package: 'sampledata',
    desc: 'Returns a sample data set with boolean values.',
    example: 'import "sampledata"\n\nsampledata.bool()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/sampledata/bool/',
  },
  {
    name: 'sampledata.float',
    args: [
      {
        name: 'includeNull',
        desc: 'Include null values in the returned dataset.',
        type: 'Boolean',
      },
    ],
    package: 'sampledata',
    desc: 'Returns a sample data set with float values.',
    example: 'import "sampledata"\n\nsampledata.float()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/sampledata/float/',
  },
  {
    name: 'sampledata.int',
    args: [
      {
        name: 'includeNull',
        desc: 'Include null values in the returned dataset.',
        type: 'Boolean',
      },
    ],
    package: 'sampledata',
    desc: 'Returns a sample data set with integer values.',
    example: 'import "sampledata"\n\nsampledata.int()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/sampledata/int/',
  },
  {
    name: 'sampledata.numericBool',
    args: [
      {
        name: 'includeNull',
        desc: 'Include null values in the returned dataset.',
        type: 'Boolean',
      },
    ],
    package: 'sampledata',
    desc: 'Returns a sample data set with numeric (integer) boolean values.',
    example: 'import "sampledata"\n\nsampledata.numericBool()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/sampledata/numericbool/',
  },
  {
    name: 'sampledata.string',
    args: [
      {
        name: 'includeNull',
        desc: 'Include null values in the returned dataset.',
        type: 'Boolean',
      },
    ],
    package: 'sampledata',
    desc: 'Returns a sample data set with string values.',
    example: 'import "sampledata"\n\nsampledata.string()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/sampledata/string/',
  },
  {
    name: 'sampledata.uint',
    args: [
      {
        name: 'includeNull',
        desc: 'Include null values in the returned dataset.',
        type: 'Boolean',
      },
    ],
    package: 'sampledata',
    desc: 'Returns a sample data set with unsigned integer values.',
    example: 'import "sampledata"\n\nsampledata.uint()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/sampledata/uint/',
  },
  {
    name: 'schema.fieldKeys',
    args: [
      {
        name: 'bucket',
        desc: 'Bucket to list field keys from.',
        type: 'String',
      },
      {
        name: 'predicate',
        desc: 'Predicate function that filters field keys.',
        type: 'Function',
      },
      {
        name: 'start',
        desc: 'Oldest time to include in results. Default is `-30d`.',
        type: 'Object',
      },
      {
        name: 'stop',
        desc: 'Newest time include in results.',
        type: 'Object',
      },
    ],
    package: 'influxdata/influxdb/schema',
    desc: 'Returns field keys in a bucket.',
    example:
      'import "influxdata/influxdb/schema"\n\nschema.fieldKeys(bucket: "example-bucket")',
    category: 'Metadata',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/schema/fieldkeys/',
  },
  {
    name: 'schema.fieldsAsCols',
    args: [],
    package: 'influxdata/influxdb/schema',
    desc:
      'Is a special application of `pivot()` that pivots input data on `_field` and `_time` columns to align fields within each input table that have the same timestamp.',
    example:
      'import "influxdata/influxdb/schema"\n\ndata\n    |> schema.fieldsAsCols()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/schema/fieldsascols/',
  },
  {
    name: 'schema.measurementFieldKeys',
    args: [
      {
        name: 'bucket',
        desc: 'Bucket to retrieve field keys from.',
        type: 'String',
      },
      {
        name: 'measurement',
        desc: 'Measurement to list field keys from.',
        type: 'Object',
      },
      {
        name: 'start',
        desc: 'Oldest time to include in results. Default is `-30d`.',
        type: 'Object',
      },
      {
        name: 'stop',
        desc: 'Newest time include in results.',
        type: 'Object',
      },
    ],
    package: 'influxdata/influxdb/schema',
    desc: 'Returns a list of fields in a measurement.',
    example:
      'import "influxdata/influxdb/schema"\n\nschema.measurementFieldKeys(bucket: "example-bucket", measurement: "example-measurement")',
    category: 'Metadata',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/schema/measurementfieldkeys/',
  },
  {
    name: 'schema.measurementTagKeys',
    args: [
      {
        name: 'bucket',
        desc: 'Bucket to return tag keys from for a specific measurement.',
        type: 'String',
      },
      {
        name: 'measurement',
        desc: 'Measurement to return tag keys from.',
        type: 'Object',
      },
      {
        name: 'start',
        desc: 'Oldest time to include in results. Default is `-30d`.',
        type: 'Object',
      },
      {
        name: 'stop',
        desc: 'Newest time include in results.',
        type: 'Object',
      },
    ],
    package: 'influxdata/influxdb/schema',
    desc: 'Returns the list of tag keys for a specific measurement.',
    example:
      'import "influxdata/influxdb/schema"\n\nschema.measurementTagKeys(bucket: "example-bucket", measurement: "example-measurement")',
    category: 'Metadata',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/schema/measurementtagkeys/',
  },
  {
    name: 'schema.measurementTagValues',
    args: [
      {
        name: 'bucket',
        desc: 'Bucket to return tag values from for a specific measurement.',
        type: 'String',
      },
      {
        name: 'measurement',
        desc: 'Measurement to return tag values from.',
        type: 'Object',
      },
      {
        name: 'tag',
        desc: 'Tag to return all unique values from.',
        type: 'String',
      },
      {
        name: 'start',
        desc: 'Oldest time to include in results. Default is `-30d`.',
        type: 'Object',
      },
      {
        name: 'stop',
        desc: 'Newest time include in results.',
        type: 'Object',
      },
    ],
    package: 'influxdata/influxdb/schema',
    desc: 'Returns a list of tag values for a specific measurement.',
    example:
      'import "influxdata/influxdb/schema"\n\nschema.measurementTagValues(\n    bucket: "example-bucket",\n    measurement: "example-measurement",\n    tag: "example-tag",\n)',
    category: 'Metadata',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/schema/measurementtagvalues/',
  },
  {
    name: 'schema.measurements',
    args: [
      {
        name: 'bucket',
        desc: 'Bucket to retrieve measurements from.',
        type: 'String',
      },
      {
        name: 'start',
        desc: 'Oldest time to include in results. Default is `-30d`.',
        type: 'Object',
      },
      {
        name: 'stop',
        desc: 'Newest time include in results.',
        type: 'Object',
      },
    ],
    package: 'influxdata/influxdb/schema',
    desc: 'Returns a list of measurements in a specific bucket.',
    example:
      'import "influxdata/influxdb/schema"\n\nschema.measurements(bucket: "example-bucket")',
    category: 'Metadata',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/schema/measurements/',
  },
  {
    name: 'schema.tagKeys',
    args: [
      {
        name: 'bucket',
        desc: 'Bucket to return tag keys from.',
        type: 'String',
      },
      {
        name: 'predicate',
        desc: 'Predicate function that filters tag keys.',
        type: 'Function',
      },
      {
        name: 'start',
        desc: 'Oldest time to include in results. Default is `-30d`.',
        type: 'Object',
      },
      {
        name: 'stop',
        desc: 'Newest time include in results.',
        type: 'Object',
      },
    ],
    package: 'influxdata/influxdb/schema',
    desc:
      'Returns a list of tag keys for all series that match the `predicate`.',
    example:
      'import "influxdata/influxdb/schema"\n\nschema.tagKeys(bucket: "example-bucket")',
    category: 'Metadata',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/schema/tagkeys/',
  },
  {
    name: 'schema.tagValues',
    args: [
      {
        name: 'bucket',
        desc: 'Bucket to return unique tag values from.',
        type: 'String',
      },
      {
        name: 'tag',
        desc: 'Tag to return unique values from.',
        type: 'String',
      },
      {
        name: 'predicate',
        desc: 'Predicate function that filters tag values.',
        type: 'Function',
      },
      {
        name: 'start',
        desc: 'Oldest time to include in results. Default is `-30d`.',
        type: 'Object',
      },
      {
        name: 'stop',
        desc: 'Newest time include in results.',
        type: 'Object',
      },
    ],
    package: 'influxdata/influxdb/schema',
    desc: 'Returns a list of unique values for a given tag.',
    example:
      'import "influxdata/influxdb/schema"\n\nschema.tagValues(bucket: "example-bucket", tag: "host")',
    category: 'Metadata',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/schema/tagvalues/',
  },
  {
    name: 'sensu.endpoint',
    args: [
      {
        name: 'url',
        desc:
          'Base URL of Sensu API (https://docs.sensu.io/sensu-go/latest/migrate/#architecture)',
        type: 'String',
      },
      {
        name: 'apiKey',
        desc:
          'Sensu API Key (https://docs.sensu.io/sensu-go/latest/operations/control-access/).',
        type: 'String',
      },
      {
        name: 'handlers',
        desc:
          'Sensu handlers (https://docs.sensu.io/sensu-go/latest/reference/handlers/) to execute.',
        type: 'Object',
      },
      {
        name: 'namespace',
        desc:
          'Sensu namespace (https://docs.sensu.io/sensu-go/latest/reference/rbac/).',
        type: 'String',
      },
      {
        name: 'entityName',
        desc: 'Event source.',
        type: 'String',
      },
    ],
    package: 'contrib/sranka/sensu',
    desc:
      'Sends an event to the Sensu Events API (https://docs.sensu.io/sensu-go/latest/api/events/#create-a-new-event) using data from table rows.',
    example:
      'import "influxdata/influxdb/secrets"\nimport "contrib/sranka/sensu"\n\ntoken = secrets.get(key: "TELEGRAM_TOKEN")\nendpoint = sensu.endpoint(url: "http://localhost:8080", apiKey: apiKey)\n\ncrit_statuses =\n    from(bucket: "example-bucket")\n        |> range(start: -1m)\n        |> filter(fn: (r) => r._measurement == "statuses" and status == "crit")\n\ncrit_statuses\n    |> endpoint(mapFn: (r) => ({checkName: "critStatus", text: "Status is critical", status: 2}))()',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/sranka/sensu/endpoint/',
  },
  {
    name: 'sensu.event',
    args: [
      {
        name: 'url',
        desc:
          'Base URL of Sensu API (https://docs.sensu.io/sensu-go/latest/migrate/#architecture)',
        type: 'String',
      },
      {
        name: 'apiKey',
        desc:
          'Sensu API Key (https://docs.sensu.io/sensu-go/latest/operations/control-access/).',
        type: 'String',
      },
      {
        name: 'checkName',
        desc: 'Check name.',
        type: 'String',
      },
      {
        name: 'text',
        desc: 'Event text.',
        type: 'Object',
      },
      {
        name: 'handlers',
        desc: 'Sensu handlers to execute. Default is `[]`.',
        type: 'Object',
      },
      {
        name: 'status',
        desc:
          'Event status code that indicates state (/flux/v0/stdlib/contrib/sranka/sensu/event/#state).',
        type: 'Object',
      },
      {
        name: 'state',
        desc: 'Event state.',
        type: 'String',
      },
      {
        name: 'namespace',
        desc:
          'Sensu namespace (https://docs.sensu.io/sensu-go/latest/reference/rbac/).',
        type: 'String',
      },
      {
        name: 'entityName',
        desc: 'Event source.',
        type: 'String',
      },
    ],
    package: 'contrib/sranka/sensu',
    desc:
      'Sends a single event to the Sensu Events API (https://docs.sensu.io/sensu-go/latest/api/events/#create-a-new-event).',
    example:
      'import "contrib/sranka/sensu"\n\n// setup and processing omitted\n\nsensu.event(\n    url: "http://localhost:8080",\n    apiKey: apiKey,\n    checkName: "diskUsage",\n    text: "Disk usage is **${lastReported.status}**.",\n)',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/sranka/sensu/event/',
  },
  {
    name: 'sensu.toSensuName',
    args: [
      {
        name: 'v',
        desc: 'String to operate on.',
        type: 'String',
      },
    ],
    package: 'contrib/sranka/sensu',
    desc:
      'Translates a string value to a Sensu name by replacing non-alphanumeric characters (`[a-zA-Z0-9_.-]`) with underscores (`_`).',
    example:
      'import "contrib/sranka/sensu"\n\nsensu.toSensuName(v: "Example name conversion")',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/sranka/sensu/tosensuname/',
  },
  {
    name: 'servicenow.endpoint',
    args: [
      {
        name: 'url',
        desc: 'ServiceNow web service URL.',
        type: 'String',
      },
      {
        name: 'username',
        desc: 'ServiceNow username to use for HTTP BASIC authentication.',
        type: 'String',
      },
      {
        name: 'password',
        desc: 'ServiceNow password to use for HTTP BASIC authentication.',
        type: 'String',
      },
      {
        name: 'source',
        desc: 'Source name. Default is `"Flux"`.',
        type: 'Object',
      },
    ],
    package: 'contrib/bonitoo-io/servicenow',
    desc:
      'Sends events to ServiceNow (https://servicenow.com/) using data from input rows.',
    example:
      'import "contrib/bonitoo-io/servicenow"\n\n// setup and processing omitted\n\n    servicenow.endpoint(\n        url: "https://example-tenant.service-now.com/api/global/em/jsonv2",\n        username: username,\n        password: password,\n    )',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/bonitoo-io/servicenow/endpoint/',
  },
  {
    name: 'servicenow.event',
    args: [
      {
        name: 'url',
        desc: 'ServiceNow web service URL.',
        type: 'String',
      },
      {
        name: 'username',
        desc: 'ServiceNow username to use for HTTP BASIC authentication.',
        type: 'String',
      },
      {
        name: 'password',
        desc: 'ServiceNow password to use for HTTP BASIC authentication.',
        type: 'String',
      },
      {
        name: 'description',
        desc: 'Event description.',
        type: 'Object',
      },
      {
        name: 'severity',
        desc: 'Severity of the event.',
        type: 'Object',
      },
      {
        name: 'source',
        desc: 'Source name. Default is `"Flux"`.',
        type: 'Object',
      },
      {
        name: 'node',
        desc: 'Node name or IP address related to the event.',
        type: 'Object',
      },
      {
        name: 'metricType',
        desc: 'Metric type related to the event (for example, `CPU`).',
        type: 'Object',
      },
      {
        name: 'resource',
        desc: 'Resource related to the event (for example, `CPU-1`).',
        type: 'Object',
      },
      {
        name: 'metricName',
        desc: 'Metric name related to the event (for example, `usage_idle`).',
        type: 'Object',
      },
      {
        name: 'messageKey',
        desc:
          'Unique identifier of the event (for example, the InfluxDB alert ID).',
        type: 'Object',
      },
      {
        name: 'additionalInfo',
        desc: 'Additional information to include with the event.',
        type: 'Object',
      },
    ],
    package: 'contrib/bonitoo-io/servicenow',
    desc: 'Sends an event to ServiceNow (https://servicenow.com/).',
    example:
      'import "contrib/bonitoo-io/servicenow"\n\n// setup and processing omitted\n\nservicenow.event(\n    url: "https://tenant.service-now.com/api/global/em/jsonv2",\n    username: username,\n    password: password,\n    node: lastReported.host,\n    metricType: lastReported._measurement,\n    resource: lastReported.instance,\n    metricName: lastReported._field,\n    severity:\n        if lastReported._value < 1.0 then\n            "critical"\n        else if lastReported._value < 5.0 then\n            "warning"\n        else\n            "info",\n    additionalInfo: {"devId": r.dev_id},\n)',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/bonitoo-io/servicenow/event/',
  },
  {
    name: 'slack.endpoint',
    args: [
      {
        name: 'url',
        desc:
          'Slack API URL. Default is `https://slack.com/api/chat.postMessage`.',
        type: 'String',
      },
      {
        name: 'token',
        desc: 'Slack API token. Default is `""`.',
        type: 'String',
      },
    ],
    package: 'slack',
    desc:
      'Returns a function that can be used to send a message to Slack per input row.',
    example:
      'import "sampledata"\nimport "slack"\n\ndata =\n    sampledata.int()\n        |> map(fn: (r) => ({r with status: if r._value > 15 then "alert" else "ok"}))\n        |> filter(fn: (r) => r.status == "alert")\n\ndata\n    |> slack.endpoint(token: "mY5uP3rSeCr37T0kEN")(\n        mapFn: (r) => ({channel: "Alerts", text: r._message, color: "danger"}),\n    )()',
    category: 'Notification endpoints',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/slack/endpoint/',
  },
  {
    name: 'slack.message',
    args: [
      {
        name: 'url',
        desc: 'Slack API URL.',
        type: 'String',
      },
      {
        name: 'token',
        desc: 'Slack API token. Default is `""`.',
        type: 'String',
      },
      {
        name: 'channel',
        desc: 'Slack channel or user to send the message to.',
        type: 'Object',
      },
      {
        name: 'text',
        desc: 'Message text.',
        type: 'Object',
      },
      {
        name: 'color',
        desc: 'Slack message color.',
        type: 'String',
      },
    ],
    package: 'slack',
    desc:
      'Sends a single message to a Slack channel and returns the HTTP response code of the request.',
    example:
      'import "slack"\n\nslack.message(\n    url: "https://hooks.slack.com/services/EXAMPLE-WEBHOOK-URL",\n    channel: "#example-channel",\n    text: "Example slack message",\n    color: "warning",\n)',
    category: 'Notification endpoints',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/slack/message/',
  },
  {
    name: 'slack.validateColorString',
    args: [
      {
        name: 'color',
        desc: 'Hex color code.',
        type: 'String',
      },
    ],
    package: 'slack',
    desc: 'Ensures a string contains a valid hex color code.',
    example: 'import "slack"\n\nslack.validateColorString(color: "#fff")',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/slack/validatecolorstring/',
  },
  {
    name: 'socket.from',
    args: [
      {
        name: 'url',
        desc: 'URL to return data from.',
        type: 'String',
      },
      {
        name: 'decoder',
        desc: 'Decoder to use to parse returned data into a stream of tables.',
        type: 'String',
      },
    ],
    package: 'socket',
    desc:
      'Returns data from a socket connection and outputs a stream of tables given a specified decoder.',
    example:
      'import "socket"\n\nsocket.from(url: "tcp://127.0.0.1:1234", decoder: "csv")',
    category: 'Inputs',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/socket/from/',
  },
  {
    name: 'stateTracking',
    args: [
      {
        name: 'fn',
        desc: 'Predicate function to determine state.',
        type: 'Function',
      },
      {
        name: 'countColumn',
        desc: 'Column to store state count in.',
        type: 'String',
      },
      {
        name: 'durationColumn',
        desc: 'Column to store state duration in.',
        type: 'String',
      },
      {
        name: 'durationUnit',
        desc: 'Unit of time to report state duration in. Default is `1s`.',
        type: 'Duration',
      },
      {
        name: 'timeColumn',
        desc: 'Column with time values used to calculate state duration.',
        type: 'String',
      },
    ],
    package: '',
    desc:
      'Returns the cumulative count and duration of consecutive rows that match a predicate function that defines a state.',
    example:
      'data\n    |> stateTracking(fn: (r) => r.state == "crit", countColumn: "count")',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/statetracking/',
  },
  {
    name: 'statsmodels.linearRegression',
    args: [],
    package: 'contrib/anaisdg/statsmodels',
    desc: 'Performs a linear regression.',
    example:
      'import "contrib/anaisdg/statsmodels"\nimport "sampledata"\n\nsampledata.float()\n    |> statsmodels.linearRegression()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/anaisdg/statsmodels/linearregression/',
  },
  {
    name: 'table.fill',
    args: [],
    package: 'experimental/table',
    desc: 'Adds a single row to empty tables in a stream of tables.',
    example:
      'import "experimental/table"\nimport "sampledata"\n\ndata =\n    sampledata.int()\n        |> filter(fn: (r) => r.tag != "t2", onEmpty: "keep")\n\ndata\n    |> table.fill()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/table/fill/',
  },
  {
    name: 'tasks.lastSuccess',
    args: [
      {
        name: 'orTime',
        desc:
          'Default time value returned if the task has never successfully run.',
        type: 'Object',
      },
    ],
    package: 'influxdata/influxdb/tasks',
    desc:
      'Returns the time of the last successful run of the InfluxDB task or the value of the `orTime` parameter if the task has never successfully run.',
    example:
      'import "influxdata/influxdb/tasks"\n\ntasks.lastSuccess(orTime: 2020-01-01T00:00:00Z)',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/tasks/lastsuccess/',
  },
  {
    name: 'teams.endpoint',
    args: [
      {
        name: 'url',
        desc: 'Incoming webhook URL.',
        type: 'String',
      },
    ],
    package: 'contrib/sranka/teams',
    desc:
      'Sends a message to a Microsoft Teams channel using data from table rows.',
    example:
      'import "contrib/sranka/teams"\n\n// setup and processing omitted\n\nendpoint = teams.endpoint(url: url)',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/sranka/teams/endpoint/',
  },
  {
    name: 'teams.message',
    args: [
      {
        name: 'url',
        desc: 'Incoming webhook URL.',
        type: 'String',
      },
      {
        name: 'title',
        desc: 'Message card title.',
        type: 'Object',
      },
      {
        name: 'text',
        desc: 'Message card text.',
        type: 'String',
      },
      {
        name: 'summary',
        desc: 'Message card summary.',
        type: 'String',
      },
    ],
    package: 'contrib/sranka/teams',
    desc:
      'Sends a single message to a Microsoft Teams channel using an incoming webhook (https://docs.microsoft.com/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook).',
    example:
      'import "contrib/sranka/teams"\n\n// setup and processing omitted\n\nteams.message(\n    url: "https://outlook.office.com/webhook/example-webhook",\n    title: "Disk Usage",\n    text: "Disk usage is: *${lastReported.status}*.",\n    summary: "Disk usage is ${lastReported.status}",\n)',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/sranka/teams/message/',
  },
  {
    name: 'telegram.endpoint',
    args: [
      {
        name: 'url',
        desc:
          'URL of the Telegram bot endpoint. Default is `https://api.telegram.org/bot`.',
        type: 'String',
      },
      {
        name: 'token',
        desc: 'Telegram bot token.',
        type: 'String',
      },
      {
        name: 'parseMode',
        desc:
          'Parse mode (https://core.telegram.org/bots/api#formatting-options)',
        type: 'Object',
      },
      {
        name: 'disableWebPagePreview',
        desc: 'Disable preview of web links in the sent message.',
        type: 'Object',
      },
    ],
    package: 'contrib/sranka/telegram',
    desc: 'Sends a message to a Telegram channel using data from table rows.',
    example:
      'import "contrib/sranka/telegram"\n\n// setup and processing omitted\n\nendpoint = telegram.endpoint(token: token)',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/sranka/telegram/endpoint/',
  },
  {
    name: 'telegram.message',
    args: [
      {
        name: 'url',
        desc:
          'URL of the Telegram bot endpoint. Default is `https://api.telegram.org/bot`.',
        type: 'String',
      },
      {
        name: 'token',
        desc: 'Telegram bot token.',
        type: 'String',
      },
      {
        name: 'channel',
        desc: 'Telegram channel ID.',
        type: 'Object',
      },
      {
        name: 'text',
        desc: 'Message text.',
        type: 'Object',
      },
      {
        name: 'parseMode',
        desc:
          'Parse mode (https://core.telegram.org/bots/api#formatting-options)',
        type: 'Object',
      },
      {
        name: 'disableWebPagePreview',
        desc: 'Disable preview of web links in the sent message.',
        type: 'Object',
      },
      {
        name: 'silent',
        desc:
          'Send message silently (https://telegram.org/blog/channels-2-0#silent-messages).',
        type: 'Object',
      },
    ],
    package: 'contrib/sranka/telegram',
    desc:
      'Sends a single message to a Telegram channel using the `sendMessage` (https://core.telegram.org/bots/api#sendmessage) method of the Telegram Bot API.',
    example:
      'import "influxdata/influxdb/secrets"\nimport "contrib/sranka/telegram"\n\ntoken = secrets.get(key: "TELEGRAM_TOKEN")\n\nlastReported =\n    from(bucket: "example-bucket")\n        |> range(start: -1m)\n        |> filter(fn: (r) => r._measurement == "statuses")\n        |> last()\n        |> findRecord(fn: (key) => true, idx: 0)\n\ntelegram.message(token: token, channel: "-12345", text: "Disk usage is **${lastReported.status}**.")',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/sranka/telegram/message/',
  },
  {
    name: 'testing.assertEqualValues',
    args: [
      {
        name: 'got',
        desc: 'Value to test.',
        type: 'Object',
      },
      {
        name: 'want',
        desc: 'Expected value to test against.',
        type: 'Object',
      },
    ],
    package: 'testing',
    desc: 'Tests whether two values are equal.',
    example: 'import "testing"\n\ntesting.assertEqualValues(got: 5, want: 12)',
    category: 'Tests',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/testing/assertequalvalues/',
  },
  {
    name: 'testing.assertMatches',
    args: [
      {
        name: 'got',
        desc: 'Value to test.',
        type: 'String',
      },
      {
        name: 'want',
        desc: 'Regex to test against.',
        type: 'Regexp',
      },
    ],
    package: 'internal/testing',
    desc: 'Tests whether a string matches a given regex.',
    example:
      'import "internal/testing"\n\ntesting.assertMatches(got: "123", want: /12/)',
    category: 'Tests',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/internal/testing/assertmatches/',
  },
  {
    name: 'testing.load',
    args: [],
    package: 'testing',
    desc: 'Loads test data from a stream of tables.',
    example:
      'import "testing"\n\n// setup and processing omitted\n\ntesting.load(tables: got)\n    |> testing.diff(want: want)',
    category: 'Tests',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/testing/load/',
  },
  {
    name: 'testing.shouldError',
    args: [
      {
        name: 'fn',
        desc: 'Function to call.',
        type: 'Function',
      },
      {
        name: 'want',
        desc: 'Regular expression to match the expected error.',
        type: 'Regexp',
      },
    ],
    package: 'testing',
    desc:
      'Calls a function that catches any error and checks that the error matches the expected value.',
    example:
      'import "testing"\n\ntesting.shouldError(fn: () => die(msg: "error message"), want: /error message/)',
    category: 'Tests',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/testing/shoulderror/',
  },
  {
    name: 'testing.shouldErrorWithCode',
    args: [
      {
        name: 'fn',
        desc: 'Function to call.',
        type: 'Function',
      },
      {
        name: 'want',
        desc: 'Regular expression to match the expected error.',
        type: 'Regexp',
      },
      {
        name: 'code',
        desc: 'Which flux error code to expect',
        type: 'UInteger',
      },
    ],
    package: 'internal/testing',
    desc:
      'Calls a function that catches any error and checks that the error matches the expected value.',
    example:
      'import "internal/testing"\n\nimport "testing"\n\ntesting.shouldErrorWithCode(fn: () => die(msg: "error message"), want: /error message/, code: 3)',
    category: 'Tests',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/internal/testing/shoulderrorwithcode/',
  },
  {
    name: 'testutil.fail',
    args: [],
    package: 'internal/testutil',
    desc: 'Causes the current script to fail.',
    example: 'testutil.fail()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/internal/testutil/fail/',
  },
  {
    name: 'testutil.makeAny',
    args: [
      {
        name: 'typ',
        desc: 'Description of the type to create.',
        type: 'String',
      },
    ],
    package: 'internal/testutil',
    desc: 'Constructs any value based on a type description as a string.',
    example: 'testutil.makeAny()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/internal/testutil/makeany/',
  },
  {
    name: 'testutil.makeRecord',
    args: [
      {
        name: 'o',
        desc: 'Record value.',
        type: 'Object',
      },
    ],
    package: 'internal/testutil',
    desc:
      'Is the identity function, but breaks the type connection from input to output.',
    example: 'testutil.makeRecord()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/internal/testutil/makerecord/',
  },
  {
    name: 'testutil.yield',
    args: [
      {
        name: 'v',
        desc: 'Any value.',
        type: 'Object',
      },
    ],
    package: 'internal/testutil',
    desc: 'Is the identity function.',
    example: 'testutil.yield()',
    category: 'Transformations',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/internal/testutil/yield/',
  },
  {
    name: 'tickscript.alert',
    args: [
      {
        name: 'check',
        desc: 'InfluxDB check data.',
        type: 'Object',
      },
      {
        name: 'id',
        desc:
          'Function that returns the InfluxDB check ID provided by the check record.',
        type: 'Function',
      },
      {
        name: 'details',
        desc:
          'Function to return the InfluxDB check details using data from input rows.',
        type: 'Function',
      },
      {
        name: 'message',
        desc:
          'Function to return the InfluxDB check message using data from input rows.',
        type: 'Function',
      },
      {
        name: 'crit',
        desc:
          'Predicate function to determine `crit` status. Default is `(r) => false`.',
        type: 'Function',
      },
      {
        name: 'warn',
        desc:
          'Predicate function to determine `warn` status. Default is `(r) => false`.',
        type: 'Function',
      },
      {
        name: 'info',
        desc:
          'Predicate function to determine `info` status. Default is `(r) => false`.',
        type: 'Function',
      },
      {
        name: 'ok',
        desc:
          'Predicate function to determine `ok` status. Default is `(r) => true`.',
        type: 'Function',
      },
      {
        name: 'topic',
        desc: 'Check topic. Default is `""`.',
        type: 'String',
      },
    ],
    package: 'contrib/bonitoo-io/tickscript',
    desc:
      'Identifies events of varying severity levels and writes them to the `statuses` measurement in the InfluxDB `_monitoring` system bucket.',
    example:
      'import "contrib/bonitoo-io/tickscript"\n\n// setup and processing omitted\n\n\nfrom(bucket: "example-bucket")\n    |> range(start: -task.every)\n    |> filter(fn: (r) => r._measurement == "errors" and r._field == "value")\n    |> count()\n    |> tickscript.alert(\n        check: {check with _check_id: "task/${r.service}"},\n        message: "task/${r.service} is ${r._level} value: ${r._value}",\n        crit: (r) => r._value > 30,\n        warn: (r) => r._value > 20,\n        info: (r) => r._value > 10,\n    )',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/bonitoo-io/tickscript/alert/',
  },
  {
    name: 'tickscript.compute',
    args: [
      {
        name: 'as',
        desc: 'New column name.',
        type: 'String',
      },
      {
        name: 'column',
        desc: 'Column to operate on. Default is `_value`.',
        type: 'Object',
      },
      {
        name: 'fn',
        desc: 'Aggregate or selector function to apply.',
        type: 'Function',
      },
    ],
    package: 'contrib/bonitoo-io/tickscript',
    desc:
      'Is an alias for `tickscript.select()` that changes a column’s name and optionally applies an aggregate or selector function.',
    example: 'tickscript.compute()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/bonitoo-io/tickscript/compute/',
  },
  {
    name: 'tickscript.deadman',
    args: [
      {
        name: 'check',
        desc: 'InfluxDB check data. See `tickscript.defineCheck()`.',
        type: 'Object',
      },
      {
        name: 'measurement',
        desc: 'Measurement name. Should match the queried measurement.',
        type: 'String',
      },
      {
        name: 'threshold',
        desc: 'Count threshold. Default is `0`.',
        type: 'Object',
      },
      {
        name: 'id',
        desc:
          'Function that returns the InfluxDB check ID provided by the check record.',
        type: 'Function',
      },
      {
        name: 'message',
        desc:
          'Function that returns the InfluxDB check message using data from input rows.',
        type: 'Function',
      },
      {
        name: 'topic',
        desc: 'Check topic. Default is `""`.',
        type: 'String',
      },
    ],
    package: 'contrib/bonitoo-io/tickscript',
    desc:
      'Detects low data throughput and writes a point with a critical status to the InfluxDB `_monitoring` system bucket.',
    example:
      'import "contrib/bonitoo-io/tickscript"\n\noption task = {name: "Example task", every: 1m}\n\nfrom(bucket: "example-bucket")\n    |> range(start: -task.every)\n    |> filter(fn: (r) => r._measurement == "pulse" and r._field == "value")\n    |> tickscript.deadman(\n        check: tickscript.defineCheck(id: "000000000000", name: "task/${r.service}"),\n        measurement: "pulse",\n        threshold: 2,\n    )',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/bonitoo-io/tickscript/deadman/',
  },
  {
    name: 'tickscript.defineCheck',
    args: [
      {
        name: 'id',
        desc: 'InfluxDB check ID.',
        type: 'Object',
      },
      {
        name: 'name',
        desc: 'InfluxDB check name.',
        type: 'Object',
      },
      {
        name: 'type',
        desc: 'InfluxDB check type. Default is `custom`.',
        type: 'Object',
      },
    ],
    package: 'contrib/bonitoo-io/tickscript',
    desc: 'Creates custom check data required by `alert()` and `deadman()`.',
    example:
      'import "contrib/bonitoo-io/tickscript"\n\ntickscript.defineCheck(id: "000000000000", name: "Example check name")',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/bonitoo-io/tickscript/definecheck/',
  },
  {
    name: 'tickscript.groupBy',
    args: [
      {
        name: 'columns',
        desc: 'List of columns to group by.',
        type: 'Array',
      },
    ],
    package: 'contrib/bonitoo-io/tickscript',
    desc:
      'Groups results by the `_measurement` column and other specified columns.',
    example:
      'import "contrib/bonitoo-io/tickscript"\n\ndata\n    |> tickscript.groupBy(columns: ["host", "region"])',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/bonitoo-io/tickscript/groupby/',
  },
  {
    name: 'tickscript.join',
    args: [
      {
        name: 'tables',
        desc: 'Map of two streams to join.',
        type: 'Object',
      },
      {
        name: 'on',
        desc: 'List of columns to join on. Default is `["_time"]`.',
        type: 'Array',
      },
      {
        name: 'measurement',
        desc: 'Measurement name to use in results.',
        type: 'Object',
      },
    ],
    package: 'contrib/bonitoo-io/tickscript',
    desc:
      'Merges two input streams into a single output stream based on specified columns with equal values and appends a new measurement name.',
    example:
      'import "contrib/bonitoo-io/tickscript"\n\n// setup and processing omitted\n\ntickscript.join(\n    tables: {metric: metrics, state: states},\n    on: ["_time", "host"],\n    measurement: "example-m",\n)',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/bonitoo-io/tickscript/join/',
  },
  {
    name: 'tickscript.select',
    args: [
      {
        name: 'column',
        desc: 'Column to operate on. Default is `_value`.',
        type: 'Object',
      },
      {
        name: 'fn',
        desc: 'Aggregate or selector function to apply.',
        type: 'Function',
      },
      {
        name: 'as',
        desc: 'New column name.',
        type: 'String',
      },
    ],
    package: 'contrib/bonitoo-io/tickscript',
    desc:
      'Changes a column’s name and optionally applies an aggregate or selector function to values in the column.',
    example:
      'import "contrib/bonitoo-io/tickscript"\nimport "sampledata"\n\nsampledata.int()\n    |> tickscript.select(as: "example-name")',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/bonitoo-io/tickscript/select/',
  },
  {
    name: 'tickscript.selectWindow',
    args: [
      {
        name: 'column',
        desc: 'Column to operate on. Default is _value.',
        type: 'String',
      },
      {
        name: 'fn',
        desc: 'Aggregate or selector function to apply.',
        type: 'Function',
      },
      {
        name: 'as',
        desc: 'New column name.',
        type: 'String',
      },
      {
        name: 'every',
        desc: 'Duration of windows.',
        type: 'Duration',
      },
      {
        name: 'defaultValue',
        desc: 'Default fill value for null values in column.',
        type: 'Object',
      },
    ],
    package: 'contrib/bonitoo-io/tickscript',
    desc:
      'Changes a column’s name, windows rows by time, and then applies an aggregate or selector function the specified column for each window of time.',
    example:
      'import "contrib/bonitoo-io/tickscript"\n\ndata\n    |> tickscript.selectWindow(fn: sum, as: "example-name", every: 1h, defaultValue: 0)',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/bonitoo-io/tickscript/selectwindow/',
  },
  {
    name: 'timeWeightedAvg',
    args: [
      {
        name: 'unit',
        desc: 'Unit of time to use to compute the time-weighted average.',
        type: 'Duration',
      },
    ],
    package: '',
    desc:
      'Returns the time-weighted average of non-null values in `_value` column as a float for each input table.',
    example: 'data\n    |> timeWeightedAvg(unit: 1s)',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/universe/timeweightedavg/',
  },
  {
    name: 'timezone.fixed',
    args: [
      {
        name: 'offset',
        desc: 'Fixed duration for the location offset.',
        type: 'Object',
      },
    ],
    package: 'timezone',
    desc: 'Returns a location record with a fixed offset.',
    example: 'import "timezone"\n\ntimezone.fixed(offset: -8h)',
    category: 'Date/time',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/timezone/fixed/',
  },
  {
    name: 'timezone.location',
    args: [
      {
        name: 'name',
        desc:
          'Location name (as defined by your operating system timezone database).',
        type: 'String',
      },
    ],
    package: 'timezone',
    desc: 'Returns a location record based on a location or timezone name.',
    example:
      'import "timezone"\n\ntimezone.location(name: "America/Los_Angeles")',
    category: 'Date/time',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/timezone/location/',
  },
  {
    name: 'today',
    args: [],
    package: '',
    desc: 'Returns the now() timestamp truncated to the day unit.',
    example: 'option now = () => 2022-01-01T13:45:28Z\n\ntoday()',
    category: 'Date/time',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/universe/today/',
  },
  {
    name: 'types.isNumeric',
    args: [
      {
        name: 'v',
        desc: 'Value to test.',
        type: 'Object',
      },
    ],
    package: 'types',
    desc: 'Tests if a value is a numeric type (int, uint, or float).',
    example:
      'import "types"\n\ndata\n    |> filter(fn: (r) => types.isNumeric(v: r._value))',
    category: 'Tests',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/types/isnumeric/',
  },
  {
    name: 'types.isType',
    args: [
      {
        name: 'v',
        desc: 'Value to test.',
        type: 'Object',
      },
      {
        name: 'type',
        desc: 'String describing the type to check against.',
        type: 'String',
      },
    ],
    package: 'types',
    desc: 'Tests if a value is a specified type.',
    example:
      'import "types"\n\ndata\n    |> filter(fn: (r) => types.isType(v: r._value, type: "string"))',
    category: 'Tests',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/types/istype/',
  },
  {
    name: 'usage.from',
    args: [
      {
        name: 'start',
        desc: 'Earliest time to include in results.',
        type: 'Object',
      },
      {
        name: 'stop',
        desc: 'Latest time to include in results.',
        type: 'Object',
      },
      {
        name: 'host',
        desc: 'InfluxDB Cloud region URL (/influxdb/cloud/reference/regions/).',
        type: 'String',
      },
      {
        name: 'orgID',
        desc: 'InfluxDB Cloud organization ID. Default is `""`.',
        type: 'String',
      },
      {
        name: 'token',
        desc: 'InfluxDB Cloud API token (/influxdb/cloud/admin/tokens/).',
        type: 'String',
      },
      {
        name: 'raw',
        desc:
          'Return raw, high resolution usage data instead of downsampled usage data.',
        type: 'Object',
      },
    ],
    package: 'experimental/usage',
    desc: 'Returns usage data from an **InfluxDB Cloud** organization.',
    example:
      'import "experimental/usage"\nimport "influxdata/influxdb/secrets"\n\ntoken = secrets.get(key: "INFLUX_TOKEN")\n\nusage.from(start: -30d, stop: now())',
    category: 'Inputs',
    link: 'https://docs.influxdata.com/flux/v0/stdlib/experimental/usage/from/',
  },
  {
    name: 'usage.limits',
    args: [
      {
        name: 'host',
        desc: 'InfluxDB Cloud region URL (/influxdb/cloud/reference/regions/).',
        type: 'String',
      },
      {
        name: 'orgID',
        desc: 'InfluxDB Cloud organization ID. Default is `""`.',
        type: 'String',
      },
      {
        name: 'token',
        desc: 'InfluxDB Cloud API token (/influxdb/cloud/admin/tokens/).',
        type: 'String',
      },
    ],
    package: 'experimental/usage',
    desc:
      'Returns a record containing usage limits for an **InfluxDB Cloud** organization.',
    example: 'import "experimental/usage"\n\nusage.limits()',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/experimental/usage/limits/',
  },
  {
    name: 'v1.databases',
    args: [
      {
        name: 'org',
        desc: 'Organization name.',
        type: 'String',
      },
      {
        name: 'orgID',
        desc: 'Organization ID.',
        type: 'String',
      },
      {
        name: 'host',
        desc: 'InfluxDB URL. Default is `http://localhost:8086`.',
        type: 'String',
      },
      {
        name: 'token',
        desc: 'InfluxDB API token.',
        type: 'String',
      },
    ],
    package: 'influxdata/influxdb/v1',
    desc: 'Returns a list of databases in an InfluxDB 1.x (1.7+) instance.',
    example: 'import "influxdata/influxdb/v1"\n\nv1.databases()',
    category: 'Metadata',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/v1/databases/',
  },
  {
    name: 'v1.fieldKeys',
    args: [
      {
        name: 'bucket',
        desc: 'Bucket to list field keys from.',
        type: 'String',
      },
      {
        name: 'predicate',
        desc: 'Predicate function that filters field keys.',
        type: 'Function',
      },
      {
        name: 'start',
        desc: 'Oldest time to include in results. Default is `-30d`.',
        type: 'Object',
      },
      {
        name: 'stop',
        desc: 'Newest time include in results.',
        type: 'Object',
      },
    ],
    package: 'influxdata/influxdb/v1',
    desc: 'Returns field keys in a bucket.',
    example: 'import "influxdata/influxdb/schema"',
    category: 'Metadata',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/v1/fieldkeys/',
  },
  {
    name: 'v1.json (file)',
    args: [
      {
        name: 'file',
        desc:
          'File path to file containing InfluxDB 1.x query results in JSON format.',
        type: 'String',
      },
    ],
    package: 'influxdata/influxdb/v1',
    desc: 'Parses an InfluxDB 1.x JSON result into a stream of tables.',
    example: 'v1.json(file: path)',
    category: 'Inputs',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/v1/json/',
  },
  {
    name: 'v1.json (jsonData)',
    args: [
      {
        name: 'json',
        desc: 'InfluxDB 1.x query results in JSON format.',
        type: 'String',
      },
    ],
    package: 'influxdata/influxdb/v1',
    desc: 'Parses an InfluxDB 1.x JSON result into a stream of tables.',
    example: 'v1.json(json: jsonData)',
    category: 'Inputs',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/v1/json/',
  },
  {
    name: 'v1.measurementFieldKeys',
    args: [
      {
        name: 'bucket',
        desc: 'Bucket to retrieve field keys from.',
        type: 'String',
      },
      {
        name: 'measurement',
        desc: 'Measurement to list field keys from.',
        type: 'Object',
      },
      {
        name: 'start',
        desc: 'Oldest time to include in results. Default is `-30d`.',
        type: 'Object',
      },
      {
        name: 'stop',
        desc: 'Newest time include in results.',
        type: 'Object',
      },
    ],
    package: 'influxdata/influxdb/v1',
    desc: 'Returns a list of fields in a measurement.',
    example: 'import "influxdata/influxdb/schema"',
    category: 'Metadata',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/influxdata/influxdb/v1/measurementfieldkeys/',
  },
  {
    name: 'victorops.alert',
    args: [
      {
        name: 'url',
        desc: 'VictorOps REST endpoint integration URL.',
        type: 'String',
      },
      {
        name: 'monitoringTool',
        desc: 'Monitoring agent name. Default is `""`.',
        type: 'Object',
      },
      {
        name: 'messageType',
        desc: 'VictorOps message type (alert behavior).',
        type: 'Object',
      },
      {
        name: 'entityID',
        desc: 'Incident ID. Default is `""`.',
        type: 'Object',
      },
      {
        name: 'entityDisplayName',
        desc: 'Incident display name or summary. Default is `""`.',
        type: 'Object',
      },
      {
        name: 'stateMessage',
        desc: 'Verbose incident message. Default is `""`.',
        type: 'Object',
      },
      {
        name: 'timestamp',
        desc: 'Incident start time. Default is `now()`.',
        type: 'Object',
      },
    ],
    package: 'contrib/bonitoo-io/victorops',
    desc: 'Sends an alert to VictorOps.',
    example:
      'import "contrib/bonitoo-io/victorops"\n\n// setup and processing omitted\n\nvictorops.alert(\n    url: "https://alert.victorops.com/integrations/generic/00000000/alert/${apiKey}/${routingKey}",\n    messageType:\n        if lastReported._value < 1.0 then\n            "CRITICAL"\n        else if lastReported._value < 5.0 then\n            "WARNING"\n        else\n            "INFO",\n    entityID: "example-alert-1",\n    entityDisplayName: "Example Alert 1",\n    stateMessage: "Last reported cpu_idle was ${string(v: r._value)}.",\n)',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/bonitoo-io/victorops/alert/',
  },
  {
    name: 'victorops.endpoint',
    args: [
      {
        name: 'url',
        desc: 'VictorOps REST endpoint integration URL.',
        type: 'String',
      },
      {
        name: 'monitoringTool',
        desc: 'Tool to use for monitoring.',
        type: 'Object',
      },
    ],
    package: 'contrib/bonitoo-io/victorops',
    desc: 'Sends events to VictorOps using data from input rows.',
    example:
      'import "contrib/bonitoo-io/victorops"\n\n// setup and processing omitted\n\nendpoint = victorops.endpoint(url: url)',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/bonitoo-io/victorops/endpoint/',
  },
  {
    name: 'webexteams.endpoint',
    args: [
      {
        name: 'url',
        desc: 'Base URL of Webex API endpoint (without a trailing slash).',
        type: 'String',
      },
      {
        name: 'token',
        desc:
          'Webex API access token (https://developer.webex.com/docs/api/getting-started).',
        type: 'String',
      },
    ],
    package: 'contrib/sranka/webexteams',
    desc:
      'Returns a function that sends a message that includes data from input rows to a Webex room.',
    example:
      'import "contrib/sranka/webexteams"\n\n// setup and processing omitted\n\n\nfrom(bucket: "example-bucket")\n    |> range(start: -1m)\n    |> filter(fn: (r) => r._measurement == "statuses")\n    |> last()\n    |> tableFind(fn: (key) => true)\n    |> webexteams.endpoint(token: token)(\n        mapFn: (r) =>\n            ({\n                roomId:\n                    "Y2lzY29zcGFyazovL3VzL1JPT00vYmJjZWIxYWQtNDNmMS0zYjU4LTkxNDctZjE0YmIwYzRkMTU0",\n                text: "",\n                markdown: "Disk usage is **${r.status}**.",\n            }),\n    )()',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/sranka/webexteams/endpoint/',
  },
  {
    name: 'webexteams.message',
    args: [
      {
        name: 'url',
        desc: 'Base URL of Webex API endpoint (without a trailing slash).',
        type: 'String',
      },
      {
        name: 'token',
        desc:
          'Webex API access token (https://developer.webex.com/docs/api/getting-started).',
        type: 'String',
      },
      {
        name: 'roomId',
        desc: 'Room ID to send the message to.',
        type: 'Object',
      },
      {
        name: 'text',
        desc: 'Plain text message.',
        type: 'Object',
      },
      {
        name: 'markdown',
        desc:
          'Markdown formatted message (https://developer.webex.com/docs/api/basics#formatting-messages).',
        type: 'Object',
      },
    ],
    package: 'contrib/sranka/webexteams',
    desc:
      'Sends a single message to Webex using the Webex messages API (https://developer.webex.com/docs/api/v1/messages/create-a-message).',
    example:
      'import "contrib/sranka/webexteams"\n\n// setup and processing omitted\n\nwebexteams.message(\n    token: apiToken,\n    roomId: "Y2lzY29zcGFyazovL3VzL1JPT00vYmJjZWIxYWQtNDNmMS0zYjU4LTkxNDctZjE0YmIwYzRkMTU0",\n    text: "Disk usage is ${lastReported.status}.",\n    markdown: "Disk usage is **${lastReported.status}**.",\n)',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/sranka/webexteams/message/',
  },
  {
    name: 'zenoss.endpoint',
    args: [
      {
        name: 'url',
        desc:
          'Zenoss router endpoint URL (https://help.zenoss.com/zsd/RM/configuring-resource-manager/enabling-access-to-browser-interfaces/creating-and-changing-public-endpoints).',
        type: 'String',
      },
      {
        name: 'username',
        desc: 'Zenoss username to use for HTTP BASIC authentication.',
        type: 'String',
      },
      {
        name: 'password',
        desc: 'Zenoss password to use for HTTP BASIC authentication.',
        type: 'String',
      },
      {
        name: 'apiKey',
        desc: 'Zenoss cloud API key.',
        type: 'Object',
      },
      {
        name: 'action',
        desc: 'Zenoss router name.',
        type: 'Object',
      },
      {
        name: 'method',
        desc: 'EventsRouter method.',
        type: 'Object',
      },
      {
        name: 'type',
        desc: 'Event type. Default is `"rpc"`.',
        type: 'Object',
      },
      {
        name: 'tid',
        desc: 'Temporary request transaction ID.',
        type: 'Object',
      },
    ],
    package: 'contrib/bonitoo-io/zenoss',
    desc: 'Sends events to Zenoss using data from input rows.',
    example:
      'import "contrib/bonitoo-io/zenoss"\n\n// setup and processing omitted\n\nendpoint = zenoss.endpoint(url: url, username: username, password: password)',
    category: 'Notification endpoints',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/bonitoo-io/zenoss/endpoint/',
  },
  {
    name: 'zenoss.event',
    args: [
      {
        name: 'url',
        desc:
          'Zenoss router endpoint URL (https://help.zenoss.com/zsd/RM/configuring-resource-manager/enabling-access-to-browser-interfaces/creating-and-changing-public-endpoints).',
        type: 'String',
      },
      {
        name: 'username',
        desc: 'Zenoss username to use for HTTP BASIC authentication.',
        type: 'String',
      },
      {
        name: 'password',
        desc: 'Zenoss password to use for HTTP BASIC authentication.',
        type: 'String',
      },
      {
        name: 'apiKey',
        desc: 'Zenoss cloud API key.',
        type: 'Object',
      },
      {
        name: 'action',
        desc: 'Zenoss router name.',
        type: 'Object',
      },
      {
        name: 'method',
        desc:
          'EventsRouter method (https://help.zenoss.com/dev/collection-zone-and-resource-manager-apis/codebase/routers/router-reference/eventsrouter).',
        type: 'Object',
      },
      {
        name: 'type',
        desc: 'Event type.',
        type: 'Object',
      },
      {
        name: 'tid',
        desc: 'Temporary request transaction ID.',
        type: 'Object',
      },
      {
        name: 'summary',
        desc: 'Event summary.',
        type: 'Object',
      },
      {
        name: 'device',
        desc: 'Related device.',
        type: 'Object',
      },
      {
        name: 'component',
        desc: 'Related component.',
        type: 'Object',
      },
      {
        name: 'severity',
        desc:
          'Event severity level (https://help.zenoss.com/zsd/RM/administering-resource-manager/event-management/event-severity-levels).',
        type: 'Object',
      },
      {
        name: 'eventClass',
        desc:
          'Event class (https://help.zenoss.com/zsd/RM/administering-resource-manager/event-management/understanding-event-classes).',
        type: 'Object',
      },
      {
        name: 'eventClassKey',
        desc:
          'Event class key (https://help.zenoss.com/zsd/RM/administering-resource-manager/event-management/event-fields).',
        type: 'Object',
      },
      {
        name: 'collector',
        desc:
          'Zenoss collector (https://help.zenoss.com/zsd/RM/administering-resource-manager/event-management/event-fields).',
        type: 'Object',
      },
      {
        name: 'message',
        desc: 'Related message.',
        type: 'Object',
      },
    ],
    package: 'contrib/bonitoo-io/zenoss',
    desc: 'Sends an event to Zenoss (https://www.zenoss.com/).',
    example:
      'import "contrib/bonitoo-io/zenoss"\n\n// setup and processing omitted\n\nzenoss.event(\n    url: "https://tenant.zenoss.io:8080/zport/dmd/evconsole_router",\n    username: username,\n    username: password,\n    device: lastReported.host,\n    component: "CPU",\n    eventClass: "/App",\n    severity:\n        if lastReported._value < 1.0 then\n            "Critical"\n        else if lastReported._value < 5.0 then\n            "Warning"\n        else if lastReported._value < 20.0 then\n            "Info"\n        else\n            "Clear",\n)',
    category: 'Transformations',
    link:
      'https://docs.influxdata.com/flux/v0/stdlib/contrib/bonitoo-io/zenoss/event/',
  },
]
