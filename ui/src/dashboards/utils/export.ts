import _ from 'lodash'

import {Source, Dashboard, Service, Cell} from 'src/types'
import {CellQuery} from 'src/types/dashboards'
import {DashboardFile} from 'src/types/dashboards'

export const isFluxService = (link: string) => link.includes('service')

export const mapServicesForDownload = (originalServices: Service[]) =>
  _.reduce(
    originalServices,
    (acc, service) => {
      const {name, id, links, sourceID} = service
      const link = _.get(links, 'self', '')
      acc[id] = {name, link, sourceID}
      return acc
    },
    {}
  )

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

export const matchSourceLink = (cellQuery: CellQuery) => {
  if (!isFluxService(cellQuery.source)) {
    return cellQuery.source
  }

  return null
}

export const matchServiceLink = (cellQuery: CellQuery) => {
  if (isFluxService(cellQuery.source)) {
    return cellQuery.source
  }

  return null
}

export const mapQueriesToSources = (queries: CellQuery[]) => {
  return queries.map(query => {
    return {
      ...query,
      source: matchSourceLink(query),
      service: matchServiceLink(query),
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
  originalServices: Service[],
  originalDashboard: Dashboard,
  chronografVersion: string
): DashboardFile => {
  const sources = mapSourcesForDownload(originalSources)
  const services = mapServicesForDownload(originalServices)
  const meta = {chronografVersion, sources, services}

  const dashboard = {
    ...originalDashboard,
    cells: mapCellsToSources(originalDashboard.cells),
  }

  return {meta, dashboard}
}
