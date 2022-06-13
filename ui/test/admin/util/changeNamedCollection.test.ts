import {
  computeNamedChanges,
  changeNamedCollection,
} from 'src/admin/util/changeNamedCollection'

describe('admin/util/changeNamedCollection', () => {
  describe('computeNamedChanges', () => {
    it('returns undefined upon no change', () => {
      expect(computeNamedChanges([], [])).toBe(undefined)
      expect(computeNamedChanges([{name: 'a'}], [{name: 'a'}])).toBe(undefined)
    })
    it('returns value indicating changes', () => {
      expect(
        computeNamedChanges([{name: 'a'}, {name: 'b'}], [{name: 'a'}])
      ).toEqual({b: false})
      expect(
        computeNamedChanges([{name: 'a'}], [{name: 'a'}, {name: 'b'}])
      ).toEqual({b: true})
      expect(
        computeNamedChanges(
          [{name: 'a'}, {name: 'c'}],
          [{name: 'a'}, {name: 'b'}]
        )
      ).toEqual({b: true, c: false})
    })
  })
  describe('changeNamedCollection', () => {
    it('changes nothing upon no change', () => {
      const collection = [{name: 'a'}, {name: 'b'}]
      expect(changeNamedCollection(collection, {name: 'c'}, undefined)).toBe(
        collection
      )
    })
    it('removes from collection', () => {
      const collection = [{name: 'a'}, {name: 'b'}]
      expect(changeNamedCollection(collection, {name: 'a'}, false)).toEqual([
        {name: 'b'},
      ])
      expect(changeNamedCollection(collection, {name: 'b'}, false)).toEqual([
        {name: 'a'},
      ])
      expect(changeNamedCollection(collection, {name: 'c'}, false)).toEqual(
        collection
      )
    })
    it('adds to collection', () => {
      const collection = [{name: 'b'}, {name: 'd'}]
      expect(changeNamedCollection([], {name: 'a'}, true)).toEqual([
        {name: 'a'},
      ])
      expect(changeNamedCollection(collection, {name: 'a'}, true)).toEqual([
        {name: 'a'},
        {name: 'b'},
        {name: 'd'},
      ])
      expect(changeNamedCollection(collection, {name: 'c'}, true)).toEqual([
        {name: 'b'},
        {name: 'c'},
        {name: 'd'},
      ])
      expect(changeNamedCollection(collection, {name: 'e'}, true)).toEqual([
        {name: 'b'},
        {name: 'd'},
        {name: 'e'},
      ])
    })
  })
})
