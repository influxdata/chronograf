import {flatten} from 'lodash'

import {NEW_DEFAULT_DASHBOARD_CELL} from 'src/dashboards/constants'

import {Source, Cell} from 'src/types'
import {Layout, LayoutCell, LayoutQuery} from 'src/types/hosts'
import {CellType, CellQuery} from 'src/types/dashboards'

const CELL_WIDTH = 4
const CELL_HEIGHT = 4
const PAGE_WIDTH = 12

export function getCells(layouts: Layout[], source: Source): Cell[] {
  const layoutCells = getLayoutCells(layouts)
  const cells = layoutCells.map(d => toCell(d, source))

  return cells
}

function getLayoutCells(layouts: Layout[]): LayoutCell[] {
  if (layouts.length === 0) {
    return []
  }

  const autoflowLayouts = layouts.filter(l => !!l.autoflow)
  const autoflowCells = flatten(autoflowLayouts.map(l => l.cells))

  const staticLayouts = layouts.filter(layout => !layout.autoflow)
  const cellGroups = [
    autoPositionCells(autoflowCells),
    ...staticLayouts.map(layout => layout.cells),
  ]

  const cells = translateCellGroups(cellGroups)

  return cells
}

function autoPositionCells(cells: LayoutCell[]): LayoutCell[] {
  return cells.reduce((acc, cell, i) => {
    const x = (i * CELL_WIDTH) % PAGE_WIDTH
    const y = Math.floor(i * CELL_WIDTH / PAGE_WIDTH) * CELL_HEIGHT
    const newCell = {...cell, w: CELL_WIDTH, h: CELL_HEIGHT, x, y}

    return [...acc, newCell]
  }, [])
}

function translateCellGroups(groups: LayoutCell[][]): LayoutCell[] {
  const cells = []

  let translateY = 0

  for (const group of groups) {
    let maxY = 0

    for (const cell of group) {
      cell.y += translateY

      if (cell.y > translateY) {
        maxY = cell.y
      }

      cells.push(cell)
    }

    translateY = maxY
  }

  return cells
}

function toCell(layoutCell: LayoutCell, source: Source): Cell {
  const queries = layoutCell.queries.map(d => toCellQuery(d, source))

  const cell = {
    ...NEW_DEFAULT_DASHBOARD_CELL,
    ...layoutCell,
    queries,
    links: {},
    legend: {},
    type: CellType.Line,
    colors: [],
  }

  return cell
}

function toCellQuery(layoutQuery: LayoutQuery, source: Source): CellQuery {
  const cellQuery = {
    query: layoutQuery.query,
    source: source.url,
    type: 'influxql',
  }

  return cellQuery as CellQuery
}
