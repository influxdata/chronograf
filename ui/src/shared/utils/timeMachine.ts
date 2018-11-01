// Libraries
import uuid from 'uuid'
import {get} from 'lodash'

// Utils
import defaultQueryConfig from 'src/utils/defaultQueryConfig'
import {getDeep} from 'src/utils/wrappers'
import {getLineColors} from 'src/shared/constants/graphColorPalettes'
import {
  getThresholdsListColors,
  getGaugeColors,
} from 'src/shared/constants/thresholds'
import {GIT_SHA} from 'src/shared/constants'
import {getTimeRange} from 'src/dashboards/utils/cellGetters'

// Types
import {Cell, NewDefaultCell, CellQuery, QueryType} from 'src/types'
import {TimeMachineState} from 'src/shared/utils/TimeMachineContainer'

export function initialStateFromCell(
  cell: Cell | NewDefaultCell
): Partial<TimeMachineState> {
  const queryDrafts = initialQueryDrafts(cell)
  const queryType = getDeep<QueryType>(
    cell,
    'queries.0.type',
    QueryType.InfluxQL
  )

  const initialState: Partial<TimeMachineState> = {
    queryDrafts,
    type: cell.type,
    queryType,
    fieldOptions: cell.fieldOptions,
    timeFormat: cell.timeFormat,
    decimalPlaces: cell.decimalPlaces,
    note: cell.note,
    noteVisibility: cell.noteVisibility,
  }

  if (get(cell, 'queries.0.type') === QueryType.Flux) {
    initialState.script = get(cell, 'queries.0.query', '')
    initialState.draftScript = get(cell, 'queries.0.query', '')
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
    return [defaultQueryDraft(QueryType.InfluxQL, cell.queries[0].source)]
  }

  return queries.map(q => {
    const id = uuid.v4()
    const queryConfig = {
      ...q.queryConfig,
      range: getTimeRange(q.queryConfig),
      id,
    }

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

export enum TMLocalStorageKey {
  DataExplorer = 'dataExplorer',
  CellEditorOverlay = 'cellEditorOverlay',
}

export function getLocalStorageKey(): TMLocalStorageKey {
  const location = window.location.toString()

  if (location.indexOf('/dashboards/') !== -1) {
    return TMLocalStorageKey.CellEditorOverlay
  }

  return TMLocalStorageKey.DataExplorer
}

export function getLocalStorage(
  key: TMLocalStorageKey
): Partial<TimeMachineState> {
  try {
    const {version, data} = JSON.parse(window.localStorage.getItem(key))

    if (version !== GIT_SHA) {
      return {}
    }

    if (key === TMLocalStorageKey.CellEditorOverlay) {
      const {fluxProportions, timeMachineProportions} = data

      return {fluxProportions, timeMachineProportions}
    }

    return data
  } catch {
    return {}
  }
}

export function setLocalStorage(
  key: TMLocalStorageKey,
  data: TimeMachineState
): void {
  const localStorageData = {version: GIT_SHA, data}

  window.localStorage.setItem(key, JSON.stringify(localStorageData))
}
