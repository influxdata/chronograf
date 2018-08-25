import _ from 'lodash'

import {getNextAvailablePosition} from 'src/dashboards/utils/cellGetters'

import {Cell, Protoboard, Dashboard} from 'src/types'

const addNewCellToCells = (
  cells: Array<Partial<Cell>>,
  cell: Partial<Cell>
): Array<Partial<Cell>> => {
  let x = 0
  let y = 0

  if (cells.length !== 0) {
    const pos = getNextAvailablePosition(cells, cell)
    x = pos.x
    y = pos.y
  }

  return [
    ...cells,
    {
      ...cell,
      x,
      y,
    },
  ]
}

const collision = (
  cell: Partial<Cell>,
  placedCells: Array<Partial<Cell>>
): boolean => {
  return !!placedCells.find(c => cell.x === c.x && cell.y === c.y)
}

export const instantiate = (protoboard: Protoboard): Partial<Dashboard> => {
  const placedCells = []
  const unPlacedCells = []

  _.forEach(protoboard.data.cells, c => {
    if ((c.x === 0 && c.y === 0) || collision(c, placedCells)) {
      unPlacedCells.push(c)
      return
    }
    placedCells.push(c)
  })

  const cells = _.reduce(unPlacedCells, addNewCellToCells, placedCells)

  const dashboard = {
    name: protoboard.meta.name,
    cells,
  }
  return dashboard
}
