// utils
import {
  getSourceInfo,
  mapQueriesInCell,
  getSourceIDFromLink,
  createSourceMappings,
} from 'src/dashboards/utils/importDashboardMappings'

// fixtures
import {source, cell, query, template} from 'test/fixtures'

// constants
import {DYNAMIC_SOURCE, DYNAMIC_SOURCE_INFO} from 'src/dashboards/constants'
import {Template} from 'src/types'

describe('Dashboards.Utils.importDashboardMappings', () => {
  describe('createSourceMappings', () => {
    describe('if there are no cells', () => {
      it('returns object with empty sourcesCells and sourceMappings', () => {
        const cells = []
        const importedSources = {}
        const expected = {sourcesCells: {}, sourceMappings: {}}
        const actual = createSourceMappings(source, cells, importedSources)

        expect(actual).toEqual(expected)
      })
    })

    it('maps cells to their sources from the import', () => {
      const sourceLink1 = '/chronograf/v1/sources/1'
      const sourceLink2 = '/chronograf/v1/sources/2'
      const cellName1 = 'Cell 1'
      const cellName2 = 'Cell 2'
      const cellName3 = 'Cell 3'
      const cellID1 = '1'
      const cellID2 = '2'
      const cellID3 = '3'
      const queryWithSource1 = {...query, source: sourceLink1}
      const cellWithSource1 = {
        ...cell,
        name: cellName1,
        queries: [queryWithSource1],
        i: cellID1,
      }
      const queryWithSource2 = {...query, source: sourceLink2}
      const cellWithSource2 = {
        ...cell,
        name: cellName2,
        queries: [queryWithSource2],
        i: cellID2,
      }
      const cellNoSource = {...cell, name: cellName3, i: cellID3}
      const cells = [cellWithSource1, cellWithSource2, cellNoSource]
      const importedSources = {
        1: {name: 'Source 1', link: sourceLink1},
        2: {name: 'Source 2', link: sourceLink2},
      }

      const expected = {
        1: [{id: cellID1, name: cellName1}],
        2: [{id: cellID2, name: cellName2}],
        [DYNAMIC_SOURCE]: [{id: cellID3, name: cellName3}],
      }

      const {sourcesCells} = createSourceMappings(
        source,
        cells,
        importedSources
      )
      expect(sourcesCells).toEqual(expected)
    })

    it('maps imported sources to the current source by default', () => {
      const currentSource = {...source, id: 10, name: 'MY SOURCE'}
      const sourceLink1 = '/chronograf/v1/sources/1'
      const sourceLink2 = '/chronograf/v1/sources/2'
      const cellName1 = 'Cell 1'
      const cellName2 = 'Cell 2'
      const cellID1 = '1'
      const cellID2 = '2'
      const queryWithSource1 = {...query, source: sourceLink1}
      const cellWithSource1 = {
        ...cell,
        name: cellName1,
        queries: [queryWithSource1],
        i: cellID1,
      }
      const queryWithSource2 = {...query, source: sourceLink2}
      const cellWithSource2 = {
        ...cell,
        name: cellName2,
        queries: [queryWithSource2],
        i: cellID2,
      }
      const cells = [cellWithSource1, cellWithSource2]
      const importedSources = {
        1: {name: 'Source 1', link: sourceLink1},
        2: {name: 'Source 2', link: sourceLink2},
      }
      const sourceInfo = {
        name: currentSource.name,
        id: currentSource.id,
        link: currentSource.links.self,
      }
      const expected = {
        1: sourceInfo,
        2: sourceInfo,
      }

      const {sourceMappings} = createSourceMappings(
        currentSource,
        cells,
        importedSources
      )
      expect(sourceMappings).toEqual(expected)
    })

    it('maps Dynamic source to the dynamic source option by default', () => {
      const currentSource = {...source, id: 10, name: 'MY SOURCE'}
      const sourceLink1 = ''
      const sourceLink2 = ''
      const cellName1 = 'Cell 1'
      const cellName2 = 'Cell 2'
      const cellID1 = '1'
      const cellID2 = '2'
      const queryWithSource1 = {...query, source: sourceLink1}
      const cellWithSource1 = {
        ...cell,
        name: cellName1,
        queries: [queryWithSource1],
        i: cellID1,
      }
      const queryWithSource2 = {...query, source: sourceLink2}
      const cellWithSource2 = {
        ...cell,
        name: cellName2,
        queries: [queryWithSource2],
        i: cellID2,
      }
      const cells = [cellWithSource1, cellWithSource2]
      const importedSources = {}

      const expected = {
        [DYNAMIC_SOURCE]: DYNAMIC_SOURCE_INFO,
      }

      const {sourceMappings} = createSourceMappings(
        currentSource,
        cells,
        importedSources
      )
      expect(sourceMappings).toEqual(expected)
    })
    it('maps also imported variables', () => {
      const currentSource = {...source, id: 11, name: 'MY SOURCE'}
      const sourceLink1 = '/chronograf/v1/sources/1'
      const cellName1 = 'Cell 1'
      const cellID1 = '1'
      const queryWithSource1 = {...query, source: sourceLink1}
      const cellWithSource1 = {
        ...cell,
        name: cellName1,
        queries: [queryWithSource1],
        i: cellID1,
      }
      const cells = [cellWithSource1]
      const importedSources = {
        1: {name: 'Source 1', link: sourceLink1},
      }
      const sourceInfo = {
        name: currentSource.name,
        id: currentSource.id,
        link: currentSource.links.self,
      }
      const variables: Template[] = [
        {
          ...template,
          sourceID: undefined,
        },
        {
          ...template,
          id: 'var2',
          sourceID: '2',
        },
      ]

      const expectedMapping = {
        1: sourceInfo,
        2: sourceInfo,
      }

      const {sourcesCells, sourceMappings} = createSourceMappings(
        currentSource,
        cells,
        importedSources,
        variables
      )
      expect(sourceMappings).toEqual(expectedMapping)
      expect(sourcesCells[2]).toEqual([])
    })
  })

  describe('mapQueriesInCell', () => {
    it('returns cell with source from sourceMappings', () => {
      const sourceLink1 = '/chronograf/v1/sources/1'
      const sourceID = '1'
      const sourceMappings = {
        [sourceID]: DYNAMIC_SOURCE_INFO,
      }
      const queryWithSource1 = {...query, source: sourceLink1}
      const cellWithSource1 = {
        ...cell,
        queries: [queryWithSource1],
      }

      // cell has no source
      const expected = cell
      const actual = mapQueriesInCell(sourceMappings, cellWithSource1, sourceID)
      expect(actual).toEqual(expected)
    })
  })

  describe('getSourceIDFromLink', () => {
    it('returns the id after sources in a link', () => {
      const sourceLink = '/chronograf/v1/sources/10'
      const expected = '10'
      const actual = getSourceIDFromLink(sourceLink)
      expect(actual).toBe(expected)
    })
  })

  describe('getSourceInfo', () => {
    it('returns source info from a source', () => {
      const name = 'name'
      const id = 'id'
      const link = '/chronograf/v1/sources/10'

      const links = {...source.links, self: link}
      const s = {...source, name, links, id}

      const expected = {name, id, link}

      const actual = getSourceInfo(s)

      expect(actual).toEqual(expected)
    })
  })
})
