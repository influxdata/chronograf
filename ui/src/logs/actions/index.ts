import _ from 'lodash'
import {Dispatch} from 'redux'
import {ThunkDispatch} from 'redux-thunk'

import {Source, Namespace, QueryConfig} from 'src/types'
import {getSource} from 'src/shared/apis'
import {getDatabasesWithRetentionPolicies} from 'src/shared/apis/databases'
import {
  buildHistogramQueryConfig,
  buildTableQueryConfig,
  buildLogQuery,
  buildInfiniteScrollLogQuery,
  parseHistogramQueryResponse,
} from 'src/logs/utils'
import {logConfigServerToUI, logConfigUIToServer} from 'src/logs/utils/config'
import {getDeep} from 'src/utils/wrappers'
import {
  executeQueryAsync,
  getLogConfig as getLogConfigAJAX,
  updateLogConfig as updateLogConfigAJAX,
  getSyslogMeasurement,
} from 'src/logs/api'

import {
  LogsState,
  Filter,
  TableData,
  LogConfig,
  TimeRange,
  TimeBounds,
  TimeWindow,
  TimeMarker,
  SearchStatus,
} from 'src/types/logs'

export const INITIAL_LIMIT = 1000
import {
  DEFAULT_OLDER_CHUNK_DURATION_MS,
  DEFAULT_NEWER_CHUNK_DURATION_MS,
  DEFAULT_MAX_TAIL_BUFFER_DURATION_MS,
  defaultTableData,
} from 'src/logs/constants'

interface State {
  logs: LogsState
}

type GetState = () => State

export enum ActionTypes {
  SetSource = 'LOGS_SET_SOURCE',
  SetNamespaces = 'LOGS_SET_NAMESPACES',
  SetTimeBounds = 'LOGS_SET_TIMEBOUNDS',
  SetTimeWindow = 'LOGS_SET_TIMEWINDOW',
  SetTimeMarker = 'LOGS_SET_TIMEMARKER',
  SetNamespace = 'LOGS_SET_NAMESPACE',
  SetHistogramQueryConfig = 'LOGS_SET_HISTOGRAM_QUERY_CONFIG',
  SetHistogramData = 'LOGS_SET_HISTOGRAM_DATA',
  SetTableQueryConfig = 'LOGS_SET_TABLE_QUERY_CONFIG',
  SetTableData = 'LOGS_SET_TABLE_DATA',
  AddFilter = 'LOGS_ADD_FILTER',
  RemoveFilter = 'LOGS_REMOVE_FILTER',
  ChangeFilter = 'LOGS_CHANGE_FILTER',
  ClearFilters = 'LOGS_CLEAR_FILTERS',
  IncrementQueryCount = 'LOGS_INCREMENT_QUERY_COUNT',
  DecrementQueryCount = 'LOGS_DECREMENT_QUERY_COUNT',
  ConcatMoreLogs = 'LOGS_CONCAT_MORE_LOGS',
  PrependMoreLogs = 'LOGS_PREPEND_MORE_LOGS',
  ReplacePrependedLogs = 'LOGS_REPLACE_PREPENDED_LOGS',
  SetConfig = 'SET_CONFIG',
  SetTableRelativeTime = 'SET_TABLE_RELATIVE_TIME',
  SetTableCustomTime = 'SET_TABLE_CUSTOM_TIME',
  SetTableForwardData = 'SET_TABLE_FORWARD_DATA',
  SetTableBackwardData = 'SET_TABLE_BACKWARD_DATA',
  ClearRowsAdded = 'CLEAR_ROWS_ADDED',
  ClearTableData = 'CLEAR_TABLE_DATA',
  SetNextOlderUpperBound = 'SET_NEXT_OLDER_UPPER_BOUND',
  SetNextOlderLowerBound = 'SET_NEXT_OLDER_LOWER_BOUND',
  SetNextNewerUpperBound = 'SET_NEXT_NEWER_UPPER_BOUND',
  SetNextNewerLowerBound = 'SET_NEXT_NEWER_LOWER_BOUND',
  SetCurrentTailUpperBound = 'SET_CURRENT_TAIL_UPPER_BOUND',
  SetNextTailLowerBound = 'SET_NEXT_TAIL_LOWER_BOUND',
  SetSearchStatus = 'SET_SEARCH_STATUS',
}

export interface ClearRowsAddedAction {
  type: ActionTypes.ClearRowsAdded
}

export interface ClearTableDataAction {
  type: ActionTypes.ClearTableData
}

export interface SetTableForwardDataAction {
  type: ActionTypes.SetTableForwardData
  payload: {
    data: TableData
  }
}

export interface SetTableBackwardDataAction {
  type: ActionTypes.SetTableBackwardData
  payload: {
    data: TableData
  }
}

export interface SetTableRelativeTimeAction {
  type: ActionTypes.SetTableRelativeTime
  payload: {
    time: number
  }
}

export interface SetTableCustomTimeAction {
  type: ActionTypes.SetTableCustomTime
  payload: {
    time: string
  }
}

export interface ConcatMoreLogsAction {
  type: ActionTypes.ConcatMoreLogs
  payload: {
    series: TableData
  }
}

export interface PrependMoreLogsAction {
  type: ActionTypes.PrependMoreLogs
  payload: {
    series: TableData
  }
}

export interface ReplacePrependedLogsAction {
  type: ActionTypes.ReplacePrependedLogs
  payload: {
    series: TableData
  }
}

export interface IncrementQueryCountAction {
  type: ActionTypes.IncrementQueryCount
}

export interface DecrementQueryCountAction {
  type: ActionTypes.DecrementQueryCount
}

export interface AddFilterAction {
  type: ActionTypes.AddFilter
  payload: {
    filter: Filter
  }
}

export interface ChangeFilterAction {
  type: ActionTypes.ChangeFilter
  payload: {
    id: string
    operator: string
    value: string
  }
}

export interface ClearFiltersAction {
  type: ActionTypes.ClearFilters
}

export interface RemoveFilterAction {
  type: ActionTypes.RemoveFilter
  payload: {
    id: string
  }
}
interface SetSourceAction {
  type: ActionTypes.SetSource
  payload: {
    source: Source
  }
}

interface SetNamespacesAction {
  type: ActionTypes.SetNamespaces
  payload: {
    namespaces: Namespace[]
  }
}

interface SetNamespaceAction {
  type: ActionTypes.SetNamespace
  payload: {
    namespace: Namespace
  }
}

interface SetTimeBoundsAction {
  type: ActionTypes.SetTimeBounds
  payload: {
    timeBounds: TimeBounds
  }
}

interface SetTimeWindowAction {
  type: ActionTypes.SetTimeWindow
  payload: {
    timeWindow: TimeWindow
  }
}

interface SetTimeMarkerAction {
  type: ActionTypes.SetTimeMarker
  payload: {
    timeMarker: TimeMarker
  }
}

interface SetHistogramQueryConfigAction {
  type: ActionTypes.SetHistogramQueryConfig
  payload: {
    queryConfig: QueryConfig
  }
}

interface SetHistogramDataAction {
  type: ActionTypes.SetHistogramData
  payload: {
    data: object[]
  }
}

interface SetTableQueryConfigAction {
  type: ActionTypes.SetTableQueryConfig
  payload: {
    queryConfig: QueryConfig
  }
}

interface SetTableData {
  type: ActionTypes.SetTableData
  payload: {
    data: object
  }
}

export interface SetConfigAction {
  type: ActionTypes.SetConfig
  payload: {
    logConfig: LogConfig
  }
}

interface SetNextOlderUpperBoundAction {
  type: ActionTypes.SetNextOlderUpperBound
  payload: {
    upper: number | undefined
  }
}
interface SetNextOlderLowerBoundAction {
  type: ActionTypes.SetNextOlderLowerBound
  payload: {
    lower: number | undefined
  }
}

interface SetNextNewerLowerBoundAction {
  type: ActionTypes.SetNextNewerLowerBound
  payload: {
    lower: number | undefined
  }
}
interface SetNextNewerUpperBoundAction {
  type: ActionTypes.SetNextNewerUpperBound
  payload: {
    upper: number | undefined
  }
}

interface SetCurrentTailUpperBoundAction {
  type: ActionTypes.SetCurrentTailUpperBound
  payload: {
    upper: number | undefined
  }
}
interface SetNextTailLowerBoundAction {
  type: ActionTypes.SetNextTailLowerBound
  payload: {
    lower: number | undefined
  }
}

export interface SetSearchStatusAction {
  type: ActionTypes.SetSearchStatus
  payload: {
    searchStatus: SearchStatus
  }
}

export type Action =
  | SetSourceAction
  | SetNamespacesAction
  | SetTimeBoundsAction
  | SetTimeWindowAction
  | SetTimeMarkerAction
  | SetNamespaceAction
  | SetHistogramQueryConfigAction
  | SetHistogramDataAction
  | SetTableData
  | SetTableQueryConfigAction
  | AddFilterAction
  | RemoveFilterAction
  | ChangeFilterAction
  | ClearFiltersAction
  | DecrementQueryCountAction
  | IncrementQueryCountAction
  | ConcatMoreLogsAction
  | PrependMoreLogsAction
  | ReplacePrependedLogsAction
  | SetConfigAction
  | SetTableCustomTimeAction
  | SetTableRelativeTimeAction
  | SetTableForwardDataAction
  | SetTableBackwardDataAction
  | ClearRowsAddedAction
  | ClearTableDataAction
  | SetNextOlderUpperBoundAction
  | SetNextOlderLowerBoundAction
  | SetNextNewerUpperBoundAction
  | SetNextNewerLowerBoundAction
  | SetCurrentTailUpperBoundAction
  | SetNextTailLowerBoundAction
  | SetSearchStatusAction

const getIsTruncated = (state: State): boolean =>
  state.logs.logConfig.isTruncated

const getForwardTableData = (state: State): TableData =>
  state.logs.tableInfiniteData.forward

const getBackwardTableData = (state: State): TableData =>
  state.logs.tableInfiniteData.backward

/**
 * Creates new TableData with the concatted TableData values from args of TableData
 * @param tableDatas
 */
const combineTableData = (...tableDatas: TableData[]) => ({
  columns: tableDatas[0].columns,
  values: _.flatMap(tableDatas, t => t.values),
})

const getTimeRange = (state: State): TimeRange | null =>
  getDeep<TimeRange | null>(state, 'logs.timeRange', null)

const getNamespace = (state: State): Namespace | null =>
  getDeep<Namespace | null>(state, 'logs.currentNamespace', null)

const getProxyLink = (state: State): string | null =>
  getDeep<string | null>(state, 'logs.currentSource.links.proxy', null)

const getHistogramQueryConfig = (state: State): QueryConfig | null =>
  getDeep<QueryConfig | null>(state, 'logs.histogramQueryConfig', null)

const getTableQueryConfig = (state: State): QueryConfig | null =>
  getDeep<QueryConfig | null>(state, 'logs.tableQueryConfig', null)

const getSearchTerm = (state: State): string | null =>
  getDeep<string | null>(state, 'logs.searchTerm', null)

const getFilters = (state: State): Filter[] =>
  getDeep<Filter[]>(state, 'logs.filters', [])

const getTableSelectedTime = (state: State): number => {
  const custom = getDeep<string>(state, 'logs.tableTime.custom', '')

  if (!_.isEmpty(custom)) {
    return Date.parse(custom)
  }

  const relative = getDeep<number>(state, 'logs.tableTime.relative', 0)

  return Date.now() - relative * 1000
}

const getNextOlderUpperBound = (state: State): number => {
  const selectedTableTime = getTableSelectedTime(state)
  return getDeep<number>(state, 'logs.nextOlderUpperBound', selectedTableTime)
}

const getOlderChunkDurationMs = (state: State): number => {
  return getDeep<number>(
    state,
    'logs.olderChunkDurationMs',
    DEFAULT_OLDER_CHUNK_DURATION_MS
  )
}

const getNextNewerLowerBound = (state: State): number => {
  const selectedTableTime = getTableSelectedTime(state)
  return getDeep<number>(state, 'logs.nextNewerLowerBound', selectedTableTime)
}

const getNewerChunkDurationMs = (state: State): number => {
  return getDeep<number>(
    state,
    'logs.newerChunkDurationMs',
    DEFAULT_NEWER_CHUNK_DURATION_MS
  )
}

const getNextTailLowerBound = (state: State): number | void =>
  state.logs.nextTailLowerBound

/**
 * Gets the maximum duration that the tail buffer should accumulate
 *  before being flushed to the 'backward' table data.
 * @param state the application state
 */
const getMaxTailBufferDurationMs = (state: State): number => {
  return getDeep<number>(
    state,
    'logs.maxTailBufferDurationMs',
    DEFAULT_MAX_TAIL_BUFFER_DURATION_MS
  )
}

/**
 * Sets tableInfiniteData with empty 'forward' and 'backward' table data.
 */
export const clearTableData = () => ({
  type: ActionTypes.ClearTableData,
})

export const clearRowsAdded = () => ({
  type: ActionTypes.ClearRowsAdded,
})

export const setTableCustomTime = (time: string): SetTableCustomTimeAction => ({
  type: ActionTypes.SetTableCustomTime,
  payload: {time},
})

export const setTableRelativeTime = (
  time: number
): SetTableRelativeTimeAction => ({
  type: ActionTypes.SetTableRelativeTime,
  payload: {time},
})

export const setTableForwardData = (
  data: TableData
): SetTableForwardDataAction => ({
  type: ActionTypes.SetTableForwardData,
  payload: {data},
})

export const setTableBackwardData = (
  data: TableData
): SetTableBackwardDataAction => ({
  type: ActionTypes.SetTableBackwardData,
  payload: {data},
})

export const setTimeWindow = (timeWindow: TimeWindow): SetTimeWindowAction => ({
  type: ActionTypes.SetTimeWindow,
  payload: {timeWindow},
})

export const setTimeMarker = (timeMarker: TimeMarker): SetTimeMarkerAction => ({
  type: ActionTypes.SetTimeMarker,
  payload: {timeMarker},
})

export const setTimeBounds = (timeBounds: TimeBounds): SetTimeBoundsAction => ({
  type: ActionTypes.SetTimeBounds,
  payload: {timeBounds},
})

/**
 * Sets the upper bound on the next older chunk fetch query.
 * @param upper the point in time up until which to fetch older logs.
 */
export const setNextOlderUpperBound = (
  upper: number
): SetNextOlderUpperBoundAction => ({
  type: ActionTypes.SetNextOlderUpperBound,
  payload: {upper},
})

/**
 * Sets the lower bound on the next older chunk fetch query.
 *  This is _not_ used in fetchOlderChunkAsync.
 * @param lower the point in time starting from which to fetch older logs.
 */
export const setNextOlderLowerBound = (
  lower: number
): SetNextOlderLowerBoundAction => ({
  type: ActionTypes.SetNextOlderLowerBound,
  payload: {lower},
})

/**
 * Sets the upper bound on the next newer chunk fetch query.
 *  This is _not_ used in fetchNewerChunkAsync.
 * @param upper the point in time up until which to fetch newer logs.
 */
export const setNextNewerUpperBound = (
  upper: number
): SetNextNewerUpperBoundAction => ({
  type: ActionTypes.SetNextNewerUpperBound,
  payload: {upper},
})

/**
 * Sets the lower bound on the next newer chunk fetch query.
 * @param lower the point in time starting from which to fetch newer logs.
 */
export const setNextNewerLowerBound = (
  lower: number
): SetNextNewerLowerBoundAction => ({
  type: ActionTypes.SetNextNewerLowerBound,
  payload: {lower},
})

/**
 * Sets the upper bound of time up until which logs were fetched for the current tail chunk.
 * @param upper the point in time up until which the current tail was fetched.
 */
export const setCurrentTailUpperBound = (
  upper: number
): SetCurrentTailUpperBoundAction => ({
  type: ActionTypes.SetCurrentTailUpperBound,
  payload: {upper},
})

/**
 * Sets the lower bound of time on the current tail chunk fetch query.
 * @param lower the point in time starting from which to begin the next tail fetch.
 */
export const setNextTailLowerBound = (
  lower: number
): SetNextTailLowerBoundAction => ({
  type: ActionTypes.SetNextTailLowerBound,
  payload: {lower},
})

/**
 * Sets the search status corresponding to the current fetch request.
 * @param searchStatus the state of the current Logs Page fetch request.
 */
export const setSearchStatus = (
  searchStatus: SearchStatus
): SetSearchStatusAction => ({
  type: ActionTypes.SetSearchStatus,
  payload: {searchStatus},
})

export const clearAllTimeBounds = () => (
  dispatch: Dispatch<
    | SetNextOlderUpperBoundAction
    | SetNextOlderLowerBoundAction
    | SetNextNewerUpperBoundAction
    | SetNextNewerLowerBoundAction
    | SetCurrentTailUpperBoundAction
    | SetNextTailLowerBoundAction
  >
) => {
  dispatch(setNextOlderUpperBound(undefined))
  dispatch(setNextOlderLowerBound(undefined))
  dispatch(setNextNewerUpperBound(undefined))
  dispatch(setCurrentTailUpperBound(undefined))
  dispatch(setNextTailLowerBound(undefined))
}

export const clearSearchData = (
  searchStatus: SearchStatus
) => async dispatch => {
  await dispatch(setSearchStatus(SearchStatus.Clearing))
  dispatch(setHistogramData([]))
  dispatch(clearAllTimeBounds())
  dispatch(clearTableData())
  await dispatch(setSearchStatus(SearchStatus.Cleared))
  await dispatch(setSearchStatus(searchStatus))
}

export const setTableCustomTimeAsync = (time: string) => async dispatch => {
  await dispatch(setTableCustomTime(time))
}

export const setTableRelativeTimeAsync = (time: number) => async dispatch => {
  await dispatch(setTableRelativeTime(time))
}

export const changeFilter = (id: string, operator: string, value: string) => ({
  type: ActionTypes.ChangeFilter,
  payload: {id, operator, value},
})

export const setSource = (source: Source): SetSourceAction => ({
  type: ActionTypes.SetSource,
  payload: {source},
})

export const addFilter = (filter: Filter): AddFilterAction => ({
  type: ActionTypes.AddFilter,
  payload: {filter},
})

export const clearFilters = (): ClearFiltersAction => ({
  type: ActionTypes.ClearFilters,
})

export const removeFilter = (id: string): RemoveFilterAction => ({
  type: ActionTypes.RemoveFilter,
  payload: {id},
})

const setHistogramData = (data): SetHistogramDataAction => ({
  type: ActionTypes.SetHistogramData,
  payload: {data},
})

export const executeHistogramQueryAsync = () => async (
  dispatch,
  getState: GetState
): Promise<void> => {
  const state = getState()

  const queryConfig = getHistogramQueryConfig(state)
  const timeRange = getTimeRange(state)
  const namespace = getNamespace(state)
  const proxyLink = getProxyLink(state)
  const searchTerm = getSearchTerm(state)
  const filters = getFilters(state)

  if (!_.every([queryConfig, timeRange, namespace, proxyLink])) {
    return
  }

  try {
    dispatch(incrementQueryCount())

    const query = buildLogQuery(timeRange, queryConfig, filters, searchTerm)
    const response = await executeQueryAsync(proxyLink, namespace, query)
    const data = parseHistogramQueryResponse(response)

    dispatch(setHistogramData(data))
  } finally {
    dispatch(decrementQueryCount())
  }
}

export const decrementQueryCount = () => ({
  type: ActionTypes.DecrementQueryCount,
})

export const incrementQueryCount = () => ({
  type: ActionTypes.IncrementQueryCount,
})

export const setHistogramQueryConfigAsync = () => async (
  dispatch,
  getState: GetState
): Promise<void> => {
  const state = getState()
  const namespace = getDeep<Namespace | null>(
    state,
    'logs.currentNamespace',
    null
  )
  const timeRange = getDeep<TimeRange | null>(state, 'logs.timeRange', null)

  if (timeRange && namespace) {
    const queryTimeRange = {
      upper: timeRange.upper,
      lower: timeRange.lower,
      seconds: timeRange.seconds,
    }

    const queryConfig = buildHistogramQueryConfig(namespace, queryTimeRange)

    dispatch({
      type: ActionTypes.SetHistogramQueryConfig,
      payload: {queryConfig},
    })

    dispatch(executeHistogramQueryAsync())
  }
}

export const setTableQueryConfig = (
  queryConfig: QueryConfig
): SetTableQueryConfigAction => ({
  type: ActionTypes.SetTableQueryConfig,
  payload: {queryConfig},
})

export const setTableQueryConfigAsync = () => async (
  dispatch,
  getState: GetState
): Promise<void> => {
  const state = getState()
  const namespace = getDeep<Namespace | null>(
    state,
    'logs.currentNamespace',
    null
  )
  const timeRange = getDeep<TimeRange | null>(state, 'logs.timeRange', null)

  if (timeRange && namespace) {
    const queryConfig = buildTableQueryConfig(namespace, timeRange)

    dispatch(setTableQueryConfig(queryConfig))
  }
}

export const fetchOlderChunkAsync = () => async (
  dispatch: Dispatch<SetNextOlderUpperBoundAction | ConcatMoreLogsAction>,
  getState: GetState
): Promise<void> => {
  const state = getState()

  const tableQueryConfig = getTableQueryConfig(state)
  const namespace = getNamespace(state)
  const proxyLink = getProxyLink(state)
  const searchTerm = getSearchTerm(state)
  const filters = getFilters(state)
  const params = [namespace, proxyLink, tableQueryConfig]

  if (_.every(params)) {
    const olderUpperBound = getNextOlderUpperBound(state)
    const olderChunkDurationMs = getOlderChunkDurationMs(state)

    const nextOlderUpperBound = olderUpperBound - olderChunkDurationMs
    dispatch(setNextOlderUpperBound(nextOlderUpperBound))

    const upper = new Date(olderUpperBound).toISOString()
    const lower = new Date(nextOlderUpperBound).toISOString()

    const query = buildInfiniteScrollLogQuery(
      lower,
      upper,
      tableQueryConfig,
      filters,
      searchTerm
    )
    const response = await executeQueryAsync(
      proxyLink,
      namespace,
      `${query} ORDER BY time DESC`
    )
    const logSeries = getDeep<TableData>(
      response,
      'results.0.series.0',
      defaultTableData
    )

    await dispatch(concatMoreLogs(logSeries))
  } else {
    throw new Error(
      `Missing params required to fetch older logs. Maybe there's a race condition with setting namespaces?`
    )
  }
}

export const fetchNewerChunkAsync = () => async (
  dispatch: Dispatch<SetNextNewerLowerBoundAction | PrependMoreLogsAction>,
  getState: GetState
): Promise<void> => {
  const state = getState()

  const tableQueryConfig = getTableQueryConfig(state)
  const namespace = getNamespace(state)
  const proxyLink = getProxyLink(state)
  const searchTerm = getSearchTerm(state)
  const filters = getFilters(state)
  const params = [namespace, proxyLink, tableQueryConfig]

  if (_.every(params)) {
    const newerLowerBound = getNextNewerLowerBound(state)
    const newerChunkDurationMs = getNewerChunkDurationMs(state)

    const nextNewerLowerBound = newerLowerBound + newerChunkDurationMs
    dispatch(setNextNewerLowerBound(nextNewerLowerBound))

    const upper = new Date(nextNewerLowerBound).toISOString()
    const lower = new Date(newerLowerBound).toISOString()

    const query = buildInfiniteScrollLogQuery(
      lower,
      upper,
      tableQueryConfig,
      filters,
      searchTerm
    )
    const response = await executeQueryAsync(
      proxyLink,
      namespace,
      `${query} ORDER BY time DESC`
    )
    const logSeries = getDeep<TableData>(
      response,
      'results.0.series.0',
      defaultTableData
    )

    await dispatch(prependMoreLogs(logSeries))
  } else {
    throw new Error(
      `Missing params required to fetch newer logs. Maybe there's a race condition with setting namespaces?`
    )
  }
}

export const flushTailBuffer = () => (
  dispatch: Dispatch<SetTableBackwardDataAction | SetTableForwardDataAction>,
  getState: GetState
) => {
  const state = getState()

  const currentTailBuffer = getForwardTableData(state)
  const currentBackward = getBackwardTableData(state)

  const combinedBackward = combineTableData(currentTailBuffer, currentBackward)

  dispatch(setTableBackwardData(combinedBackward))
  dispatch(setTableForwardData(defaultTableData))
}

export const fetchTailAsync = () => async (
  dispatch:
    | Dispatch<
        | SetTableBackwardDataAction
        | SetTableForwardDataAction
        | SetNextTailLowerBoundAction
      >
    | ThunkDispatch<typeof flushTailBuffer>,
  getState: GetState
): Promise<void> => {
  const state = getState()

  const tableQueryConfig = getTableQueryConfig(state)
  const namespace = getNamespace(state)
  const proxyLink = getProxyLink(state)
  const searchTerm = getSearchTerm(state)
  const filters = getFilters(state)
  const params = [namespace, proxyLink, tableQueryConfig]

  if (_.every(params)) {
    const tailLowerBound = getNextTailLowerBound(state)

    if (!tailLowerBound) {
      throw new Error('tail lower bound is not set')
    }
    const upper = new Date().toISOString()
    const lower = new Date(tailLowerBound).toISOString()

    const upperUTC = Date.parse(upper)
    dispatch(setCurrentTailUpperBound(upperUTC))

    const query = buildInfiniteScrollLogQuery(
      lower,
      upper,
      tableQueryConfig,
      filters,
      searchTerm
    )
    const response = await executeQueryAsync(
      proxyLink,
      namespace,
      `${query} ORDER BY time DESC`
    )
    const logSeries = getDeep<TableData>(
      response,
      'results.0.series.0',
      defaultTableData
    )

    const currentForwardBufferDuration = upperUTC - tailLowerBound
    const maxTailBufferDurationMs = getMaxTailBufferDurationMs(state)
    const isMaxTailBufferDurationExceeded =
      currentForwardBufferDuration >= maxTailBufferDurationMs

    if (isMaxTailBufferDurationExceeded) {
      dispatch(flushTailBuffer())
      await dispatch(setNextTailLowerBound(upperUTC))
    } else {
      await dispatch(setTableForwardData(logSeries))
    }
  } else {
    throw new Error(
      `Missing params required to fetch tail logs. Maybe there's a race condition with setting namespaces?`
    )
  }
}

export const concatMoreLogs = (series: TableData): ConcatMoreLogsAction => ({
  type: ActionTypes.ConcatMoreLogs,
  payload: {series},
})

export const prependMoreLogs = (series: TableData): PrependMoreLogsAction => ({
  type: ActionTypes.PrependMoreLogs,
  payload: {series},
})

export const setNamespaceAsync = (namespace: Namespace) => async (
  dispatch
): Promise<void> => {
  dispatch({
    type: ActionTypes.SetNamespace,
    payload: {namespace},
  })

  await Promise.all([
    dispatch(setHistogramQueryConfigAsync()),
    dispatch(setTableQueryConfigAsync()),
  ])
}

export const fetchNamespaceSyslogStatusAsync = (namespace: Namespace) => async (
  dispatch: Dispatch<SetSearchStatusAction>,
  getState: GetState
) => {
  try {
    const proxyLink = getProxyLink(getState())
    const response = await getSyslogMeasurement(proxyLink, namespace)
    const series = getDeep(response, 'results.0.series', [])

    if (_.isEmpty(series)) {
      await dispatch(setSearchStatus(SearchStatus.MeasurementMissing))
    }
  } catch (error) {
    await dispatch(setSearchStatus(SearchStatus.MeasurementMissing))
  }
}

export const setNamespaces = (
  namespaces: Namespace[]
): SetNamespacesAction => ({
  type: ActionTypes.SetNamespaces,
  payload: {
    namespaces,
  },
})

export const setTimeRangeAsync = () => async (dispatch): Promise<void> => {
  dispatch(setHistogramQueryConfigAsync())
  dispatch(setTableQueryConfigAsync())
}

export const populateNamespacesAsync = (
  proxyLink: string,
  source: Source = null
) => async (dispatch): Promise<void> => {
  const namespaces = await getDatabasesWithRetentionPolicies(proxyLink)

  if (namespaces && namespaces.length > 0) {
    dispatch(setNamespaces(namespaces))

    let defaultNamespace: Namespace

    if (source && source.telegraf) {
      defaultNamespace = _.find(
        namespaces,
        ns => ns.database === source.telegraf
      )
    }

    const namespace = defaultNamespace || namespaces[0]

    await Promise.all([
      dispatch(setNamespaceAsync(namespace)),
      dispatch(fetchNamespaceSyslogStatusAsync(namespace)),
    ])
  }
}

export const getSourceAndPopulateNamespacesAsync = (sourceID: string) => async (
  dispatch
): Promise<void> => {
  const source = await getSource(sourceID)

  const proxyLink = getDeep<string | null>(source, 'links.proxy', null)

  if (proxyLink) {
    dispatch(setSource(source))
    await dispatch(populateNamespacesAsync(proxyLink, source))
  }
}

export const getLogConfigAsync = (url: string) => async (
  dispatch: Dispatch<SetConfigAction>,
  getState: GetState
): Promise<void> => {
  const state = getState()
  const isTruncated = getIsTruncated(state)

  try {
    const {data} = await getLogConfigAJAX(url)

    const logConfig = {
      ...logConfigServerToUI(data),
      isTruncated,
    }

    await dispatch(setConfig(logConfig))
  } catch (error) {
    console.error(error)
  }
}

export const updateLogConfigAsync = (url: string, config: LogConfig) => async (
  dispatch: Dispatch<SetConfigAction>
): Promise<void> => {
  try {
    const configForServer = logConfigUIToServer(config)
    await updateLogConfigAJAX(url, configForServer)
    dispatch(setConfig(config))
  } catch (error) {
    console.error(error)
  }
}

export const setConfig = (logConfig: LogConfig): SetConfigAction => {
  return {
    type: ActionTypes.SetConfig,
    payload: {
      logConfig,
    },
  }
}
