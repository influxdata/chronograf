// Types
import {TimeRange} from 'src/types'
import {CEOInitialState} from 'src/dashboards/reducers/cellEditorOverlay'

export interface State {
  cellEditorOverlay: CEOInitialState
}

export enum ActionType {
  ClearCEO = 'CLEAR_CEO',
  UpdateEditorTimeRange = 'UPDATE_EDITOR_TIME_RANGE',
}

export type Action = ClearCEOAction | UpdateEditorTimeRangeAction

export interface ClearCEOAction {
  type: ActionType.ClearCEO
}

export interface UpdateEditorTimeRangeAction {
  type: ActionType.UpdateEditorTimeRange
  payload: {
    timeRange: TimeRange
  }
}

export const clearCEO = (): ClearCEOAction => ({
  type: ActionType.ClearCEO,
})
