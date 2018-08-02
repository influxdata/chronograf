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

const REGEX_SOURCE_ID = /sources\/(\d+)/g

export const createSourceMappings = (
  source,
  cells,
  importedSources
): {sourcesCells: SourcesCells; sourceMappings: SourceMappings} => {
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
): Cell[] => {
  const mappedCells = cells.map(c => {
    const query = getDeep<CellQuery>(c, 'queries.0', null)
    if (_.isEmpty(query)) {
      return c
    }

    const sourceLink = getDeep<string>(query, 'source', '')
    if (!sourceLink) {
      return mapQueriesInCell(sourceMappings, c, DYNAMIC_SOURCE)
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
      return mapQueriesInCell(sourceMappings, c, importedSourceID)
    }

    return c
  })

  return mappedCells
}

export const mapQueriesInCell = (
  sourceMappings: SourceMappings,
  cell: Cell,
  sourceID: string
): Cell => {
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

export const getSourceIDFromLink = (sourceLink: string): string => {
  // first capture group
  const matcher = new RegExp(REGEX_SOURCE_ID)
  const sourceLinkSID = matcher.exec(sourceLink)[1]
  return sourceLinkSID
}
