import {fluxTablesToDygraphWork as fluxTablesToDygraph} from 'src/worker/jobs/fluxTablesToDygraph'
import {parseResponse} from 'src/shared/parsing/flux/response'
import {
  SIMPLE,
  MISMATCHED,
  MULTI_VALUE_ROW,
  MIXED_DATATYPES,
  WINDOWED_WITH_EMPTY,
} from 'test/shared/parsing/flux/constants'

describe('fluxTablesToDygraph', () => {
  it('can parse flux tables to dygraph series', () => {
    const fluxTables = parseResponse(SIMPLE)
    const actual = fluxTablesToDygraph(fluxTables)
    const expected = [
      [new Date('2018-09-10T22:34:29Z'), 0],
      [new Date('2018-09-10T22:34:39Z'), 10],
    ]

    expect(actual.dygraphsData).toEqual(expected)
  })

  it('can parse flux tables for series of mismatched periods', () => {
    const fluxTables = parseResponse(MISMATCHED)
    const actual = fluxTablesToDygraph(fluxTables)
    const expected = [
      [new Date('2018-06-04T17:12:25Z'), 1, null],
      [new Date('2018-06-04T17:12:35Z'), 2, null],
      [new Date('2018-06-05T17:12:25Z'), null, 10],
      [new Date('2018-06-05T17:12:35Z'), null, 11],
    ]

    expect(actual.dygraphsData).toEqual(expected)
  })

  it('can parse multiple values per row', () => {
    const fluxTables = parseResponse(MULTI_VALUE_ROW)
    const actual = fluxTablesToDygraph(fluxTables)
    const expected = {
      labels: [
        'time',
        'mean_usage_idle measurement=cpu',
        'mean_usage_user measurement=cpu',
        'mean_usage_idle measurement=mem',
        'mean_usage_user measurement=mem',
      ],
      dygraphsData: [
        [new Date('2018-09-10T16:54:37Z'), 85, 10, 8, 1],
        [new Date('2018-09-10T16:54:38Z'), 87, 7, 9, 2],
        [new Date('2018-09-10T16:54:39Z'), 89, 5, 10, 3],
      ],
      nonNumericColumns: [],
    }
    expect(actual).toEqual(expected)
  })

  it('filters out non-numeric series', () => {
    const fluxTables = parseResponse(MIXED_DATATYPES)
    const actual = fluxTablesToDygraph(fluxTables)
    const expected = {
      labels: [
        'time',
        'mean_usage_idle measurement=cpu',
        'mean_usage_idle measurement=mem',
      ],
      dygraphsData: [
        [new Date('2018-09-10T16:54:37Z'), 85, 8],
        [new Date('2018-09-10T16:54:39Z'), 89, 10],
      ],
      nonNumericColumns: ['my_fun_col'],
    }
    expect(actual).toEqual(expected)
  })
  it('returns null if value is not available', () => {
    const fluxTables = parseResponse(WINDOWED_WITH_EMPTY)
    const actual = fluxTablesToDygraph(fluxTables)
    const expected = [
      [new Date('2021-01-01T02:44:10Z'), null],
      [new Date('2021-01-01T02:45:00Z'), 22],
      [new Date('2021-01-01T02:45:50Z'), null],
      [new Date('2021-01-01T02:46:40Z'), 23],
      [new Date('2021-01-01T02:47:30Z'), null],
    ]

    expect(actual.dygraphsData).toEqual(expected)
  })
})
