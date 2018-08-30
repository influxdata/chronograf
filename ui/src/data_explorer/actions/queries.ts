// Types
import {TimeRange, CellQuery, Status, QueryStatus} from 'src/types'

export interface DEInitialState {
  queryDrafts: CellQuery[]
  timeRange: TimeRange
  queryStatus: QueryStatus
  script: string
  sourceLink: string
}

export interface State {
  dataExplorer: DEInitialState
}

export enum ActionType {
  LoadDE = 'LOAD_DE',
  UpdateQueryDrafts = 'DE_UPDATE_QUERY_DRAFTS',
  UpdateEditorTimeRange = 'DE_UPDATE_EDITOR_TIME_RANGE',
  UpdateQueryStatus = 'DE_UPDATE_QUERY_STATUS',
  UpdateScript = 'DE_UPDATE_SCRIPT',
  UpdateSourceLink = 'DE_UPDATE_SOURCE_LINK',
}

export type Action =
  | LoadDEAction
  | UpdateEditorTimeRangeAction
  | UpdateQueryDraftsAction
  | UpdateQueryStatusAction
  | UpdateScriptAction
  | UpdateSourceLinkAction

export interface UpdateSourceLinkAction {
  type: ActionType.UpdateSourceLink
  payload: {
    sourceLink: string
  }
}

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

export interface UpdateEditorTimeRangeAction {
  type: ActionType.UpdateEditorTimeRange
  payload: {
    timeRange: TimeRange
  }
}

export interface UpdateQueryStatusAction {
  type: ActionType.UpdateQueryStatus
  payload: {
    queryID: string
    status: Status
  }
}

export interface UpdateScriptAction {
  type: ActionType.UpdateScript
  payload: {
    script: string
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

export const updateSourceLink = (
  sourceLink: string
): UpdateSourceLinkAction => ({
  type: ActionType.UpdateSourceLink,
  payload: {
    sourceLink,
  },
})
