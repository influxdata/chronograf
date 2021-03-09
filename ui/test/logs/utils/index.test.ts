import {parseHistogramQueryResponse} from 'src/logs/utils'
import {TimeSeriesResponse, TimeSeriesSuccessfulResult} from 'src/types/series'

describe('parseHistogramQueryResponse', () => {
  test('it parses a nonempty response correctly', () => {
    const NONEMPTY_RESPONSE: TimeSeriesResponse = {
      results: [
        {
          statement_id: 0,
          series: [
            {
              name: 'syslog',
              tags: {severity: 'debug'},
              columns: ['time', 'count'],
              values: [
                [1530129062000, 0],
                [1530129093000, 0],
              ],
            },
            {
              name: 'syslog',
              tags: {severity: 'err'},
              columns: ['time', 'count'],
              values: [
                [1530129062000, 0],
                [1530129093000, 0],
              ],
            },
          ],
        },
      ],
    }

    const expected = [
      {
        group: 'debug',
        key: 'debug-0-1530129062000',
        time: 1530129062000,
        value: 0,
      },
      {
        group: 'debug',
        key: 'debug-0-1530129093000',
        time: 1530129093000,
        value: 0,
      },
      {
        group: 'err',
        key: 'err-0-1530129062000',
        time: 1530129062000,
        value: 0,
      },
      {
        group: 'err',
        key: 'err-0-1530129093000',
        time: 1530129093000,
        value: 0,
      },
    ]

    const actual = parseHistogramQueryResponse(NONEMPTY_RESPONSE)

    expect(actual).toEqual(expected)
  })

  test('it parses an empty response correctly', () => {
    const EMPTY_RESPONSE: TimeSeriesResponse = {
      results: [{statement_id: 0} as TimeSeriesSuccessfulResult],
    }
    const expected = []
    const actual = parseHistogramQueryResponse(EMPTY_RESPONSE)

    expect(actual).toEqual(expected)
  })
})
