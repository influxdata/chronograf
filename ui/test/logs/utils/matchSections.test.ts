import {Filter, MatchType} from 'src/types/logs'
import {getMatchSections} from 'src/logs/utils/matchSections'

describe('Logs.matchFilters', () => {
  const isUUID = expect.stringMatching(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
  )

  const filters: Filter[] = [
    {
      id: '123',
      key: 'message',
      value: 'term',
      operator: '=~',
    },
    {
      id: '123',
      key: 'message',
      value: 'other term',
      operator: '=~',
    },
  ]

  it('can match a filter', () => {
    const text = 'before term after'
    const actual = getMatchSections(filters, text)

    const expected = [
      {
        id: isUUID,
        type: MatchType.NONE,
        text: 'before ',
      },
      {
        id: isUUID,
        type: MatchType.MATCH,
        text: 'term',
      },
      {
        id: isUUID,
        type: MatchType.NONE,
        text: ' after',
      },
    ]

    expect(actual).toEqual(expected)
  })

  it('can match multiple filters', () => {
    const text = 'other term after term other term'
    const actual = getMatchSections(filters, text)

    const expected = [
      {
        id: isUUID,
        type: MatchType.NONE,
        text: '',
      },
      {
        id: isUUID,
        type: MatchType.MATCH,
        text: 'other term',
      },
      {
        id: isUUID,
        type: MatchType.NONE,
        text: ' after ',
      },
      {
        id: isUUID,
        type: MatchType.MATCH,
        text: 'term',
      },
      {
        id: isUUID,
        type: MatchType.NONE,
        text: ' ',
      },
      {
        id: isUUID,
        type: MatchType.MATCH,
        text: 'other term',
      },
      {
        id: isUUID,
        type: MatchType.NONE,
        text: '',
      },
    ]

    expect(actual).toEqual(expected)
  })

  it('can match empty filters', () => {
    const text = 'other term after term other term'
    const actual = getMatchSections([], text)

    const expected = [
      {
        id: isUUID,
        type: MatchType.NONE,
        text,
      },
    ]

    expect(actual).toEqual(expected)
  })

  it('can match termless text', () => {
    const text = '     '
    const actual = getMatchSections(filters, text)

    const expected = [
      {
        id: isUUID,
        type: MatchType.NONE,
        text,
      },
    ]

    expect(actual).toEqual(expected)
  })

  it('can match parenthesized filters', () => {
    const text = 'before stuff afterward'
    const filter = {
      id: '123',
      key: 'message',
      value: '(stuff)',
      operator: '=~',
    }
    const actual = getMatchSections([...filters, filter], text)

    const expected = [
      {
        id: isUUID,
        type: MatchType.NONE,
        text: 'before ',
      },
      {
        id: isUUID,
        type: MatchType.MATCH,
        text: 'stuff',
      },
      {
        id: isUUID,
        type: MatchType.NONE,
        text: ' afterward',
      },
    ]

    expect(actual).toEqual(expected)
  })

  it('can match complex filters', () => {
    const text = 'start fluff puff fluff end'
    const filter = {
      id: '123',
      key: 'message',
      value: '((fl|p)uff)',
      operator: '=~',
    }
    const actual = getMatchSections([...filters, filter], text)

    const expected = [
      {
        id: isUUID,
        type: MatchType.NONE,
        text: 'start ',
      },
      {
        id: isUUID,
        type: MatchType.MATCH,
        text: 'fluff',
      },
      {
        id: isUUID,
        type: MatchType.NONE,
        text: ' ',
      },
      {
        id: isUUID,
        type: MatchType.MATCH,
        text: 'puff',
      },
      {
        id: isUUID,
        type: MatchType.NONE,
        text: ' ',
      },
      {
        id: isUUID,
        type: MatchType.MATCH,
        text: 'fluff',
      },
      {
        id: isUUID,
        type: MatchType.NONE,
        text: ' end',
      },
    ]

    expect(actual).toEqual(expected)
  })

  describe('bad filter pattern', () => {
    const errorLog = console.error

    beforeEach(() => {
      console.error = jest.fn(() => {})
    })

    afterEach(() => {
      console.error = errorLog
    })

    it('can handle bad search expressions', () => {
      const text = 'start fluff puff fluff end'
      const filter = {
        id: '123',
        key: 'message',
        value: '((fl|puff)',
        operator: '=~',
      }
      const actual = getMatchSections([...filters, filter], text)

      const expected = [
        {
          id: isUUID,
          type: MatchType.NONE,
          text,
        },
      ]

      expect(actual).toEqual(expected)
      expect(console.error).toBeCalledWith(
        'Syntax Error: bad search filter expression'
      )
    })
  })
})
