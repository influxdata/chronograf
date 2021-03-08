import _ from 'lodash'

import {
  ActionTypes,
  Action,
  RemoveFilterAction,
  AddFilterAction,
  ChangeFilterAction,
  DecrementQueryCountAction,
  IncrementQueryCountAction,
  ConcatMoreLogsAction,
  PrependMoreLogsAction,
  SetConfigAction,
} from 'src/logs/actions'

import {
  SeverityFormatOptions,
  DEFAULT_TRUNCATION,
  DEFAULT_TAIL_CHUNK_DURATION_MS,
  DEFAULT_OLDER_CHUNK_DURATION_MS,
  DEFAULT_NEWER_CHUNK_DURATION_MS,
  defaultTableData,
} from 'src/logs/constants'
import {LogsState, SearchStatus} from 'src/types/logs'

export const defaultState: LogsState = {
  currentSource: null,
  currentNamespaces: [],
  timeRange: {
    upper: null,
    lower: 'now() - 1m',
    seconds: 60,
    windowOption: '1m',
    timeOption: 'now',
  },
  tableInfiniteData: {
    forward: defaultTableData,
    backward: defaultTableData,
  },
  currentNamespace: null,
  histogramQueryConfig: null,
  tableQueryConfig: null,
  tableData: {columns: [], values: []},
  histogramData: [],
  filters: [],
  queryCount: 0,
  logConfig: {
    tableColumns: [],
    severityFormat: SeverityFormatOptions.dotText,
    severityLevelColors: [],
    isTruncated: DEFAULT_TRUNCATION,
  },
  tableTime: {
    custom: '',
    relative: 0,
  },
  searchStatus: SearchStatus.None,
  nextOlderUpperBound: undefined,
  nextOlderLowerBound: undefined,
  nextNewerUpperBound: undefined,
  nextNewerLowerBound: undefined,
  currentTailUpperBound: undefined,
  nextTailLowerBound: undefined,
  tailChunkDurationMs: DEFAULT_TAIL_CHUNK_DURATION_MS,
  olderChunkDurationMs: DEFAULT_OLDER_CHUNK_DURATION_MS,
  newerChunkDurationMs: DEFAULT_NEWER_CHUNK_DURATION_MS,
  newRowsAdded: 0,
}

const clearTableData = (state: LogsState) => {
  return {
    ...state,
    tableInfiniteData: {
      forward: defaultTableData,
      backward: defaultTableData,
    },
  }
}

const removeFilter = (
  state: LogsState,
  action: RemoveFilterAction
): LogsState => {
  const {id} = action.payload
  const filters = _.filter(
    _.get(state, 'filters', []),
    (filter) => filter.id !== id
  )

  return {...state, filters}
}

const addFilter = (state: LogsState, action: AddFilterAction): LogsState => {
  const {filter} = action.payload

  return {...state, filters: [filter, ..._.get(state, 'filters', [])]}
}

const clearFilters = (state: LogsState): LogsState => {
  return {...state, filters: []}
}

const changeFilter = (
  state: LogsState,
  action: ChangeFilterAction
): LogsState => {
  const {id, operator, value} = action.payload

  const mappedFilters = _.map(_.get(state, 'filters', []), (f) => {
    if (f.id === id) {
      return {...f, operator, value}
    }
    return f
  })

  return {...state, filters: mappedFilters}
}

const decrementQueryCount = (
  state: LogsState,
  __: DecrementQueryCountAction
) => {
  const {queryCount} = state
  return {...state, queryCount: Math.max(queryCount - 1, 0)}
}

const incrementQueryCount = (
  state: LogsState,
  __: IncrementQueryCountAction
) => {
  const {queryCount} = state
  return {...state, queryCount: queryCount + 1}
}

const concatMoreLogs = (
  state: LogsState,
  action: ConcatMoreLogsAction
): LogsState => {
  const {
    series: {columns, values},
  } = action.payload
  const {tableInfiniteData} = state
  const {backward} = tableInfiniteData
  const vals = [...backward.values, ...values]

  return {
    ...state,
    tableInfiniteData: {
      ...tableInfiniteData,
      backward: {
        columns,
        values: vals,
      },
    },
  }
}

const prependMoreLogs = (
  state: LogsState,
  action: PrependMoreLogsAction
): LogsState => {
  const {
    series: {columns, values},
  } = action.payload
  const {tableInfiniteData} = state
  const {forward} = tableInfiniteData
  const vals = [...values, ...forward.values]

  const newRowsAdded = vals.length - forward.values.length

  return {
    ...state,
    newRowsAdded,
    tableInfiniteData: {
      ...tableInfiniteData,
      forward: {
        columns,
        values: vals,
      },
    },
  }
}

export const setConfigs = (state: LogsState, action: SetConfigAction) => {
  const {logConfig} = state
  const {
    logConfig: {tableColumns, severityFormat, severityLevelColors, isTruncated},
  } = action.payload
  const updatedLogConfig = {
    ...logConfig,
    tableColumns,
    severityFormat,
    severityLevelColors,
    isTruncated,
  }
  return {...state, logConfig: updatedLogConfig}
}

export default (state: LogsState = defaultState, action: Action) => {
  switch (action.type) {
    case ActionTypes.SetSource:
      return {...state, currentSource: action.payload.source}
    case ActionTypes.SetNamespaces:
      return {...state, currentNamespaces: action.payload.namespaces}
    case ActionTypes.SetTimeBounds:
      const {upper, lower} = action.payload.timeBounds
      return {...state, timeRange: {...state.timeRange, upper, lower}}
    case ActionTypes.SetTimeWindow:
      const {windowOption, seconds} = action.payload.timeWindow
      return {...state, timeRange: {...state.timeRange, windowOption, seconds}}
    case ActionTypes.SetTimeMarker:
      const {timeOption} = action.payload.timeMarker
      return {...state, timeRange: {...state.timeRange, timeOption}}
    case ActionTypes.SetNamespace:
      return {...state, currentNamespace: action.payload.namespace}
    case ActionTypes.SetHistogramQueryConfig:
      return {...state, histogramQueryConfig: action.payload.queryConfig}
    case ActionTypes.SetHistogramData:
      return {...state, histogramData: action.payload.data}
    case ActionTypes.SetTableQueryConfig:
      return {...state, tableQueryConfig: action.payload.queryConfig}
    case ActionTypes.SetTableData:
      return {...state, tableData: action.payload.data}
    case ActionTypes.ClearRowsAdded:
      return {...state, newRowsAdded: null}
    case ActionTypes.SetSearchStatus:
      return {...state, searchStatus: action.payload.searchStatus}
    case ActionTypes.SetTableForwardData:
      return {
        ...state,
        tableInfiniteData: {
          ...state.tableInfiniteData,
          forward: action.payload.data,
        },
      }
    case ActionTypes.SetTableBackwardData:
      return {
        ...state,
        tableInfiniteData: {
          ...state.tableInfiniteData,
          backward: action.payload.data,
        },
      }
    case ActionTypes.SetTableCustomTime:
      return {...state, tableTime: {custom: action.payload.time}}
    case ActionTypes.SetTableRelativeTime:
      return {...state, tableTime: {relative: action.payload.time}}
    case ActionTypes.SetNextOlderUpperBound:
      return {...state, nextOlderUpperBound: action.payload.upper}
    case ActionTypes.SetNextOlderLowerBound:
      return {...state, nextOlderLowerBound: action.payload.lower}
    case ActionTypes.SetNextNewerUpperBound:
      return {...state, nextNewerUpperBound: action.payload.upper}
    case ActionTypes.SetNextNewerLowerBound:
      return {...state, nextNewerLowerBound: action.payload.lower}
    case ActionTypes.SetCurrentTailUpperBound:
      return {...state, currentTailUpperBound: action.payload.upper}
    case ActionTypes.SetNextTailLowerBound:
      return {...state, nextTailLowerBound: action.payload.lower}
    case ActionTypes.AddFilter:
      return addFilter(state, action)
    case ActionTypes.RemoveFilter:
      return removeFilter(state, action)
    case ActionTypes.ChangeFilter:
      return changeFilter(state, action)
    case ActionTypes.ClearFilters:
      return clearFilters(state)
    case ActionTypes.IncrementQueryCount:
      return incrementQueryCount(state, action)
    case ActionTypes.DecrementQueryCount:
      return decrementQueryCount(state, action)
    case ActionTypes.ConcatMoreLogs:
      return concatMoreLogs(state, action)
    case ActionTypes.PrependMoreLogs:
      return prependMoreLogs(state, action)
    case ActionTypes.SetConfig:
      return setConfigs(state, action)
    case ActionTypes.ClearTableData:
      return clearTableData(state)
    default:
      return state
  }
}
