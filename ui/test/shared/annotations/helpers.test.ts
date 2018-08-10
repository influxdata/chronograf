import {TagFilterType} from 'src/types/annotations'
import {tagFilterToInfluxQLExp} from 'src/shared/annotations/helpers'

describe('tagFilterToInfluxQLExp', () => {
  describe('with TagFilterType', () => {
    test('TagFilterType.Equals', () => {
      const tagFilter = {
        id: '0',
        tagKey: 'foo',
        tagValue: 'bar',
        filterType: TagFilterType.Equals,
      }

      const actual = tagFilterToInfluxQLExp(tagFilter)
      const expected = `"foo" = 'bar'`

      expect(actual).toEqual(expected)
    })

    test('TagFilterType.NotEquals', () => {
      const tagFilter = {
        id: '0',
        tagKey: 'foo',
        tagValue: 'bar',
        filterType: TagFilterType.NotEquals,
      }

      const actual = tagFilterToInfluxQLExp(tagFilter)
      const expected = `"foo" != 'bar'`

      expect(actual).toEqual(expected)
    })

    test('TagFilterType.RegEquals', () => {
      const tagFilter = {
        id: '0',
        tagKey: 'foo',
        tagValue: 'bar',
        filterType: TagFilterType.RegEquals,
      }

      const actual = tagFilterToInfluxQLExp(tagFilter)
      const expected = `"foo" =~ /bar/`

      expect(actual).toEqual(expected)
    })

    test('TagFilterType.RegNotEquals', () => {
      const tagFilter = {
        id: '0',
        tagKey: 'foo',
        tagValue: 'bar',
        filterType: TagFilterType.RegNotEquals,
      }

      const actual = tagFilterToInfluxQLExp(tagFilter)
      const expected = `"foo" !~ /bar/`

      expect(actual).toEqual(expected)
    })
  })
})
