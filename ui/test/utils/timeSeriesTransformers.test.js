import timeSeriesToDygraph, {
  timeSeriesToTableGraph,
  filterTableColumns,
  processTableData,
} from 'src/utils/timeSeriesTransformers'
import {DEFAULT_SORT} from 'src/shared/constants/tableGraph'

describe('timeSeriesToDygraph', () => {
  it('parses a raw InfluxDB response into a dygraph friendly data format', () => {
    const influxResponse = [
      {
        response: {
          results: [
            {
              series: [
                {
                  name: 'm1',
                  columns: ['time', 'f1'],
                  values: [[1000, 1], [2000, 2]],
                },
              ],
            },
            {
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

  it('can parse multiple responses into two axes', () => {
    const influxResponse = [
      {
        response: {
          results: [
            {
              series: [
                {
                  name: 'm1',
                  columns: ['time', 'f1'],
                  values: [[1000, 1], [2000, 2]],
                },
              ],
            },
            {
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
      {
        response: {
          results: [
            {
              series: [
                {
                  name: 'm3',
                  columns: ['time', 'f3'],
                  values: [[1000, 1], [2000, 2]],
                },
              ],
            },
          ],
        },
      },
    ]

    const actual = timeSeriesToDygraph(influxResponse)

    const expected = {
      'm1.f1': {
        axis: 'y',
      },
      'm1.f2': {
        axis: 'y',
      },
      'm3.f3': {
        axis: 'y2',
      },
    }

    expect(actual.dygraphSeries).toEqual(expected)
  })

  it('can parse multiple responses with the same field and measurement', () => {
    const influxResponse = [
      {
        response: {
          results: [
            {
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
          axis: 'y2',
        },
      },
    }

    expect(actual).toEqual(expected)
  })

  it('it does not use multiple axes if being used for the DataExplorer', () => {
    const influxResponse = [
      {
        response: {
          results: [
            {
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

    const isInDataExplorer = true
    const actual = timeSeriesToDygraph(influxResponse, isInDataExplorer)

    const expected = {}

    expect(actual.dygraphSeries).toEqual(expected)
  })

  it('parses a raw InfluxDB response into a dygraph friendly data format', () => {
    const influxResponse = [
      {
        response: {
          results: [
            {
              series: [
                {
                  name: 'mb',
                  columns: ['time', 'f1'],
                  values: [[1000, 1], [2000, 2]],
                },
              ],
            },
            {
              series: [
                {
                  name: 'ma',
                  columns: ['time', 'f1'],
                  values: [[1000, 1], [2000, 2]],
                },
              ],
            },
            {
              series: [
                {
                  name: 'mc',
                  columns: ['time', 'f2'],
                  values: [[2000, 3], [4000, 4]],
                },
              ],
            },
            {
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

describe('timeSeriesToTableGraph', () => {
  it('parses raw data into a nested array of data', () => {
    const influxResponse = [
      {
        response: {
          results: [
            {
              series: [
                {
                  name: 'mb',
                  columns: ['time', 'f1'],
                  values: [[1000, 1], [2000, 2]],
                },
              ],
            },
            {
              series: [
                {
                  name: 'ma',
                  columns: ['time', 'f1'],
                  values: [[1000, 1], [2000, 2]],
                },
              ],
            },
            {
              series: [
                {
                  name: 'mc',
                  columns: ['time', 'f2'],
                  values: [[2000, 3], [4000, 4]],
                },
              ],
            },
            {
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

  it('returns labels starting with time and then alphabetized', () => {
    const influxResponse = [
      {
        response: {
          results: [
            {
              series: [
                {
                  name: 'mb',
                  columns: ['time', 'f1'],
                  values: [[1000, 1], [2000, 2]],
                },
              ],
            },
            {
              series: [
                {
                  name: 'ma',
                  columns: ['time', 'f1'],
                  values: [[1000, 1], [2000, 2]],
                },
              ],
            },
            {
              series: [
                {
                  name: 'mc',
                  columns: ['time', 'f2'],
                  values: [[2000, 3], [4000, 4]],
                },
              ],
            },
            {
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

    expect(actual.labels).toEqual(expected)
  })

  it('parses raw data into a table-readable format with the first row being labels', () => {
    const influxResponse = [
      {
        response: {
          results: [
            {
              series: [
                {
                  name: 'mb',
                  columns: ['time', 'f1'],
                  values: [[1000, 1], [2000, 2]],
                },
              ],
            },
            {
              series: [
                {
                  name: 'ma',
                  columns: ['time', 'f1'],
                  values: [[1000, 1], [2000, 2]],
                },
              ],
            },
            {
              series: [
                {
                  name: 'mc',
                  columns: ['time', 'f2'],
                  values: [[2000, 3], [4000, 4]],
                },
              ],
            },
            {
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
})

describe('filterTableColumns', () => {
  it("returns a nested array of fieldnamesthat only include columns whose corresponding fieldName's visibility is true", () => {
    const data = [
      ['time', 'f1', 'f2'],
      [1000, 3000, 2000],
      [2000, 1000, 3000],
      [3000, 2000, 1000],
    ]

    const fieldNames = [
      {internalName: 'time', displayName: 'Time', visible: true},
      {internalName: 'f1', displayName: '', visible: false},
      {internalName: 'f2', displayName: 'F2', visible: false},
    ]

    const actual = filterTableColumns(data, fieldNames)
    const expected = [['time'], [1000], [2000], [3000]]
    expect(actual).toEqual(expected)
  })

  it('returns an array of an empty array if all fieldNames are not visible', () => {
    const data = [
      ['time', 'f1', 'f2'],
      [1000, 3000, 2000],
      [2000, 1000, 3000],
      [3000, 2000, 1000],
    ]

    const fieldNames = [
      {internalName: 'time', displayName: 'Time', visible: false},
      {internalName: 'f1', displayName: '', visible: false},
      {internalName: 'f2', displayName: 'F2', visible: false},
    ]

    const actual = filterTableColumns(data, fieldNames)
    const expected = [[]]
    expect(actual).toEqual(expected)
  })
})

describe('processTableData', () => {
  it('sorts the data based on the provided sortFieldName', () => {
    const data = [
      ['time', 'f1', 'f2'],
      [1000, 3000, 2000],
      [2000, 1000, 3000],
      [3000, 2000, 1000],
    ]
    const sortFieldName = 'f1'
    const direction = DEFAULT_SORT
    const verticalTimeAxis = true

    const fieldNames = [
      {internalName: 'time', displayName: 'Time', visible: true},
      {internalName: 'f1', displayName: '', visible: true},
      {internalName: 'f2', displayName: 'F2', visible: true},
    ]

    const actual = processTableData(
      data,
      sortFieldName,
      direction,
      verticalTimeAxis,
      fieldNames
    )
    const expected = [
      ['time', 'f1', 'f2'],
      [2000, 1000, 3000],
      [3000, 2000, 1000],
      [1000, 3000, 2000],
    ]

    expect(actual.processedData).toEqual(expected)
  })

  it('filters out columns that should not be visible', () => {
    const data = [
      ['time', 'f1', 'f2'],
      [1000, 3000, 2000],
      [2000, 1000, 3000],
      [3000, 2000, 1000],
    ]
    const sortFieldName = 'time'
    const direction = DEFAULT_SORT
    const verticalTimeAxis = true

    const fieldNames = [
      {internalName: 'time', displayName: 'Time', visible: true},
      {internalName: 'f1', displayName: '', visible: false},
      {internalName: 'f2', displayName: 'F2', visible: true},
    ]

    const actual = processTableData(
      data,
      sortFieldName,
      direction,
      verticalTimeAxis,
      fieldNames
    )
    const expected = [['time', 'f2'], [1000, 2000], [2000, 3000], [3000, 1000]]

    expect(actual.processedData).toEqual(expected)
  })

  it('filters out invisible columns after sorting', () => {
    const data = [
      ['time', 'f1', 'f2'],
      [1000, 3000, 2000],
      [2000, 1000, 3000],
      [3000, 2000, 1000],
    ]
    const sortFieldName = 'f1'
    const direction = DEFAULT_SORT
    const verticalTimeAxis = true

    const fieldNames = [
      {internalName: 'time', displayName: 'Time', visible: true},
      {internalName: 'f1', displayName: '', visible: false},
      {internalName: 'f2', displayName: 'F2', visible: true},
    ]

    const actual = processTableData(
      data,
      sortFieldName,
      direction,
      verticalTimeAxis,
      fieldNames
    )
    const expected = [['time', 'f2'], [2000, 3000], [3000, 1000], [1000, 2000]]

    expect(actual.processedData).toEqual(expected)
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
    const sortFieldName = 'time'
    const direction = DEFAULT_SORT
    const verticalTimeAxis = false

    const fieldNames = [
      {internalName: 'time', displayName: 'Time', visible: true},
      {internalName: 'f1', displayName: '', visible: true},
      {internalName: 'f2', displayName: 'F2', visible: true},
    ]

    const actual = processTableData(
      data,
      sortFieldName,
      direction,
      verticalTimeAxis,
      fieldNames
    )
    const expected = [
      ['time', 1000, 2000, 3000],
      ['f1', 3000, 1000, 2000],
      ['f2', 2000, 3000, 1000],
    ]

    expect(actual.processedData).toEqual(expected)
  })

  it('transforms data after filtering out invisible columns', () => {
    const data = [
      ['time', 'f1', 'f2'],
      [1000, 3000, 2000],
      [2000, 1000, 3000],
      [3000, 2000, 1000],
    ]
    const sortFieldName = 'f1'
    const direction = DEFAULT_SORT
    const verticalTimeAxis = false

    const fieldNames = [
      {internalName: 'time', displayName: 'Time', visible: true},
      {internalName: 'f1', displayName: '', visible: false},
      {internalName: 'f2', displayName: 'F2', visible: true},
    ]

    const actual = processTableData(
      data,
      sortFieldName,
      direction,
      verticalTimeAxis,
      fieldNames
    )
    const expected = [['time', 2000, 3000, 1000], ['f2', 3000, 1000, 2000]]

    expect(actual.processedData).toEqual(expected)
  })
})
