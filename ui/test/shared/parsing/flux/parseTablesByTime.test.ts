import {parseResponse} from 'src/shared/parsing/flux/response'
import {SIMPLE, TAGS_RESPONSE} from 'test/shared/parsing/flux/constants'
import {parseTablesByTime} from 'src/shared/parsing/flux/parseTablesByTime'

describe('parseTablesByTime', () => {
  it('can parse common flux table with simplified column names', () => {
    const fluxTables = parseResponse(SIMPLE)
    const actual = parseTablesByTime(fluxTables)
    const expected = {
      allColumnNames: [
        'usage_guest measurement=cpu cpu=cpu1 host=bertrand.local',
      ],
      nonNumericColumns: [],
      tablesByTime: [
        {
          '1536618869000': {
            'usage_guest measurement=cpu cpu=cpu1 host=bertrand.local': 0,
          },
          '1536618879000': {
            'usage_guest measurement=cpu cpu=cpu1 host=bertrand.local': 10,
          },
        },
      ],
    }

    expect(actual).toEqual(expected)
  })
  it('can parse metadata flux response', () => {
    const fluxTables = parseResponse(TAGS_RESPONSE)
    const actual = parseTablesByTime(fluxTables)
    const expected = {
      allColumnNames: [],
      nonNumericColumns: ['_value'],
      tablesByTime: [],
    }

    expect(actual).toEqual(expected)
  })
})
