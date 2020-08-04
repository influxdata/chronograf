import {timeSeriesToDygraphWork as timeSeriesToDygraph} from 'src/worker/jobs/timeSeriesToDygraph'
import {timeSeriesToTableGraphWork as timeSeriesToTableGraph} from 'src/worker/jobs/timeSeriesToTableGraph'

import {
  filterTableColumns,
  transformTableData,
  computeFieldOptions,
} from 'src/dashboards/utils/tableGraph'

import {InfluxQLQueryType} from 'src/types/series'
import {DataType} from 'src/shared/constants'

import {DEFAULT_SORT_DIRECTION} from 'src/shared/constants/tableGraph'
import {
  DEFAULT_TIME_FORMAT,
  DEFAULT_DECIMAL_PLACES,
} from 'src/dashboards/constants'

describe('timeSeriesToDygraph', () => {
  it('parses a raw InfluxDB response into a dygraph friendly data format', () => {
    const influxResponse = [
      {
        response: {
          results: [
            {
              statement_id: 0,
              series: [
                {
                  name: 'm1',
                  columns: ['time', 'f1'],
                  values: [[1000, 1], [2000, 2]],
                },
              ],
            },
            {
              statement_id: 0,
              series: [
                {
                  name: 'm1',
                  columns: ['time', 'f2'],
                  values: [[2000, 3], [4000, 4]],
                },
              ],
            },
          ],
        },
      },
    ]

    const actual = timeSeriesToDygraph(influxResponse)

    const expected = {
      labels: ['time', `m1.f1`, `m1.f2`],
      timeSeries: [
        [new Date(1000), 1, null],
        [new Date(2000), 2, 3],
        [new Date(4000), null, 4],
      ],
      dygraphSeries: {
        'm1.f1': {
          axis: 'y',
        },
        'm1.f2': {
          axis: 'y',
        },
      },
    }

    expect(actual).toEqual(expected)
  })

  it('can sort numerical timestamps correctly', () => {
    const influxResponse = [
      {
        response: {
          results: [
            {
              statement_id: 0,
              series: [
                {
                  name: 'm1',
                  columns: ['time', 'f1'],
                  values: [[100, 1], [3000, 3], [200, 2]],
                },
              ],
            },
          ],
        },
      },
    ]

    const actual = timeSeriesToDygraph(influxResponse)

    const expected = {
      labels: ['time', 'm1.f1'],
      timeSeries: [[new Date(100), 1], [new Date(200), 2], [new Date(3000), 3]],
    }

    expect(actual.timeSeries).toEqual(expected.timeSeries)
  })

  it('can parse multiple responses with the same field and measurement', () => {
    const influxResponse = [
      {
        response: {
          results: [
            {
              statement_id: 0,
              series: [
                {
                  name: 'm1',
                  columns: ['time', 'f1'],
                  values: [[1000, 1], [2000, 2]],
                },
              ],
            },
          ],
        },
      },
      {
        response: {
          results: [
            {
              statement_id: 0,
              series: [
                {
                  name: 'm1',
                  columns: ['time', 'f1'],
                  values: [[2000, 3], [4000, 4]],
                },
              ],
            },
          ],
        },
      },
    ]
    const actual = timeSeriesToDygraph(influxResponse)

    const expected = {
      labels: ['time', `m1.f1`, `m1.f1`],
      timeSeries: [
        [new Date(1000), 1, null],
        [new Date(2000), 2, 3],
        [new Date(4000), null, 4],
      ],
      dygraphSeries: {
        'm1.f1': {
          axis: 'y',
        },
      },
    }

    expect(actual).toEqual(expected)
  })

  it('parses a raw InfluxDB response into a dygraph friendly data format', () => {
    const influxResponse = [
      {
        response: {
          results: [
            {
              statement_id: 0,
              series: [
                {
                  name: 'mb',
                  columns: ['time', 'f1'],
                  values: [[1000, 1], [2000, 2]],
                },
              ],
            },
            {
              statement_id: 0,
              series: [
                {
                  name: 'ma',
                  columns: ['time', 'f1'],
                  values: [[1000, 1], [2000, 2]],
                },
              ],
            },
            {
              statement_id: 0,
              series: [
                {
                  name: 'mc',
                  columns: ['time', 'f2'],
                  values: [[2000, 3], [4000, 4]],
                },
              ],
            },
            {
              statement_id: 0,
              series: [
                {
                  name: 'mc',
                  columns: ['time', 'f1'],
                  values: [[2000, 3], [4000, 4]],
                },
              ],
            },
          ],
        },
      },
    ]

    const actual = timeSeriesToDygraph(influxResponse)

    const expected = ['time', `ma.f1`, `mb.f1`, `mc.f1`, `mc.f2`]

    expect(actual.labels).toEqual(expected)
  })
})

it('parses a single field influxQL query', () => {
  const influxResponse = [
    {
      response: {
        results: [
          {
            statement_id: 0,
            series: [
              {
                name: 'm1',
                columns: ['time', 'f1'],
                values: [[100, 1], [3000, 3], [200, 2]],
              },
            ],
          },
        ],
      },
    },
  ]

  const actual = timeSeriesToTableGraph(influxResponse)

  const expected = [['time', 'm1.f1'], [100, 1], [200, 2], [3000, 3]]

  expect(actual.data).toEqual(expected)
  expect(actual.influxQLQueryType).toEqual(InfluxQLQueryType.DataQuery)
})

it('parses a one-column meta query', () => {
  const metaQueryResponse = [
    {
      response: {
        results: [
          {
            statement_id: 0,
            series: [
              {
                name: 'databases',
                columns: ['name'],
                values: [
                  ['_internal'],
                  ['telegraf'],
                  ['chronograf'],
                  ['hackathon'],
                  ['crypto'],
                ],
              },
            ],
          },
        ],
        uuid: 'd945d2f0-d23d-11e8-ac69-63644ffc39d1',
      },
    },
  ]

  const expected = {
    data: [
      ['name'],
      ['_internal'],
      ['telegraf'],
      ['chronograf'],
      ['hackathon'],
      ['crypto'],
    ],
    sortedLabels: [{label: 'name', responseIndex: 0, seriesIndex: 0}],
    influxQLQueryType: 'MetaQuery',
  }

  const actual = timeSeriesToTableGraph(metaQueryResponse)

  expect(actual).toEqual(expected)
})

it('parses a two-column meta query with different first column values', () => {
  const metaQueryResponse = [
    {
      response: {
        results: [
          {
            statement_id: 0,
            series: [
              {
                name: 'syslog',
                columns: ['fieldKey', 'fieldType'],
                values: [
                  ['facility_code', 'integer'],
                  ['message', 'string'],
                  ['procid', 'string'],
                  ['severity_code', 'integer'],
                  ['timestamp', 'integer'],
                  ['version', 'integer'],
                ],
              },
            ],
          },
        ],
        uuid: 'a43a58e0-d23f-11e8-98ba-639f4bed0e98',
      },
    },
  ]

  const expected = {
    data: [
      ['fieldKey', 'fieldType'],
      ['facility_code', 'integer'],
      ['message', 'string'],
      ['procid', 'string'],
      ['severity_code', 'integer'],
      ['timestamp', 'integer'],
      ['version', 'integer'],
    ],
    sortedLabels: [
      {label: 'fieldKey', responseIndex: 0, seriesIndex: 0},
      {label: 'fieldType', responseIndex: 0, seriesIndex: 0},
    ],
    influxQLQueryType: 'MetaQuery',
  }

  const actual = timeSeriesToTableGraph(metaQueryResponse)

  expect(actual).toEqual(expected)
})

it('parses a two-column meta query with same first column values', () => {
  const metaQueryResponse = [
    {
      response: {
        results: [
          {
            statement_id: 0,
            series: [
              {
                name: 'cpu',
                columns: ['key', 'value'],
                values: [
                  ['cpu', 'cpu-total'],
                  ['cpu', 'cpu0'],
                  ['cpu', 'cpu1'],
                  ['cpu', 'cpu2'],
                  ['cpu', 'cpu3'],
                  ['cpu', 'cpu4'],
                  ['cpu', 'cpu5'],
                  ['cpu', 'cpu6'],
                  ['cpu', 'cpu7'],
                ],
              },
            ],
          },
        ],
        uuid: '7be623a0-d240-11e8-a801-b1de38f10ec1',
      },
    },
  ]

  const expected = {
    data: [
      ['key', 'value'],
      ['cpu', 'cpu-total'],
      ['cpu', 'cpu0'],
      ['cpu', 'cpu1'],
      ['cpu', 'cpu2'],
      ['cpu', 'cpu3'],
      ['cpu', 'cpu4'],
      ['cpu', 'cpu5'],
      ['cpu', 'cpu6'],
      ['cpu', 'cpu7'],
    ],
    sortedLabels: [
      {label: 'key', responseIndex: 0, seriesIndex: 0},
      {label: 'value', responseIndex: 0, seriesIndex: 0},
    ],
    influxQLQueryType: 'MetaQuery',
  }

  const actual = timeSeriesToTableGraph(metaQueryResponse)

  expect(actual).toEqual(expected)
})

it('parses meta query with multiple columns with one series', () => {
  const metaQueryResponse = [
    {
      response: {
        results: [
          {
            statement_id: 0,
            series: [
              {
                columns: [
                  'name',
                  'duration',
                  'shardGroupDuration',
                  'replicaN',
                  'default',
                ],
                values: [['autogen', '0s', '168h0m0s', 1, true]],
              },
            ],
          },
        ],
        uuid: '2f0e3400-d240-11e8-8c53-9748e5c2a80a',
      },
    },
  ]

  const expected = {
    data: [
      ['name', 'duration', 'shardGroupDuration', 'replicaN', 'default'],
      ['autogen', '0s', '168h0m0s', 1, true],
    ],
    sortedLabels: [
      {label: 'name', responseIndex: 0, seriesIndex: 0},
      {label: 'duration', responseIndex: 0, seriesIndex: 0},
      {label: 'shardGroupDuration', responseIndex: 0, seriesIndex: 0},
      {label: 'replicaN', responseIndex: 0, seriesIndex: 0},
      {label: 'default', responseIndex: 0, seriesIndex: 0},
    ],
    influxQLQueryType: 'MetaQuery',
  }

  const actual = timeSeriesToTableGraph(metaQueryResponse)

  expect(actual).toEqual(expected)
})

it('parses meta query with multiple columns and multiple series', () => {
  const metaQueryResponse = [
    {
      response: {
        results: [
          {
            statement_id: 0,
            series: [
              {
                name: 'cpu',
                columns: ['tagKey'],
                values: [['cpu'], ['host']],
              },
              {
                name: 'disk',
                columns: ['tagKey'],
                values: [['device'], ['fstype'], ['host'], ['mode'], ['path']],
              },
              {
                name: 'diskio',
                columns: ['tagKey'],
                values: [['host'], ['name']],
              },
              {
                name: 'mem',
                columns: ['tagKey'],
                values: [['host']],
              },
              {
                name: 'processes',
                columns: ['tagKey'],
                values: [['host']],
              },
              {
                name: 'swap',
                columns: ['tagKey'],
                values: [['host']],
              },
              {
                name: 'syslog',
                columns: ['tagKey'],
                values: [
                  ['appname'],
                  ['facility'],
                  ['host'],
                  ['hostname'],
                  ['severity'],
                ],
              },
              {
                name: 'system',
                columns: ['tagKey'],
                values: [['host']],
              },
            ],
          },
        ],
      },
    },
  ]

  const expected = {
    data: [
      ['measurement', 'tagKey'],
      ['cpu', 'cpu'],
      ['cpu', 'host'],
      ['disk', 'device'],
      ['disk', 'fstype'],
      ['disk', 'host'],
      ['disk', 'mode'],
      ['disk', 'path'],
      ['diskio', 'host'],
      ['diskio', 'name'],
      ['mem', 'host'],
      ['processes', 'host'],
      ['swap', 'host'],
      ['syslog', 'appname'],
      ['syslog', 'facility'],
      ['syslog', 'host'],
      ['syslog', 'hostname'],
      ['syslog', 'severity'],
      ['system', 'host'],
    ],
    sortedLabels: [
      {
        label: 'measurement',
        responseIndex: 0,
        seriesIndex: 7,
      },
      {
        label: 'tagKey',
        responseIndex: 0,
        seriesIndex: 7,
      },
    ],
    influxQLQueryType: 'MetaQuery',
  }

  const actual = timeSeriesToTableGraph(metaQueryResponse)

  expect(actual).toEqual(expected)
})

it('parses a meta query with multiple columns and multiple values per column', () => {
  const metaQueryResponse = [
    {
      response: {
        results: [
          {
            statement_id: 0,
            series: [
              {
                name: 'cpu',
                columns: ['fieldKey', 'fieldType'],
                values: [
                  ['usage_guest', 'float'],
                  ['usage_guest_nice', 'float'],
                  ['usage_idle', 'float'],
                  ['usage_iowait', 'float'],
                  ['usage_irq', 'float'],
                  ['usage_nice', 'float'],
                  ['usage_softirq', 'float'],
                  ['usage_steal', 'float'],
                  ['usage_system', 'float'],
                  ['usage_user', 'float'],
                ],
              },
              {
                name: 'disk',
                columns: ['fieldKey', 'fieldType'],
                values: [
                  ['free', 'integer'],
                  ['inodes_free', 'integer'],
                  ['inodes_total', 'integer'],
                  ['inodes_used', 'integer'],
                  ['total', 'integer'],
                  ['used', 'integer'],
                  ['used_percent', 'float'],
                ],
              },
              {
                name: 'diskio',
                columns: ['fieldKey', 'fieldType'],
                values: [
                  ['io_time', 'integer'],
                  ['iops_in_progress', 'integer'],
                  ['read_bytes', 'integer'],
                  ['read_time', 'integer'],
                  ['reads', 'integer'],
                  ['weighted_io_time', 'integer'],
                  ['write_bytes', 'integer'],
                  ['write_time', 'integer'],
                  ['writes', 'integer'],
                ],
              },
              {
                name: 'mem',
                columns: ['fieldKey', 'fieldType'],
                values: [
                  ['active', 'integer'],
                  ['available', 'integer'],
                  ['available_percent', 'float'],
                  ['buffered', 'integer'],
                  ['cached', 'integer'],
                  ['free', 'integer'],
                  ['inactive', 'integer'],
                  ['slab', 'integer'],
                  ['total', 'integer'],
                  ['used', 'integer'],
                  ['used_percent', 'float'],
                  ['wired', 'integer'],
                ],
              },
              {
                name: 'processes',
                columns: ['fieldKey', 'fieldType'],
                values: [
                  ['blocked', 'integer'],
                  ['idle', 'integer'],
                  ['running', 'integer'],
                  ['sleeping', 'integer'],
                  ['stopped', 'integer'],
                  ['total', 'integer'],
                  ['unknown', 'integer'],
                  ['zombies', 'integer'],
                ],
              },
              {
                name: 'swap',
                columns: ['fieldKey', 'fieldType'],
                values: [
                  ['free', 'integer'],
                  ['in', 'integer'],
                  ['out', 'integer'],
                  ['total', 'integer'],
                  ['used', 'integer'],
                  ['used_percent', 'float'],
                ],
              },
              {
                name: 'syslog',
                columns: ['fieldKey', 'fieldType'],
                values: [
                  ['facility_code', 'integer'],
                  ['message', 'string'],
                  ['procid', 'string'],
                  ['severity_code', 'integer'],
                  ['timestamp', 'integer'],
                  ['version', 'integer'],
                ],
              },
              {
                name: 'system',
                columns: ['fieldKey', 'fieldType'],
                values: [
                  ['load1', 'float'],
                  ['load15', 'float'],
                  ['load5', 'float'],
                  ['n_cpus', 'integer'],
                  ['n_users', 'integer'],
                  ['uptime', 'integer'],
                  ['uptime_format', 'string'],
                ],
              },
            ],
          },
        ],
      },
    },
  ]

  const expected = {
    data: [
      ['measurement', 'fieldKey', 'fieldType'],
      ['cpu', 'usage_guest', 'float'],
      ['cpu', 'usage_guest_nice', 'float'],
      ['cpu', 'usage_idle', 'float'],
      ['cpu', 'usage_iowait', 'float'],
      ['cpu', 'usage_irq', 'float'],
      ['cpu', 'usage_nice', 'float'],
      ['cpu', 'usage_softirq', 'float'],
      ['cpu', 'usage_steal', 'float'],
      ['cpu', 'usage_system', 'float'],
      ['cpu', 'usage_user', 'float'],
      ['disk', 'free', 'integer'],
      ['disk', 'inodes_free', 'integer'],
      ['disk', 'inodes_total', 'integer'],
      ['disk', 'inodes_used', 'integer'],
      ['disk', 'total', 'integer'],
      ['disk', 'used', 'integer'],
      ['disk', 'used_percent', 'float'],
      ['diskio', 'io_time', 'integer'],
      ['diskio', 'iops_in_progress', 'integer'],
      ['diskio', 'read_bytes', 'integer'],
      ['diskio', 'read_time', 'integer'],
      ['diskio', 'reads', 'integer'],
      ['diskio', 'weighted_io_time', 'integer'],
      ['diskio', 'write_bytes', 'integer'],
      ['diskio', 'write_time', 'integer'],
      ['diskio', 'writes', 'integer'],
      ['mem', 'active', 'integer'],
      ['mem', 'available', 'integer'],
      ['mem', 'available_percent', 'float'],
      ['mem', 'buffered', 'integer'],
      ['mem', 'cached', 'integer'],
      ['mem', 'free', 'integer'],
      ['mem', 'inactive', 'integer'],
      ['mem', 'slab', 'integer'],
      ['mem', 'total', 'integer'],
      ['mem', 'used', 'integer'],
      ['mem', 'used_percent', 'float'],
      ['mem', 'wired', 'integer'],
      ['processes', 'blocked', 'integer'],
      ['processes', 'idle', 'integer'],
      ['processes', 'running', 'integer'],
      ['processes', 'sleeping', 'integer'],
      ['processes', 'stopped', 'integer'],
      ['processes', 'total', 'integer'],
      ['processes', 'unknown', 'integer'],
      ['processes', 'zombies', 'integer'],
      ['swap', 'free', 'integer'],
      ['swap', 'in', 'integer'],
      ['swap', 'out', 'integer'],
      ['swap', 'total', 'integer'],
      ['swap', 'used', 'integer'],
      ['swap', 'used_percent', 'float'],
      ['syslog', 'facility_code', 'integer'],
      ['syslog', 'message', 'string'],
      ['syslog', 'procid', 'string'],
      ['syslog', 'severity_code', 'integer'],
      ['syslog', 'timestamp', 'integer'],
      ['syslog', 'version', 'integer'],
      ['system', 'load1', 'float'],
      ['system', 'load15', 'float'],
      ['system', 'load5', 'float'],
      ['system', 'n_cpus', 'integer'],
      ['system', 'n_users', 'integer'],
      ['system', 'uptime', 'integer'],
      ['system', 'uptime_format', 'string'],
    ],
    sortedLabels: [
      {
        label: 'measurement',
        responseIndex: 0,
        seriesIndex: 7,
      },
      {
        label: 'fieldKey',
        responseIndex: 0,
        seriesIndex: 7,
      },
      {
        label: 'fieldType',
        responseIndex: 0,
        seriesIndex: 7,
      },
    ],
    influxQLQueryType: 'MetaQuery',
  }

  const actual = timeSeriesToTableGraph(metaQueryResponse)

  expect(actual).toEqual(expected)
})

it('errors when both meta query and data query response', () => {
  const influxResponse = [
    {
      response: {
        results: [
          {
            statement_id: 0,
            series: [
              {
                name: 'measurements',
                columns: ['name'],
                values: [['cpu'], ['disk']],
              },
            ],
          },
        ],
      },
    },
    {
      response: {
        results: [
          {
            statement_id: 0,
            series: [
              {
                name: 'm1',
                columns: ['time', 'f1'],
                values: [[100, 1], [3000, 3], [200, 2]],
              },
            ],
          },
        ],
      },
    },
  ]

  expect(() => timeSeriesToTableGraph(influxResponse)).toThrow()
})

describe('timeSeriesToTableGraph', () => {
  it('parses raw data into a nested array of data', () => {
    const influxResponse = [
      {
        response: {
          results: [
            {
              statement_id: 0,
              series: [
                {
                  name: 'mb',
                  columns: ['time', 'f1'],
                  values: [[1000, 1], [2000, 2]],
                },
              ],
            },
            {
              statement_id: 0,
              series: [
                {
                  name: 'ma',
                  columns: ['time', 'f1'],
                  values: [[1000, 1], [2000, 2]],
                },
              ],
            },
            {
              statement_id: 0,
              series: [
                {
                  name: 'mc',
                  columns: ['time', 'f2'],
                  values: [[2000, 3], [4000, 4]],
                },
              ],
            },
            {
              statement_id: 0,
              series: [
                {
                  name: 'mc',
                  columns: ['time', 'f1'],
                  values: [[2000, 3], [4000, 4]],
                },
              ],
            },
          ],
        },
      },
    ]

    const actual = timeSeriesToTableGraph(influxResponse)
    const expected = [
      ['time', 'ma.f1', 'mb.f1', 'mc.f1', 'mc.f2'],
      [1000, 1, 1, null, null],
      [2000, 2, 2, 3, 3],
      [4000, null, null, 4, 4],
    ]

    expect(actual.data).toEqual(expected)
  })

  it('parses raw data into a table-readable format with the first row being labels', () => {
    const influxResponse = [
      {
        response: {
          results: [
            {
              statement_id: 0,
              series: [
                {
                  name: 'mb',
                  columns: ['time', 'f1'],
                  values: [[1000, 1], [2000, 2]],
                },
              ],
            },
            {
              statement_id: 0,
              series: [
                {
                  name: 'ma',
                  columns: ['time', 'f1'],
                  values: [[1000, 1], [2000, 2]],
                },
              ],
            },
            {
              statement_id: 0,
              series: [
                {
                  name: 'mc',
                  columns: ['time', 'f2'],
                  values: [[2000, 3], [4000, 4]],
                },
              ],
            },
            {
              statement_id: 0,
              series: [
                {
                  name: 'mc',
                  columns: ['time', 'f1'],
                  values: [[2000, 3], [4000, 4]],
                },
              ],
            },
          ],
        },
      },
    ]

    const actual = timeSeriesToTableGraph(influxResponse)
    const expected = ['time', 'ma.f1', 'mb.f1', 'mc.f1', 'mc.f2']

    expect(actual.data[0]).toEqual(expected)
  })

  it('returns an array of an empty array if there is an empty response', () => {
    const influxResponse = []
    const actual = timeSeriesToTableGraph(influxResponse)
    const expected = [[]]

    expect(actual.data).toEqual(expected)
  })

  it('parses raw meta-query responses into table-readable format', () => {
    const influxResponse = [
      {
        response: {
          results: [
            {
              statement_id: 0,
              series: [
                {
                  name: 'measurements',
                  columns: ['name'],
                  values: [
                    ['cpu'],
                    ['disk'],
                    ['diskio'],
                    ['mem'],
                    ['processes'],
                    ['swap'],
                    ['syslog'],
                    ['system'],
                  ],
                },
              ],
            },
          ],
        },
      },
    ]

    const actual = timeSeriesToTableGraph(influxResponse)
    const expected = [
      ['name'],
      ['cpu'],
      ['disk'],
      ['diskio'],
      ['mem'],
      ['processes'],
      ['swap'],
      ['syslog'],
      ['system'],
    ]

    expect(actual.data).toEqual(expected)
    expect(actual.influxQLQueryType).toEqual(InfluxQLQueryType.MetaQuery)
  })
  it('returns all table results even with duplicate time rows #5502', () => {
    const influxResponse = [
      {
        response: {
          results: [
            {
              statement_id: 0,
              series: [
                {
                  name: 'mem',
                  columns: ['time', 'host', 'val'],
                  values: [
                    [1000, 'a', 1],
                    [1000, 'b', 2],
                    [2000, 'b', 3],
                    [2000, 'c', 4],
                  ],
                },
              ],
            },
          ],
          uuid: '8cb3862f-aacf-4c3a-990f-4479de00ff99',
        },
      },
    ]

    const actual = timeSeriesToTableGraph(influxResponse)
    const expected = [
      ['time', 'mem.host', 'mem.val'],
      [1000, 'a', 1],
      [1000, 'b', 2],
      [2000, 'b', 3],
      [2000, 'c', 4],
    ]

    expect(actual.data).toEqual(expected)
    expect(actual.influxQLQueryType).toEqual(InfluxQLQueryType.DataQuery)
  })
})

describe('filterTableColumns', () => {
  it("returns a nested array of fieldnamesthat only include columns whose corresponding fieldName's visibility is true", () => {
    const data = [
      ['time', 'f1', 'f2'],
      [1000, 3000, 2000],
      [2000, 1000, 3000],
      [3000, 2000, 1000],
    ]

    const fieldOptions = [
      {internalName: 'time', displayName: 'Time', visible: true},
      {internalName: 'f1', displayName: '', visible: false},
      {internalName: 'f2', displayName: 'F2', visible: false},
    ]

    const actual = filterTableColumns(data, fieldOptions)
    const expected = [['time'], [1000], [2000], [3000]]
    expect(actual).toEqual(expected)
  })

  it('returns an array of an empty array if all fieldOptions are not visible', () => {
    const data = [
      ['time', 'f1', 'f2'],
      [1000, 3000, 2000],
      [2000, 1000, 3000],
      [3000, 2000, 1000],
    ]

    const fieldOptions = [
      {internalName: 'time', displayName: 'Time', visible: false},
      {internalName: 'f1', displayName: '', visible: false},
      {internalName: 'f2', displayName: 'F2', visible: false},
    ]

    const actual = filterTableColumns(data, fieldOptions)
    const expected = [[]]
    expect(actual).toEqual(expected)
  })
})

describe('transformTableData', () => {
  it('sorts the data based on the provided sortFieldName', () => {
    const data = [
      ['time', 'f1', 'f2'],
      [1000, 3000, 2000],
      [2000, 1000, 3000],
      [3000, 2000, 1000],
    ]
    const sort = {field: 'f1', direction: DEFAULT_SORT_DIRECTION}
    const sortBy = {internalName: 'time', displayName: 'Time', visible: true}
    const tableOptions = {
      verticalTimeAxis: true,
      sortBy,
      fixFirstColumn: true,
    }
    const timeFormat = DEFAULT_TIME_FORMAT
    const decimalPlaces = DEFAULT_DECIMAL_PLACES
    const fieldOptions = [
      {internalName: 'time', displayName: 'Time', visible: true},
      {internalName: 'f1', displayName: '', visible: true},
      {internalName: 'f2', displayName: 'F2', visible: true},
    ]

    const actual = transformTableData(
      data,
      sort,
      fieldOptions,
      tableOptions,
      timeFormat,
      decimalPlaces
    )

    const expected = [
      ['time', 'f1', 'f2'],
      [2000, 1000, 3000],
      [3000, 2000, 1000],
      [1000, 3000, 2000],
    ]

    expect(actual.transformedData).toEqual(expected)
  })

  it('filters out columns that should not be visible', () => {
    const data = [
      ['time', 'f1', 'f2'],
      [1000, 3000, 2000],
      [2000, 1000, 3000],
      [3000, 2000, 1000],
    ]
    const sort = {field: 'time', direction: DEFAULT_SORT_DIRECTION}
    const sortBy = {internalName: 'time', displayName: 'Time', visible: true}
    const tableOptions = {
      verticalTimeAxis: true,
      sortBy,
      fixFirstColumn: true,
    }
    const timeFormat = DEFAULT_TIME_FORMAT
    const decimalPlaces = DEFAULT_DECIMAL_PLACES
    const fieldOptions = [
      {internalName: 'time', displayName: 'Time', visible: true},
      {internalName: 'f1', displayName: '', visible: false},
      {internalName: 'f2', displayName: 'F2', visible: true},
    ]

    const actual = transformTableData(
      data,
      sort,
      fieldOptions,
      tableOptions,
      timeFormat,
      decimalPlaces
    )

    const expected = [['time', 'f2'], [1000, 2000], [2000, 3000], [3000, 1000]]

    expect(actual.transformedData).toEqual(expected)
  })

  it('filters out invisible columns after sorting', () => {
    const data = [
      ['time', 'f1', 'f2'],
      [1000, 3000, 2000],
      [2000, 1000, 3000],
      [3000, 2000, 1000],
    ]

    const sort = {field: 'f1', direction: DEFAULT_SORT_DIRECTION}
    const sortBy = {internalName: 'time', displayName: 'Time', visible: true}
    const tableOptions = {
      verticalTimeAxis: true,
      sortBy,
      fixFirstColumn: true,
    }
    const timeFormat = DEFAULT_TIME_FORMAT
    const decimalPlaces = DEFAULT_DECIMAL_PLACES
    const fieldOptions = [
      {internalName: 'time', displayName: 'Time', visible: true},
      {internalName: 'f1', displayName: '', visible: false},
      {internalName: 'f2', displayName: 'F2', visible: true},
    ]

    const actual = transformTableData(
      data,
      sort,
      fieldOptions,
      tableOptions,
      timeFormat,
      decimalPlaces
    )

    const expected = [['time', 'f2'], [2000, 3000], [3000, 1000], [1000, 2000]]

    expect(actual.transformedData).toEqual(expected)
  })
})

describe('if verticalTimeAxis is false', () => {
  it('transforms data', () => {
    const data = [
      ['time', 'f1', 'f2'],
      [1000, 3000, 2000],
      [2000, 1000, 3000],
      [3000, 2000, 1000],
    ]

    const sort = {field: 'time', direction: DEFAULT_SORT_DIRECTION}
    const sortBy = {internalName: 'time', displayName: 'Time', visible: true}
    const tableOptions = {
      sortBy,
      fixFirstColumn: true,
      verticalTimeAxis: false,
    }
    const timeFormat = DEFAULT_TIME_FORMAT
    const decimalPlaces = DEFAULT_DECIMAL_PLACES
    const fieldOptions = [
      {internalName: 'time', displayName: 'Time', visible: true},
      {internalName: 'f1', displayName: '', visible: true},
      {internalName: 'f2', displayName: 'F2', visible: true},
    ]

    const actual = transformTableData(
      data,
      sort,
      fieldOptions,
      tableOptions,
      timeFormat,
      decimalPlaces
    )

    const expected = [
      ['time', 1000, 2000, 3000],
      ['f1', 3000, 1000, 2000],
      ['f2', 2000, 3000, 1000],
    ]

    expect(actual.transformedData).toEqual(expected)
  })

  it('transforms data after filtering out invisible columns', () => {
    const data = [
      ['time', 'f1', 'f2'],
      [1000, 3000, 2000],
      [2000, 1000, 3000],
      [3000, 2000, 1000],
    ]

    const sort = {field: 'f1', direction: DEFAULT_SORT_DIRECTION}
    const sortBy = {internalName: 'time', displayName: 'Time', visible: true}
    const tableOptions = {
      sortBy,
      fixFirstColumn: true,
      verticalTimeAxis: false,
    }
    const timeFormat = DEFAULT_TIME_FORMAT
    const decimalPlaces = DEFAULT_DECIMAL_PLACES
    const fieldOptions = [
      {internalName: 'time', displayName: 'Time', visible: true},
      {internalName: 'f1', displayName: '', visible: false},
      {internalName: 'f2', displayName: 'F2', visible: true},
    ]

    const actual = transformTableData(
      data,
      sort,
      fieldOptions,
      tableOptions,
      timeFormat,
      decimalPlaces
    )

    const expected = [['time', 2000, 3000, 1000], ['f2', 3000, 1000, 2000]]

    expect(actual.transformedData).toEqual(expected)
  })
})

describe('computeFieldOptions', () => {
  it('orders field options correctly for metaqueries', () => {
    const existingFieldOptions = [
      {
        internalName: 'count',
        displayName: '',
        visible: true,
      },
    ]

    const sortedLabels = [
      {
        label: 'measurement',
        responseIndex: 0,
        seriesIndex: 7,
      },
      {
        label: 'count',
        responseIndex: 0,
        seriesIndex: 7,
      },
    ]

    const dataType = DataType.influxQL
    const influxQLQueryType = InfluxQLQueryType.MetaQuery

    const actual = computeFieldOptions(
      existingFieldOptions,
      sortedLabels,
      dataType,
      influxQLQueryType
    )

    const expected = [
      {
        internalName: 'measurement',
        displayName: '',
        visible: true,
      },
      {
        internalName: 'count',
        displayName: '',
        visible: true,
      },
    ]

    expect(actual).toEqual(expected)
  })
})
