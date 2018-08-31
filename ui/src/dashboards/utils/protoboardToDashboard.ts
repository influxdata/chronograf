import _ from 'lodash'

import {getNextAvailablePosition} from 'src/dashboards/utils/cellGetters'

import {
  PBCell,
  Protoboard,
  Dashboard,
  Template,
  Source,
  TemplateType,
} from 'src/types'

interface PBQueries {
  query: string
  groupbys: string[]
  label: string
}

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

const isThereCollision = (
  cell: Partial<PBCell>,
  placedCells: Array<Partial<PBCell>>
): boolean => {
  return !!placedCells.find(c => cell.x === c.x && cell.y === c.y)
}

const createTemplatesForProtoboard = (source, measurement): Template[] => [
  {
    tempVar: ':host:',
    id: '',
    type: TemplateType.TagValues,
    label: '',
    values: [],
    query: {
      influxql:
        'SHOW TAG VALUES ON :database: FROM :measurement: WITH KEY=:tagKey:',
      db: source.telegraf || 'telegraf',
      measurement,
      tagKey: 'host',
      fieldKey: '',
    },
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
  const measurement = protoboard.data.cells[0].measurement

  _.forEach(protoboard.data.cells, c => {
    if ((c.x === 0 && c.y === 0) || isThereCollision(c, placedCells)) {
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

  const templates = createTemplatesForProtoboard(source, measurement)

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
