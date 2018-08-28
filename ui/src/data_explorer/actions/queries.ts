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
import defaultQueryConfig from 'src/utils/defaultQueryConfig'
import {getTimeRange} from 'src/dashboards/utils/cellGetters'
import {buildQuery} from 'src/utils/influxql'

// Constants
import {TYPE_QUERY_CONFIG} from 'src/dashboards/constants'

// Types
import {CellQuery} from 'src/types/dashboards'
import {
  Status,
  Field,
  GroupBy,
  Tag,
  TimeShift,
  ApplyFuncsToFieldArgs,
  TimeRange,
} from 'src/types'
import {CEOInitialState} from 'src/dashboards/reducers/cellEditorOverlay'

interface State {
  dataExplorer: CEOInitialState
}

type GetState = () => State

export enum ActionType {
  LoadDE = 'LOAD_DE',
  UpdateQueryDrafts = 'DE_UPDATE_QUERY_DRAFTS',
  UpdateQueryDraft = 'DE_UPDATE_QUERY_DRAFT',
  UpdateEditorTimeRange = 'DE_UPDATE_EDITOR_TIME_RANGE',
}

export type Action =
  | LoadDEAction
  | UpdateEditorTimeRangeAction
  | UpdateQueryDraftsAction

export interface LoadDEAction {
  type: ActionType.LoadDE
  payload: {
    queries: CellQuery[]
    timeRange: TimeRange
  }
}

export interface UpdateQueryDraftsAction {
  type: ActionType.UpdateQueryDrafts
  payload: {
    queryDrafts: CellQuery[]
  }
}

export interface UpdateQueryDraftAction {
  type: ActionType.UpdateQueryDraft
  payload: {
    queryDraft: CellQuery
  }
}

export interface UpdateEditorTimeRangeAction {
  type: ActionType.UpdateEditorTimeRange
  payload: {
    timeRange: TimeRange
  }
}

export const loadDE = (
  queries: CellQuery[],
  timeRange: TimeRange
): LoadDEAction => ({
  type: ActionType.LoadDE,
  payload: {
    queries,
    timeRange,
  },
})

export const updateEditorTimeRange = (
  timeRange: TimeRange
): UpdateEditorTimeRangeAction => ({
  type: ActionType.UpdateEditorTimeRange,
  payload: {
    timeRange,
  },
})

// ---------- Query Builder ----------

export const updateQueryDrafts = (
  queryDrafts: CellQuery[]
): UpdateQueryDraftsAction => ({
  type: ActionType.UpdateQueryDrafts,
  payload: {
    queryDrafts,
  },
})

export const updateQueryDraft = (
  queryDraft: CellQuery
): UpdateQueryDraftAction => ({
  type: ActionType.UpdateQueryDraft,
  payload: {
    queryDraft,
  },
})

export const addQueryAsync = (queryID: string = uuid.v4()) => async (
  dispatch,
  getState: GetState
) => {
  const {
    dataExplorer: {queryDrafts},
  } = getState()

  const newQueryDraft: CellQuery = {
    query: '',
    queryConfig: defaultQueryConfig({id: queryID}),
    source: '',
    id: queryID,
  }
  const updatedQueryDrafts = [...queryDrafts, newQueryDraft]
  dispatch(updateQueryDrafts(updatedQueryDrafts))
}

export const deleteQueryAsync = (queryID: string) => async (
  dispatch,
  getState: GetState
) => {
  const {
    dataExplorer: {queryDrafts},
  } = getState()

  const updatedQueryDrafts = queryDrafts.filter(query => query.id !== queryID)
  dispatch(updateQueryDrafts(updatedQueryDrafts))
}

export const toggleFieldAsync = (queryID: string, fieldFunc: Field) => async (
  dispatch,
  getState: GetState
) => {
  const {
    dataExplorer: {queryDrafts},
  } = getState()

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
  dispatch(updateQueryDrafts(updatedQueryDrafts))
}

export const groupByTimeAsync = (queryID: string, time: string) => (
  dispatch,
  getState: GetState
) => {
  const {
    dataExplorer: {queryDrafts},
  } = getState()

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
  dispatch(updateQueryDrafts(updatedQueryDrafts))
}

export const fillAsync = (queryID: string, value: string) => (
  dispatch,
  getState: GetState
) => {
  const {
    dataExplorer: {queryDrafts},
  } = getState()

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
  dispatch(updateQueryDrafts(updatedQueryDrafts))
}

export const removeFuncsAsync = (queryID: string, fields: Field[]) => (
  dispatch,
  getState: GetState
) => {
  const {
    dataExplorer: {queryDrafts},
  } = getState()

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
  dispatch(updateQueryDrafts(updatedQueryDrafts))
}

export const applyFuncsToFieldAsync = (
  queryID: string,
  fieldFunc: ApplyFuncsToFieldArgs,
  groupBy?: GroupBy
) => (dispatch, getState: GetState) => {
  const {
    dataExplorer: {queryDrafts},
  } = getState()

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
  dispatch(updateQueryDrafts(updatedQueryDrafts))
}

export const chooseTagAsync = (queryID: string, tag: Tag) => (
  dispatch,
  getState: GetState
) => {
  const {
    dataExplorer: {queryDrafts},
  } = getState()

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
  dispatch(updateQueryDrafts(updatedQueryDrafts))
}

interface DBRP {
  database: string
  retentionPolicy: string
}

export const chooseNamespaceAsync = (
  queryID: string,
  {database, retentionPolicy}: DBRP
) => async (dispatch, getState: GetState) => {
  const {
    dataExplorer: {queryDrafts},
  } = getState()

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
  dispatch(updateQueryDrafts(updatedQueryDrafts))
}

export const chooseMeasurementAsync = (
  queryID: string,
  measurement: string
) => async (dispatch, getState: GetState) => {
  const {
    dataExplorer: {queryDrafts},
  } = getState()

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
  dispatch(updateQueryDrafts(updatedQueryDrafts))
}

export const groupByTagAsync = (queryID: string, tagKey: string) => async (
  dispatch,
  getState: GetState
) => {
  const {
    dataExplorer: {queryDrafts},
  } = getState()

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
  dispatch(updateQueryDrafts(updatedQueryDrafts))
}

export const toggleTagAcceptanceAsync = (queryID: string) => async (
  dispatch,
  getState: GetState
) => {
  const {
    dataExplorer: {queryDrafts},
  } = getState()

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
  dispatch(updateQueryDrafts(updatedQueryDrafts))
}

export const addInitialFieldAsync = (
  queryID: string,
  field: Field,
  groupBy: GroupBy
) => async (dispatch, getState: GetState) => {
  const {
    dataExplorer: {queryDrafts},
  } = getState()

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
  dispatch(updateQueryDrafts(updatedQueryDrafts))
}

export const editQueryStatus = (queryID: string, status: Status) => async (
  dispatch,
  getState: GetState
) => {
  const {
    dataExplorer: {queryDrafts},
  } = getState()

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
  dispatch(updateQueryDrafts(updatedQueryDrafts))
}

export const timeShiftAsync = (queryID: string, shift: TimeShift) => async (
  dispatch,
  getState: GetState
) => {
  const {
    dataExplorer: {queryDrafts},
  } = getState()

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
  dispatch(updateQueryDrafts(updatedQueryDrafts))
}

export type QueryConfigActions = typeof queryConfigActions & {
  editRawTextAsync?: (text: string) => Promise<void>
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
