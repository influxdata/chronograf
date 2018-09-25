// Libraries
import uuid from 'uuid'
import {get} from 'lodash'

// Utils
import defaultQueryConfig from 'src/utils/defaultQueryConfig'
import {getLineColors} from 'src/shared/constants/graphColorPalettes'
import {
  getThresholdsListColors,
  getGaugeColors,
} from 'src/shared/constants/thresholds'

// Types
import {Cell, NewDefaultCell, CellQuery, QueryType} from 'src/types'
import {TimeMachineState} from 'src/shared/utils/TimeMachineContainer'

export function intialStateFromCell(
  cell: Cell | NewDefaultCell
): Partial<TimeMachineState> {
  const initialState: Partial<TimeMachineState> = {
    queryDrafts: initialQueryDrafts(cell),
    type: cell.type,
    fieldOptions: cell.fieldOptions,
    timeFormat: cell.timeFormat,
    decimalPlaces: cell.decimalPlaces,
    note: cell.note,
    noteVisibility: cell.noteVisibility,
  }

  if (get(cell, 'queries.0.type') === QueryType.Flux) {
    initialState.script = get(cell, 'queries.0.query', '')
  }

  if (cell.tableOptions) {
    initialState.tableOptions = cell.tableOptions
  }

  const axes = (cell as Cell).axes
  const colors = (cell as Cell).colors

  if (axes) {
    initialState.axes = axes
  }

  if (colors) {
    initialState.gaugeColors = getGaugeColors(colors)
    initialState.thresholdsListColors = getThresholdsListColors(colors)
    initialState.lineColors = getLineColors(colors)
  }

  return initialState
}

function initialQueryDrafts(cell: Cell | NewDefaultCell): CellQuery[] {
  const queries: CellQuery[] = get(cell, 'queries', [])

  if (!cell.queries.length) {
    return [defaultQueryDraft(QueryType.InfluxQL)]
  }

  if (cell.queries[0].type === QueryType.Flux) {
    return [defaultQueryDraft(QueryType.Flux, cell.queries[0].source)]
  }

  return queries.map(q => {
    const id = uuid.v4()
    const queryConfig = {...q.queryConfig, id}

    return {...q, queryConfig, id}
  })
}

export function defaultQueryDraft(
  type: QueryType,
  source: string = ''
): CellQuery {
  const id = uuid.v4()
  const defaultDraft: CellQuery = {
    id,
    type,
    source,
    query: '',
    queryConfig: defaultQueryConfig({id}),
  }

  return defaultDraft
}
