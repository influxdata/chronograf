import _ from 'lodash'

import {Source, Dashboard, Cell} from 'src/types'
import {CellQuery} from 'src/types/dashboards'
import {DashboardFile} from 'src/types/dashboards'

export const mapSourcesForDownload = (originalSources: Source[]) =>
  _.reduce(
    originalSources,
    (acc, source) => {
      const {name, id, links} = source
      const link = _.get(links, 'self', '')
      acc[id] = {name, link}
      return acc
    },
    {}
  )

export const mapQueriesToSources = (queries: CellQuery[]) => {
  return queries.map(query => {
    return {
      ...query,
      source: query.source,
    }
  })
}

export const mapCellsToSources = (cells: Cell[]) => {
  return cells.map(cell => {
    const {queries} = cell

    return {
      ...cell,
      queries: mapQueriesToSources(queries),
    }
  })
}

export const mapDashboardForDownload = (
  originalSources: Source[],
  originalDashboard: Dashboard,
  chronografVersion: string
): DashboardFile => {
  const sources = mapSourcesForDownload(originalSources)
  const meta = {chronografVersion, sources}

  const dashboard = {
    ...originalDashboard,
    cells: mapCellsToSources(originalDashboard.cells),
  }

  return {meta, dashboard}
}
