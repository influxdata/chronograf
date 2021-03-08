import uuid from 'uuid'

import {getNextAvailablePosition} from 'src/dashboards/utils/cellGetters'

import {
  PBCell,
  Protoboard,
  Dashboard,
  Template,
  Source,
  CellQuery,
  Cell,
} from 'src/types'

const addNewCellToCells = (
  cells: Array<Partial<PBCell>>,
  cell: Partial<PBCell>
): Array<Partial<PBCell>> => {
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

const createTemplatesForProtoboard = (pbTemplates, source): Template[] => {
  const telegraf = source.telegraf || 'telegraf'
  return pbTemplates.map((pbt) => {
    return {...pbt, id: uuid.v4(), query: {...pbt.query, db: telegraf}}
  })
}

const replaceQuery = (q: string, source: Source) =>
  q
    .replace(':db:', source.telegraf || 'telegraf')
    .replace(':rp:', source.defaultRP || 'autogen')

const replaceDbRp = (queries: CellQuery[], source: Source) =>
  queries.map((q) => ({...q, query: replaceQuery(q.query, source)}))

export const instantiateProtoboard = (
  protoboard: Protoboard,
  source: Source
): Partial<Dashboard> => {
  let cellsWithPlaces = protoboard.data.cells

  const isCellsUnplaced = protoboard.data.cells.every(
    (c) => c.x === 0 && c.y === 0
  )

  if (isCellsUnplaced) {
    cellsWithPlaces = protoboard.data.cells.reduce(addNewCellToCells, [])
  }

  const pbTemplates = protoboard.data.templates
  const templates = createTemplatesForProtoboard(pbTemplates, source)

  const cells = cellsWithPlaces.map((c) => ({
    ...c,
    queries: replaceDbRp(c.queries, source),
  })) as Cell[]

  const dashboard: Partial<Dashboard> = {
    name: protoboard.meta.name,
    cells,
    templates,
  }

  return dashboard
}
