// Types
import {TimeRange} from 'src/types'
import {CEOInitialState} from 'src/dashboards/reducers/cellEditorOverlay'

export interface State {
  cellEditorOverlay: CEOInitialState
}

export enum ActionType {
  ClearCEO = 'CLEAR_CEO',
  RenameCell = 'RENAME_CELL',
  UpdateEditorTimeRange = 'UPDATE_EDITOR_TIME_RANGE',
  UpdateFieldOptions = 'UPDATE_FIELD_OPTIONS',
}

export type Action =
  | ClearCEOAction
  | RenameCellAction
  | UpdateEditorTimeRangeAction

export interface ClearCEOAction {
  type: ActionType.ClearCEO
}

export interface RenameCellAction {
  type: ActionType.RenameCell
  payload: {
    cellName: string
  }
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

export const renameCell = (cellName: string): RenameCellAction => ({
  type: ActionType.RenameCell,
  payload: {
    cellName,
  },
})
