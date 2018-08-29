// APIs
import {getQueryConfigAndStatus} from 'src/shared/apis'

// Utils
import replaceTemplate, {replaceInterval} from 'src/tempVars/utils/replace'
import {getDeep} from 'src/utils/wrappers'

// Constants
import {
  UNTITLED_GRAPH,
  NEW_DEFAULT_DASHBOARD_CELL,
} from 'src/dashboards/constants'
import {
  TEMP_VAR_DASHBOARD_TIME,
  DEFAULT_DURATION_MS,
  DEFAULT_PIXELS,
} from 'src/shared/constants'

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

const numColumns = 12

export const getNextAvailablePosition = (cells, newCell) => {
  const farthestY = cells.map(cell => cell.y).reduce((a, b) => (a > b ? a : b))

  const bottomCells = cells.filter(cell => cell.y === farthestY)
  const farthestX = bottomCells
    .map(cell => cell.x)
    .reduce((a, b) => (a > b ? a : b))
  const lastCell = bottomCells.find(cell => cell.x === farthestX)

  const availableSpace = numColumns - (lastCell.x + lastCell.w)
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

  const existingCellWidths = dashboard.cells.map(cell => cell.w)
  const existingCellHeights = dashboard.cells.map(cell => cell.h)

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

export const getClonedDashboardCell = (
  dashboard: Dashboard,
  cloneCell: Cell
): Cell => {
  const {x, y} = getNextAvailablePosition(dashboard, cloneCell)

  const name = `${cloneCell.name} (clone)`

  return {...cloneCell, x, y, name}
}

export const getTimeRange = (queryConfig: QueryConfig): DurationRange => {
  return (
    queryConfig.range || {
      upper: null,
      lower: TEMP_VAR_DASHBOARD_TIME,
    }
  )
}

export const getConfig = async (
  url,
  id: string,
  query: string,
  templates: Template[]
): Promise<QueryConfig> => {
  // replace all templates but :interval:
  query = replaceTemplate(query, templates)
  let queries = []
  let durationMs = DEFAULT_DURATION_MS

  try {
    // get durationMs to calculate interval
    queries = await getQueryConfigAndStatus(url, [{query, id}])
    durationMs = getDeep<number>(queries, '0.durationMs', DEFAULT_DURATION_MS)
    // calc and replace :interval:
    query = replaceInterval(query, DEFAULT_PIXELS, durationMs)
  } catch (error) {
    console.error(error)
    throw error
  }

  try {
    // fetch queryConfig for with all template variables replaced
    queries = await getQueryConfigAndStatus(url, [{query, id}])
  } catch (error) {
    console.error(error)
    throw error
  }

  const {queryConfig} = queries.find(q => q.id === id)

  return queryConfig
}
