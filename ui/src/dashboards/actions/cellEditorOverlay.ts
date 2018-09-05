// Types
import {ColorNumber, ColorString} from 'src/types/colors'
import {
  DecimalPlaces,
  FieldOption,
  Axes,
  Cell,
  CellType,
  ThresholdType,
  TableOptions,
  CellQuery,
  NewDefaultCell,
  NoteVisibility,
} from 'src/types/dashboards'
import {TimeRange} from 'src/types'
import {CEOInitialState} from 'src/dashboards/reducers/cellEditorOverlay'

export interface State {
  cellEditorOverlay: CEOInitialState
}

export enum ActionType {
  LoadCEO = 'LOAD_CEO',
  ClearCEO = 'CLEAR_CEO',
  ChangeCellType = 'CHANGE_CELL_TYPE',
  RenameCell = 'RENAME_CELL',
  UpdateThresholdsListColors = 'UPDATE_THRESHOLDS_LIST_COLORS',
  UpdateThresholdsListType = 'UPDATE_THRESHOLDS_LIST_TYPE',
  UpdateGaugeColors = 'UPDATE_GAUGE_COLORS',
  UpdateAxes = 'UPDATE_AXES',
  UpdateTableOptions = 'UPDATE_TABLE_OPTIONS',
  UpdateLineColors = 'UPDATE_LINE_COLORS',
  ChangeTimeFormat = 'CHANGE_TIME_FORMAT',
  ChangeDecimalPlaces = 'CHANGE_DECIMAL_PLACES',
  UpdateFieldOptions = 'UPDATE_FIELD_OPTIONS',
  UpdateQueryDrafts = 'UPDATE_QUERY_DRAFTS',
  UpdateQueryDraft = 'UPDATE_QUERY_DRAFT',
  UpdateCellNote = 'UPDATE_CELL_NOTE',
  UpdateCellNoteVisibility = 'UPDATE_CELL_NOTE_VISIBILITY',
  UpdateEditorTimeRange = 'UPDATE_EDITOR_TIME_RANGE',
}

export type Action =
  | LoadCEOAction
  | ClearCEOAction
  | ChangeCellTypeAction
  | RenameCellAction
  | UpdateThresholdsListColorsAction
  | UpdateThresholdsListTypeAction
  | UpdateGaugeColorsAction
  | UpdateAxesAction
  | UpdateTableOptionsAction
  | UpdateLineColorsAction
  | ChangeTimeFormatAction
  | ChangeDecimalPlacesAction
  | UpdateFieldOptionsAction
  | UpdateQueryDraftsAction
  | UpdateCellNoteAction
  | UpdateCellNoteVisibilityAction
  | UpdateEditorTimeRangeAction

export interface LoadCEOAction {
  type: ActionType.LoadCEO
  payload: {
    cell: Cell | NewDefaultCell
    timeRange: TimeRange
  }
}

export interface ClearCEOAction {
  type: ActionType.ClearCEO
}

export interface ChangeCellTypeAction {
  type: ActionType.ChangeCellType
  payload: {
    cellType: CellType
  }
}

export interface RenameCellAction {
  type: ActionType.RenameCell
  payload: {
    cellName: string
  }
}

export interface UpdateThresholdsListColorsAction {
  type: ActionType.UpdateThresholdsListColors
  payload: {
    thresholdsListColors: ColorNumber[]
  }
}

export interface UpdateThresholdsListTypeAction {
  type: ActionType.UpdateThresholdsListType
  payload: {
    thresholdsListType: ThresholdType
  }
}

export interface UpdateGaugeColorsAction {
  type: ActionType.UpdateGaugeColors
  payload: {
    gaugeColors: ColorNumber[]
  }
}

export interface UpdateAxesAction {
  type: ActionType.UpdateAxes
  payload: {
    axes: Axes
  }
}

export interface UpdateTableOptionsAction {
  type: ActionType.UpdateTableOptions
  payload: {
    tableOptions: TableOptions
  }
}

export interface UpdateLineColorsAction {
  type: ActionType.UpdateLineColors
  payload: {
    lineColors: ColorString[]
  }
}

export interface ChangeTimeFormatAction {
  type: ActionType.ChangeTimeFormat
  payload: {
    timeFormat: string
  }
}

export interface ChangeDecimalPlacesAction {
  type: ActionType.ChangeDecimalPlaces
  payload: {
    decimalPlaces: DecimalPlaces
  }
}

export interface UpdateFieldOptionsAction {
  type: ActionType.UpdateFieldOptions
  payload: {
    fieldOptions: FieldOption[]
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

export interface UpdateCellNoteAction {
  type: ActionType.UpdateCellNote
  payload: {
    note: string
  }
}

export interface UpdateCellNoteVisibilityAction {
  type: ActionType.UpdateCellNoteVisibility
  payload: {
    noteVisibility: NoteVisibility
  }
}

export interface UpdateEditorTimeRangeAction {
  type: ActionType.UpdateEditorTimeRange
  payload: {
    timeRange: TimeRange
  }
}

export const loadCEO = (
  cell: Cell | NewDefaultCell,
  timeRange: TimeRange
): LoadCEOAction => ({
  type: ActionType.LoadCEO,
  payload: {
    cell,
    timeRange,
  },
})

export const clearCEO = (): ClearCEOAction => ({
  type: ActionType.ClearCEO,
})

export const renameCell = (cellName: string): RenameCellAction => ({
  type: ActionType.RenameCell,
  payload: {
    cellName,
  },
})
