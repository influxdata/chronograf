// Libraries
import uuid from 'uuid'

// Utils
import {
  fill,
  timeShift,
  chooseTag,
  groupByTag,
  removeFuncs,
  groupByTime,
  toggleField,
  chooseNamespace,
  chooseMeasurement,
  addInitialField,
  applyFuncsToField,
  toggleTagAcceptance,
} from 'src/utils/queryTransitions'
import {getDeep} from 'src/utils/wrappers'
import {getTimeRange} from 'src/dashboards/utils/cellGetters'
import {buildQuery} from 'src/utils/influxql'
import defaultQueryConfig from 'src/utils/defaultQueryConfig'

// Constants
import {TYPE_QUERY_CONFIG} from 'src/dashboards/constants'

// Types
import {
  Status,
  Field,
  GroupBy,
  Tag,
  TimeShift,
  ApplyFuncsToFieldArgs,
  CellQuery,
  TimeRange,
  QueryType,
} from 'src/types'
import {
  State as CEOState,
  ActionType as CEOActionType,
} from 'src/dashboards/actions/cellEditorOverlay'
import {ActionType as DashboardActionType} from 'src/dashboards/actions'
import {
  State as DEState,
  ActionType as DEActionType,
} from 'src/data_explorer/actions/queries'

type State = CEOState & DEState
type GetState = () => State

export enum QueryUpdateState {
  CEO = 'cellEditorOverlay',
  DE = 'dataExplorer',
}

interface UpdateQueryDraftsAction {
  type: CEOActionType.UpdateQueryDrafts | DEActionType.UpdateQueryDrafts
  payload: {queryDrafts: CellQuery[]}
}

interface UpdateEditorTimeRangeAction {
  type: CEOActionType.UpdateEditorTimeRange | DEActionType.UpdateEditorTimeRange
  payload: {timeRange: TimeRange}
}

interface UpdateQueryStatusAction {
  type: DashboardActionType.EditCellQueryStatus | DEActionType.UpdateQueryStatus
  payload: {queryID: string; status: Status}
}

interface UpdateScriptAction {
  type: CEOActionType.UpdateScript | DEActionType.UpdateScript
  payload: {script: string}
}

export const updateQueryDrafts = (
  queryDrafts: CellQuery[],
  stateToUpdate: QueryUpdateState
): UpdateQueryDraftsAction => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.UpdateQueryDrafts
      : DEActionType.UpdateQueryDrafts
  return {
    type,
    payload: {
      queryDrafts,
    },
  } as UpdateQueryDraftsAction
}

export const updateEditorTimeRange = (
  timeRange: TimeRange,
  stateToUpdate: QueryUpdateState
) => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.UpdateEditorTimeRange
      : DEActionType.UpdateEditorTimeRange
  return {
    type,
    payload: {
      timeRange,
    },
  } as UpdateEditorTimeRangeAction
}

export const updateQueryStatus = (
  queryID,
  status,
  stateToUpdate: QueryUpdateState
) => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? DashboardActionType.EditCellQueryStatus
      : DEActionType.UpdateQueryStatus

  return {
    type,
    payload: {
      queryID,
      status,
    },
  } as UpdateQueryStatusAction
}

export const updateScript = (
  script: string,
  stateToUpdate: QueryUpdateState
) => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.UpdateScript
      : DEActionType.UpdateScript

  return {
    type,
    payload: {
      script,
    },
  } as UpdateScriptAction
}

export const toggleFieldAsync = (
  queryID: string,
  stateToUpdate: QueryUpdateState,
  fieldFunc: Field
) => async (dispatch, getState: GetState) => {
  const queryDrafts = getDeep(getState(), `${stateToUpdate}.queryDrafts`, [])

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = {
        ...toggleField(query.queryConfig, fieldFunc),
        rawText: null,
      }

      return {
        ...query,
        query: buildQuery(
          TYPE_QUERY_CONFIG,
          getTimeRange(nextQueryConfig),
          nextQueryConfig
        ),
        queryConfig: nextQueryConfig,
      }
    }
    return query
  })
  dispatch(updateQueryDrafts(updatedQueryDrafts, stateToUpdate))
}

export const groupByTimeAsync = (
  queryID: string,
  stateToUpdate: QueryUpdateState,
  time: string
) => (dispatch, getState: GetState) => {
  const queryDrafts = getDeep(getState(), `${stateToUpdate}.queryDrafts`, [])

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = groupByTime(query.queryConfig, time)

      return {
        ...query,
        query: buildQuery(
          TYPE_QUERY_CONFIG,
          getTimeRange(nextQueryConfig),
          nextQueryConfig
        ),
        queryConfig: nextQueryConfig,
      }
    }
    return query
  })
  dispatch(updateQueryDrafts(updatedQueryDrafts, stateToUpdate))
}

export const fillAsync = (
  queryID: string,
  stateToUpdate: QueryUpdateState,
  value: string
) => (dispatch, getState: GetState) => {
  const queryDrafts = getDeep(getState(), `${stateToUpdate}.queryDrafts`, [])

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = fill(query.queryConfig, value)

      return {
        ...query,
        query: buildQuery(
          TYPE_QUERY_CONFIG,
          getTimeRange(nextQueryConfig),
          nextQueryConfig
        ),
        queryConfig: nextQueryConfig,
      }
    }
    return query
  })
  dispatch(updateQueryDrafts(updatedQueryDrafts, stateToUpdate))
}

export const removeFuncsAsync = (
  queryID: string,
  stateToUpdate: QueryUpdateState,
  fields: Field[]
) => (dispatch, getState: GetState) => {
  const queryDrafts = getDeep(getState(), `${stateToUpdate}.queryDrafts`, [])

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = removeFuncs(query.queryConfig, fields)

      return {
        ...query,
        query: buildQuery(
          TYPE_QUERY_CONFIG,
          getTimeRange(nextQueryConfig),
          nextQueryConfig
        ),
        queryConfig: nextQueryConfig,
      }
    }
    return query
  })
  dispatch(updateQueryDrafts(updatedQueryDrafts, stateToUpdate))
}

export const applyFuncsToFieldAsync = (
  queryID: string,
  stateToUpdate: QueryUpdateState,
  fieldFunc: ApplyFuncsToFieldArgs,
  groupBy?: GroupBy
) => (dispatch, getState: GetState) => {
  const queryDrafts = getDeep(getState(), `${stateToUpdate}.queryDrafts`, [])

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = applyFuncsToField(
        query.queryConfig,
        fieldFunc,
        groupBy
      )

      return {
        ...query,
        query: buildQuery(
          TYPE_QUERY_CONFIG,
          getTimeRange(nextQueryConfig),
          nextQueryConfig
        ),
        queryConfig: nextQueryConfig,
      }
    }
    return query
  })
  dispatch(updateQueryDrafts(updatedQueryDrafts, stateToUpdate))
}

export const chooseTagAsync = (
  queryID: string,
  stateToUpdate: QueryUpdateState,
  tag: Tag
) => (dispatch, getState: GetState) => {
  const queryDrafts = getDeep(getState(), `${stateToUpdate}.queryDrafts`, [])

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = chooseTag(query.queryConfig, tag)

      return {
        ...query,
        query: buildQuery(
          TYPE_QUERY_CONFIG,
          getTimeRange(nextQueryConfig),
          nextQueryConfig
        ),
        queryConfig: nextQueryConfig,
      }
    }
    return query
  })
  dispatch(updateQueryDrafts(updatedQueryDrafts, stateToUpdate))
}

interface DBRP {
  database: string
  retentionPolicy: string
}

export const chooseNamespaceAsync = (
  queryID: string,
  stateToUpdate: QueryUpdateState,
  {database, retentionPolicy}: DBRP
) => async (dispatch, getState: GetState) => {
  const queryDrafts = getDeep(getState(), `${stateToUpdate}.queryDrafts`, [])

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = chooseNamespace(query.queryConfig, {
        database,
        retentionPolicy,
      })
      return {
        ...query,
        query: buildQuery(
          TYPE_QUERY_CONFIG,
          getTimeRange(nextQueryConfig),
          nextQueryConfig
        ),
        queryConfig: nextQueryConfig,
      }
    }
    return query
  })
  dispatch(updateQueryDrafts(updatedQueryDrafts, stateToUpdate))
}

export const chooseMeasurementAsync = (
  queryID: string,
  stateToUpdate: QueryUpdateState,
  measurement: string
) => async (dispatch, getState: GetState) => {
  const queryDrafts = getDeep(getState(), `${stateToUpdate}.queryDrafts`, [])

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = {
        ...chooseMeasurement(query.queryConfig, measurement),
        rawText: getDeep<string>(query, 'queryConfig.rawText', ''),
      }
      return {
        ...query,
        query: buildQuery(
          TYPE_QUERY_CONFIG,
          getTimeRange(nextQueryConfig),
          nextQueryConfig
        ),
        queryConfig: nextQueryConfig,
      }
    }
    return query
  })
  dispatch(updateQueryDrafts(updatedQueryDrafts, stateToUpdate))
}

export const groupByTagAsync = (
  queryID: string,
  stateToUpdate: QueryUpdateState,
  tagKey: string
) => async (dispatch, getState: GetState) => {
  const queryDrafts = getDeep(getState(), `${stateToUpdate}.queryDrafts`, [])

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = groupByTag(query.queryConfig, tagKey)
      return {
        ...query,
        query: buildQuery(
          TYPE_QUERY_CONFIG,
          getTimeRange(nextQueryConfig),
          nextQueryConfig
        ),
        queryConfig: nextQueryConfig,
      }
    }
    return query
  })
  dispatch(updateQueryDrafts(updatedQueryDrafts, stateToUpdate))
}

export const toggleTagAcceptanceAsync = (
  queryID: string,
  stateToUpdate: QueryUpdateState
) => async (dispatch, getState: GetState) => {
  const queryDrafts = getDeep(getState(), `${stateToUpdate}.queryDrafts`, [])

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = toggleTagAcceptance(query.queryConfig)
      return {
        ...query,
        query: buildQuery(
          TYPE_QUERY_CONFIG,
          getTimeRange(nextQueryConfig),
          nextQueryConfig
        ),
        queryConfig: nextQueryConfig,
      }
    }
    return query
  })
  dispatch(updateQueryDrafts(updatedQueryDrafts, stateToUpdate))
}

export const addInitialFieldAsync = (
  queryID: string,
  stateToUpdate: QueryUpdateState,
  field: Field,
  groupBy: GroupBy
) => async (dispatch, getState: GetState) => {
  const queryDrafts = getDeep(getState(), `${stateToUpdate}.queryDrafts`, [])

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = addInitialField(query.queryConfig, field, groupBy)
      return {
        ...query,
        query: buildQuery(
          TYPE_QUERY_CONFIG,
          getTimeRange(nextQueryConfig),
          nextQueryConfig
        ),
        queryConfig: nextQueryConfig,
      }
    }
    return query
  })
  dispatch(updateQueryDrafts(updatedQueryDrafts, stateToUpdate))
}

export const editQueryStatus = (
  queryID: string,
  stateToUpdate: QueryUpdateState,
  status: Status
) => async (dispatch, getState: GetState) => {
  const queryDrafts = getDeep(getState(), `${stateToUpdate}.queryDrafts`, [])

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = {...query.queryConfig, status}
      return {
        ...query,
        query: buildQuery(
          TYPE_QUERY_CONFIG,
          getTimeRange(nextQueryConfig),
          nextQueryConfig
        ),
        queryConfig: nextQueryConfig,
      }
    }
    return query
  })
  dispatch(updateQueryDrafts(updatedQueryDrafts, stateToUpdate))
}

export const timeShiftAsync = (
  queryID: string,
  stateToUpdate: QueryUpdateState,
  shift: TimeShift
) => async (dispatch, getState: GetState) => {
  const queryDrafts = getDeep(getState(), `${stateToUpdate}.queryDrafts`, [])

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = timeShift(query.queryConfig, shift)
      return {
        ...query,
        query: buildQuery(
          TYPE_QUERY_CONFIG,
          getTimeRange(nextQueryConfig),
          nextQueryConfig
        ),
        queryConfig: nextQueryConfig,
      }
    }
    return query
  })
  dispatch(updateQueryDrafts(updatedQueryDrafts, stateToUpdate))
}

export type QueryConfigActions = typeof queryConfigActions & {
  editRawTextAsync?: (text: string) => Promise<void>
}

export const addQueryAsync = (stateToUpdate: QueryUpdateState) => async (
  dispatch,
  getState: GetState
) => {
  const queryDrafts = getDeep(getState(), `${stateToUpdate}.queryDrafts`, [])

  const queryID = uuid.v4()

  const newQueryDraft: CellQuery = {
    query: '',
    queryConfig: defaultQueryConfig({id: queryID}),
    source: '',
    id: queryID,
    type: QueryType.InfluxQL,
  }
  const updatedQueryDrafts = [...queryDrafts, newQueryDraft]
  dispatch(updateQueryDrafts(updatedQueryDrafts, stateToUpdate))
}

export const deleteQueryAsync = (
  queryID: string,
  stateToUpdate: QueryUpdateState
) => async (dispatch, getState: GetState) => {
  const queryDrafts = getDeep(getState(), `${stateToUpdate}.queryDrafts`, [])

  const updatedQueryDrafts = queryDrafts.filter(query => query.id !== queryID)
  dispatch(updateQueryDrafts(updatedQueryDrafts, stateToUpdate))
}

export const queryConfigActions = {
  fill: fillAsync,
  timeShift: timeShiftAsync,
  chooseTag: chooseTagAsync,
  groupByTag: groupByTagAsync,
  groupByTime: groupByTimeAsync,
  toggleField: toggleFieldAsync,
  removeFuncs: removeFuncsAsync,
  addInitialField: addInitialFieldAsync,
  applyFuncsToField: applyFuncsToFieldAsync,
  toggleTagAcceptance: toggleTagAcceptanceAsync,
  chooseNamespace: chooseNamespaceAsync,
  chooseMeasurement: chooseMeasurementAsync,
}
