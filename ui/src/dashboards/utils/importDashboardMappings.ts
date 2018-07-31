// Libraries
import _ from 'lodash'

// Utils
import {getDeep} from 'src/utils/wrappers'

// Constants
import {DYNAMIC_SOURCE, DYNAMIC_SOURCE_INFO} from 'src/dashboards/constants'

// Types
import {CellQuery, Cell, Source} from 'src/types'
import {
  CellInfo,
  SourceInfo,
  SourcesCells,
  SourceMappings,
  ImportedSources,
} from 'src/types/dashboards'

export const createSourceMappings = (source, cells, importedSources) => {
  let sourcesCells: SourcesCells = {}
  const sourceMappings: SourceMappings = {}
  const sourceInfo: SourceInfo = getSourceInfo(source)
  const cellsWithNoSource: CellInfo[] = []

  sourcesCells = _.reduce(
    cells,
    (acc, c) => {
      const cellInfo: CellInfo = {id: c.i, name: c.name}
      const query = getDeep<CellQuery>(c, 'queries.0', null)
      if (_.isEmpty(query)) {
        return acc
      }

      const sourceLink = getDeep<string>(query, 'source', '')
      if (!sourceLink) {
        cellsWithNoSource.push(cellInfo)
        return acc
      }

      let importedSourceID = _.findKey(
        importedSources,
        is => is.link === sourceLink
      )
      if (!importedSourceID) {
        const sourceLinkSID = getSourceIDFromLink(sourceLink)
        if (!sourceLinkSID) {
          return acc
        }
        importedSourceID = sourceLinkSID
      }

      if (acc[importedSourceID]) {
        acc[importedSourceID].push(cellInfo)
      } else {
        acc[importedSourceID] = [cellInfo]
      }
      sourceMappings[importedSourceID] = sourceInfo
      return acc
    },
    sourcesCells
  )

  if (cellsWithNoSource.length) {
    sourcesCells[DYNAMIC_SOURCE] = cellsWithNoSource
    sourceMappings[DYNAMIC_SOURCE] = DYNAMIC_SOURCE_INFO
  }

  return {sourcesCells, sourceMappings}
}

export const mapCells = (
  cells: Cell[],
  sourceMappings: SourceMappings,
  importedSources: ImportedSources
) => {
  const mappedCells = cells.map(c => {
    const query = getDeep<CellQuery>(c, 'queries.0', null)
    if (_.isEmpty(query)) {
      return c
    }

    const sourceLink = getDeep<string>(query, 'source', '')
    if (!sourceLink) {
      return mapQueriesInCells(sourceMappings, c, DYNAMIC_SOURCE)
    }

    let importedSourceID = _.findKey(
      importedSources,
      is => is.link === sourceLink
    )
    if (!importedSourceID) {
      const sourceLinkSID = getSourceIDFromLink(sourceLink)
      if (!sourceLinkSID) {
        return c
      }
      importedSourceID = sourceLinkSID
    }
    if (importedSourceID) {
      return mapQueriesInCells(sourceMappings, c, importedSourceID)
    }

    return c
  })

  return mappedCells
}

export const mapQueriesInCells = (sourceMappings, cell, sourceID) => {
  const mappedSourceLink = sourceMappings[sourceID].link
  let queries = getDeep<CellQuery[]>(cell, 'queries', [])
  if (queries.length) {
    queries = queries.map(q => {
      return {...q, source: mappedSourceLink}
    })
  }
  return {...cell, queries}
}

export const getSourceInfo = (source: Source): SourceInfo => {
  return {
    name: source.name,
    id: source.id,
    link: source.links.self,
  }
}

export const getSourceIDFromLink = (sourceLink: string) => {
  const sourceIDRegex = /sources\/(\d+)/g
  // first capture group
  const sourceLinkSID = sourceIDRegex.exec(sourceLink)[1]
  return sourceLinkSID
}
