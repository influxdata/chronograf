import _ from 'lodash'

import {getNextAvailablePosition} from 'src/dashboards/utils/cellGetters'

import {
  Cell,
  Protoboard,
  Dashboard,
  Template,
  Source,
  TemplateValueType,
  TemplateType,
} from 'src/types'

interface PBQueries {
  query: string
  groupbys: string[]
  label: string
}

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

const createTemplatesForProtoboard = (): Template[] => [
  {
    tempVar: ':host:',
    id: 'host',
    type: TemplateType.TagValues,
    label: '',
    values: [
      {
        value: 'denizs-MacBook-Pro.local',
        type: TemplateValueType.TagValue,
        selected: true,
        localSelected: true,
      },
    ],
  },
]

const replaceQuery = (q: string, source: Source) =>
  q
    .replace(':db:', source.telegraf || 'telegraf')
    .replace(':rp:', source.defaultRP || 'autogen')

const replaceDbRp = (queries: PBQueries[], source: Source) =>
  queries.map(q => ({...q, query: replaceQuery(q.query, source)}))

export const instantiate = (
  protoboard: Protoboard,
  source: Source
): Partial<Dashboard> => {
  const placedCells = []
  const unPlacedCells = []

  _.forEach(protoboard.data.cells, c => {
    if ((c.x === 0 && c.y === 0) || collision(c, placedCells)) {
      unPlacedCells.push(c)
      return
    }
    placedCells.push(c)
  })

  const cellsWithPlaces = _.reduce(
    unPlacedCells,
    addNewCellToCells,
    placedCells
  )

  const templates = createTemplatesForProtoboard(source)

  const cells = cellsWithPlaces.map(c => ({
    ...c,
    queries: replaceDbRp(c.queries, source),
  }))

  const dashboard = {
    name: protoboard.meta.name,
    cells,
    templates,
  }

  return dashboard
}
