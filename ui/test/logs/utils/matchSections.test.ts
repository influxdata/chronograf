import {Filter, MatchType} from 'src/types/logs'
import {getMatchSections, filtersToPattern} from 'src/logs/utils/matchSections'

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

  const searchPattern = filtersToPattern(filters)

  it('can match a term', () => {
    const text = 'before term after'
    const actual = getMatchSections(searchPattern, text)

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

  it('can match multiple terms', () => {
    const text = 'other term after term other term'
    const actual = getMatchSections(searchPattern, text)

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

  it('can handle null pattern', () => {
    const text = 'other term after term other term'
    const actual = getMatchSections(null, text)

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
    const actual = getMatchSections(searchPattern, text)

    const expected = [
      {
        id: isUUID,
        type: MatchType.NONE,
        text,
      },
    ]

    expect(actual).toEqual(expected)
  })

  it('can match group terms', () => {
    const text = 'before stuff afterward'
    const filter = {
      id: '123',
      key: 'message',
      value: '(stuff)',
      operator: '=~',
    }
    const pattern = filtersToPattern([...filters, filter])
    const actual = getMatchSections(pattern, text)

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

  it('can match complex terms', () => {
    const text = 'start fluff puff fluff end'
    const filter = {
      id: '123',
      key: 'message',
      value: '((fl|p)uff)',
      operator: '=~',
    }
    const pattern = filtersToPattern([...filters, filter])
    const actual = getMatchSections(pattern, text)

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
})
