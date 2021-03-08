// APIs
import {getQueryConfigAndStatus} from 'src/shared/apis'

// Utils
import templateReplace from 'src/tempVars/utils/replace'

// Constants
import {
  UNTITLED_GRAPH,
  NEW_DEFAULT_DASHBOARD_CELL,
} from 'src/dashboards/constants'
import {TEMPLATE_RANGE} from 'src/tempVars/constants'

const MAX_COLUMNS = 12

// Types
import {Cell, CellType, Dashboard, NewDefaultCell} from 'src/types/dashboards'
import {QueryConfig, DurationRange} from 'src/types/queries'
import {Template} from 'src/types'

const getMostCommonValue = (values: number[]): number => {
  const results = values.reduce(
    (acc, value) => {
      const {distribution, mostCommonCount} = acc
      distribution[value] = (distribution[value] || 0) + 1
      if (distribution[value] > mostCommonCount) {
        return {
          distribution,
          mostCommonCount: distribution[value],
          mostCommonValue: value,
        }
      }
      return acc
    },
    {distribution: {}, mostCommonCount: 0, mostCommonValue: null}
  )

  return results.mostCommonValue
}

export const isCellUntitled = (cellName: string): boolean => {
  return cellName === UNTITLED_GRAPH
}

export const getNextAvailablePosition = (cells, newCell) => {
  const farthestY = cells
    .map((cell) => cell.y)
    .reduce((a, b) => (a > b ? a : b))

  const bottomCells = cells.filter((cell) => cell.y === farthestY)
  const farthestX = bottomCells
    .map((cell) => cell.x)
    .reduce((a, b) => (a > b ? a : b))
  const lastCell = bottomCells.find((cell) => cell.x === farthestX)

  const availableSpace = MAX_COLUMNS - (lastCell.x + lastCell.w)
  const newCellFits = availableSpace >= newCell.w

  return newCellFits
    ? {
        x: lastCell.x + lastCell.w,
        y: farthestY,
      }
    : {
        x: 0,
        y: lastCell.y + lastCell.h,
      }
}

export const getNewDashboardCell = (
  dashboard: Dashboard,
  cellType: CellType = CellType.Line
): NewDefaultCell => {
  const typedCell = {
    ...NEW_DEFAULT_DASHBOARD_CELL,
    type: cellType,
    name: UNTITLED_GRAPH,
  }

  if (dashboard.cells.length === 0) {
    return typedCell
  }

  const existingCellWidths = dashboard.cells.map((cell) => cell.w)
  const existingCellHeights = dashboard.cells.map((cell) => cell.h)

  const mostCommonCellWidth = getMostCommonValue(existingCellWidths)
  const mostCommonCellHeight = getMostCommonValue(existingCellHeights)

  const newCell = {
    ...typedCell,
    w: mostCommonCellWidth,
    h: mostCommonCellHeight,
  }

  const {x, y} = getNextAvailablePosition(dashboard.cells, newCell)

  return {
    ...newCell,
    x,
    y,
  }
}

const incrementCloneName = (cellNames: string[], cellName: string): string => {
  const rootName = cellName.replace(/\s\(clone\s(\d)+\)/g, '').replace(/\)/, '')

  const filteredNames = cellNames.filter((cn) => cn.includes(rootName))

  const highestNumberedClone = filteredNames.reduce((acc, name) => {
    if (name.match(/\(clone(\s|\d)+\)/)) {
      const strippedName = name
        .replace(rootName, '')
        .replace(/\(clone/, '')
        .replace(/\)/, '')

      const cloneNumber = Number(strippedName)

      return cloneNumber >= acc ? cloneNumber : acc
    }

    return acc
  }, 0)

  if (highestNumberedClone) {
    const newCloneNumber = highestNumberedClone + 1
    return `${cellName.replace(
      /\(clone\s(\d)+\)/,
      ''
    )} (clone ${newCloneNumber})`
  }

  return `${cellName} (clone 1)`
}

export const getClonedDashboardCell = (
  dashboard: Dashboard,
  cellClone: Cell
): Cell => {
  const cellNames = dashboard.cells.map((c) => c.name)
  const name = incrementCloneName(cellNames, cellClone.name)

  const cellCloneFitsLeft = cellClone.x >= cellClone.w
  const cellCloneFitsRight =
    MAX_COLUMNS - (cellClone.w + cellClone.x) >= cellClone.w

  if (cellCloneFitsRight) {
    return {...cellClone, x: cellClone.x + cellClone.w, name}
  }

  if (cellCloneFitsLeft) {
    return {...cellClone, x: cellClone.x - cellClone.w, name}
  }

  return {...cellClone, y: cellClone.y + cellClone.h, name}
}

export const getTimeRange = (queryConfig: QueryConfig): DurationRange => {
  return getRangeForOriginalQuery(queryConfig.originalQuery, queryConfig.range)
}

const getRangeForOriginalQuery = (
  originalQuery: string,
  range: DurationRange
): DurationRange => {
  const isUsingDashTime =
    range && originalQuery && originalQuery.indexOf(TEMPLATE_RANGE.lower) !== -1

  if (isUsingDashTime || !range) {
    return TEMPLATE_RANGE
  }

  return range
}

export const getConfig = async (
  url,
  id: string,
  query: string,
  templates: Template[]
): Promise<QueryConfig> => {
  const renderedQuery = templateReplace(query, templates)
  const queries = await getQueryConfigAndStatus(url, [
    {query: renderedQuery, id},
  ])
  const {queryConfig} = queries.find((q) => q.id === id)
  const range = getRangeForOriginalQuery(query, queryConfig.range)

  return {
    ...queryConfig,
    originalQuery: query,
    range,
  }
}
