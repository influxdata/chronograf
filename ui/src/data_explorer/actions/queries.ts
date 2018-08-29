// Types
import {CellQuery} from 'src/types/dashboards'
import {TimeRange} from 'src/types'

export interface DEInitialState {
  queryDrafts: CellQuery[]
  timeRange: TimeRange
}

export interface State {
  dataExplorer: DEInitialState
}

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
