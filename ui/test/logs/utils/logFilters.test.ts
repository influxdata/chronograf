import {searchToFilters} from 'src/logs/utils/search'
import {Operator} from 'src/types/logs'

describe('Logs.Search.logFilters', () => {
  const isUUID = expect.stringMatching(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
  )

  it('can return like filters for terms', () => {
    const text = 'seq_!@.#: TERMS /api/search'
    const actual = searchToFilters(text)

    const expected = [
      {
        id: isUUID,
        key: 'message',
        value: 'seq_!@.#:',
        operator: Operator.LIKE,
      },
      {
        id: isUUID,
        key: 'message',
        value: 'TERMS',
        operator: Operator.LIKE,
      },
      {
        id: isUUID,
        key: 'message',
        value: '/api/search',
        operator: Operator.LIKE,
      },
    ]

    expect(actual).toEqual(expected)
  })

  it('can return not like filters for term exclusions', () => {
    const text = '/api/search -status_bad -@123!'
    const actual = searchToFilters(text)

    const expected = [
      {
        id: isUUID,
        key: 'message',
        value: 'status_bad',
        operator: Operator.NOT_LIKE,
      },
      {
        id: isUUID,
        key: 'message',
        value: '@123!',
        operator: Operator.NOT_LIKE,
      },
      {
        id: isUUID,
        key: 'message',
        value: '/api/search',
        operator: Operator.LIKE,
      },
    ]

    expect(actual).toEqual(expected)
  })

  it('can create filters for phrases', () => {
    const text = '"/api/search status:200" "a success"'
    const actual = searchToFilters(text)

    const expected = [
      {
        id: isUUID,
        key: 'message',
        value: '/api/search status:200',
        operator: Operator.LIKE,
      },
      {
        id: isUUID,
        key: 'message',
        value: 'a success',
        operator: Operator.LIKE,
      },
    ]

    expect(actual).toEqual(expected)
  })

  it('can create filters for excluded phrases', () => {
    const text = '-"/api/search status:200" -"a success"'
    const actual = searchToFilters(text)

    const expected = [
      {
        id: isUUID,
        key: 'message',
        value: '/api/search status:200',
        operator: Operator.NOT_LIKE,
      },
      {
        id: isUUID,
        key: 'message',
        value: 'a success',
        operator: Operator.NOT_LIKE,
      },
    ]

    expect(actual).toEqual(expected)
  })

  it('can create filters for phrases and terms', () => {
    const text = `status:4\d{2} -"NOT FOUND" 'some "quote"' -thing`
    const actual = searchToFilters(text)

    const expected = [
      {
        id: isUUID,
        key: 'message',
        value: 'NOT FOUND',
        operator: Operator.NOT_LIKE,
      },
      {
        id: isUUID,
        key: 'message',
        value: 'some "quote"',
        operator: Operator.LIKE,
      },
      {
        id: isUUID,
        key: 'message',
        value: 'thing',
        operator: Operator.NOT_LIKE,
      },
      {
        id: isUUID,
        key: 'message',
        value: 'status:4d{2}',
        operator: Operator.LIKE,
      },
    ]

    expect(actual).toEqual(expected)
  })

  it('cannot handle double quoted phrase containing single quotes', () => {
    const text = `"some 'quote'"`
    const actual = searchToFilters(text)

    const expected = [
      {
        id: isUUID,
        key: 'message',
        value: 'quote',
        operator: Operator.LIKE,
      },
      {
        id: isUUID,
        key: 'message',
        value: 'some',
        operator: Operator.LIKE,
      },
    ]

    expect(actual).toEqual(expected)
  })
})
