// Constants
import {QueryUpdateState} from 'src/shared/actions/queries'

// Types
import {ActionType as CEOActionType} from 'src/dashboards/actions/cellEditorOverlay'
import {ActionType as DEActionType} from 'src/data_explorer/actions/queries'

import {ColorNumber, ColorString} from 'src/types/colors'
import {
  DecimalPlaces,
  FieldOption,
  Axes,
  CellType,
  ThresholdType,
  TableOptions,
  NoteVisibility,
} from 'src/types/dashboards'

export interface ChangeVisualizationTypeAction {
  type: CEOActionType.ChangeCellType | DEActionType.ChangeVisualizationType
  payload: {
    cellType: CellType
  }
}

export interface UpdateThresholdsListColorsAction {
  type:
    | CEOActionType.UpdateThresholdsListColors
    | DEActionType.UpdateThresholdsListColors
  payload: {
    thresholdsListColors: ColorNumber[]
  }
}

export interface UpdateThresholdsListTypeAction {
  type:
    | CEOActionType.UpdateThresholdsListType
    | DEActionType.UpdateThresholdsListType
  payload: {
    thresholdsListType: ThresholdType
  }
}

export interface UpdateGaugeColorsAction {
  type: CEOActionType.UpdateGaugeColors | DEActionType.UpdateGaugeColors
  payload: {
    gaugeColors: ColorNumber[]
  }
}

export interface UpdateAxesAction {
  type: CEOActionType.UpdateAxes | DEActionType.UpdateAxes
  payload: {
    axes: Axes
  }
}

export interface UpdateTableOptionsAction {
  type: CEOActionType.UpdateTableOptions | DEActionType.UpdateTableOptions
  payload: {
    tableOptions: TableOptions
  }
}

export interface UpdateLineColorsAction {
  type: CEOActionType.UpdateLineColors | DEActionType.UpdateLineColors
  payload: {
    lineColors: ColorString[]
  }
}

export interface ChangeTimeFormatAction {
  type: CEOActionType.ChangeTimeFormat | DEActionType.ChangeTimeFormat
  payload: {
    timeFormat: string
  }
}

export interface ChangeDecimalPlacesAction {
  type: CEOActionType.ChangeDecimalPlaces | DEActionType.ChangeDecimalPlaces
  payload: {
    decimalPlaces: DecimalPlaces
  }
}

export interface UpdateFieldOptionsAction {
  type: CEOActionType.UpdateFieldOptions | DEActionType.UpdateFieldOptions
  payload: {
    fieldOptions: FieldOption[]
  }
}

export interface UpdateNoteAction {
  type: CEOActionType.UpdateCellNote | DEActionType.UpdateNote
  payload: {
    note: string
  }
}

export interface UpdateNoteVisibilityAction {
  type:
    | CEOActionType.UpdateCellNoteVisibility
    | DEActionType.UpdateNoteVisibility
  payload: {
    noteVisibility: NoteVisibility
  }
}

export const updateVisType = (
  cellType: CellType,
  stateToUpdate: QueryUpdateState
): ChangeVisualizationTypeAction => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.ChangeCellType
      : DEActionType.ChangeVisualizationType
  return {
    type,
    payload: {
      cellType,
    },
  } as ChangeVisualizationTypeAction
}

export const updateNote = (
  note: string,
  stateToUpdate: QueryUpdateState
): UpdateNoteAction => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.UpdateCellNote
      : DEActionType.UpdateNote
  return {
    type,
    payload: {
      note,
    },
  } as UpdateNoteAction
}

export const updateNoteVisibility = (
  noteVisibility: NoteVisibility,
  stateToUpdate: QueryUpdateState
): UpdateNoteVisibilityAction => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.UpdateCellNoteVisibility
      : DEActionType.UpdateNoteVisibility
  return {
    type,
    payload: {
      noteVisibility,
    },
  } as UpdateNoteVisibilityAction
}

export const updateThresholdsListColors = (
  thresholdsListColors: ColorNumber[],
  stateToUpdate: QueryUpdateState
): UpdateThresholdsListColorsAction => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.UpdateThresholdsListColors
      : DEActionType.UpdateThresholdsListColors
  return {
    type,
    payload: {
      thresholdsListColors,
    },
  } as UpdateThresholdsListColorsAction
}

export const updateThresholdsListType = (
  thresholdsListType: ThresholdType,
  stateToUpdate: QueryUpdateState
): UpdateThresholdsListTypeAction => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.UpdateThresholdsListType
      : DEActionType.UpdateThresholdsListType
  return {
    type,
    payload: {
      thresholdsListType,
    },
  } as UpdateThresholdsListTypeAction
}

export const updateGaugeColors = (
  gaugeColors: ColorNumber[],
  stateToUpdate: QueryUpdateState
): UpdateGaugeColorsAction => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.UpdateGaugeColors
      : DEActionType.UpdateGaugeColors
  return {
    type,
    payload: {
      gaugeColors,
    },
  } as UpdateGaugeColorsAction
}

export const updateAxes = (
  axes: Axes,
  stateToUpdate: QueryUpdateState
): UpdateAxesAction => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.UpdateAxes
      : DEActionType.UpdateAxes
  return {
    type,
    payload: {
      axes,
    },
  } as UpdateAxesAction
}

export const updateTableOptions = (
  tableOptions: TableOptions,
  stateToUpdate: QueryUpdateState
): UpdateTableOptionsAction => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.UpdateTableOptions
      : DEActionType.UpdateTableOptions
  return {
    type,
    payload: {
      tableOptions,
    },
  } as UpdateTableOptionsAction
}

export const updateLineColors = (
  lineColors: ColorString[],
  stateToUpdate: QueryUpdateState
): UpdateLineColorsAction => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.UpdateLineColors
      : DEActionType.UpdateLineColors
  return {
    type,
    payload: {
      lineColors,
    },
  } as UpdateLineColorsAction
}

export const updateTimeFormat = (
  timeFormat: string,
  stateToUpdate: QueryUpdateState
): ChangeTimeFormatAction => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.ChangeTimeFormat
      : DEActionType.ChangeTimeFormat
  return {
    type,
    payload: {
      timeFormat,
    },
  } as ChangeTimeFormatAction
}

export const updateDecimalPlaces = (
  decimalPlaces: DecimalPlaces,
  stateToUpdate: QueryUpdateState
): ChangeDecimalPlacesAction => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.ChangeDecimalPlaces
      : DEActionType.ChangeDecimalPlaces
  return {
    type,
    payload: {
      decimalPlaces,
    },
  } as ChangeDecimalPlacesAction
}

export const updateFieldOptions = (
  fieldOptions: FieldOption[],
  stateToUpdate: QueryUpdateState
): UpdateFieldOptionsAction => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.UpdateFieldOptions
      : DEActionType.UpdateFieldOptions
  return {
    type,
    payload: {
      fieldOptions,
    },
  } as UpdateFieldOptionsAction
}
