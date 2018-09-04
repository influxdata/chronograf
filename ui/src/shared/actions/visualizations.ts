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
  CellNoteVisibility,
} from 'src/types/dashboards'

export const updateVisType = (
  cellType: CellType,
  stateToUpdate: QueryUpdateState
) => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.ChangeCellType
      : DEActionType.ChangeVisualizationType
  return {
    type,
    payload: {
      cellType,
    },
  }
}

export const updateNote = (note: string, stateToUpdate: QueryUpdateState) => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.UpdateCellNote
      : DEActionType.UpdateCellNote
  return {
    type,
    payload: {
      note,
    },
  }
}

export const updateNoteVisibility = (
  noteVisibility: CellNoteVisibility,
  stateToUpdate: QueryUpdateState
) => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.UpdateCellNoteVisibility
      : DEActionType.UpdateCellNoteVisibility
  return {
    type,
    payload: {
      noteVisibility,
    },
  }
}

export const updateThresholdsListColors = (
  thresholdsListColors: ColorNumber[],
  stateToUpdate: QueryUpdateState
) => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.UpdateThresholdsListColors
      : DEActionType.UpdateThresholdsListColors
  return {
    type,
    payload: {
      thresholdsListColors,
    },
  }
}

export const updateThresholdsListType = (
  thresholdsListType: ThresholdType,
  stateToUpdate: QueryUpdateState
) => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.UpdateThresholdsListType
      : DEActionType.UpdateThresholdsListType
  return {
    type,
    payload: {
      thresholdsListType,
    },
  }
}

export const updateGaugeColors = (
  gaugeColors: ColorNumber[],
  stateToUpdate: QueryUpdateState
) => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.UpdateGaugeColors
      : DEActionType.UpdateGaugeColors
  return {
    type,
    payload: {
      gaugeColors,
    },
  }
}

export const updateAxes = (axes: Axes, stateToUpdate: QueryUpdateState) => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.UpdateAxes
      : DEActionType.UpdateAxes
  return {
    type,
    payload: {
      axes,
    },
  }
}

export const updateTableOptions = (
  tableOptions: TableOptions,
  stateToUpdate: QueryUpdateState
) => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.UpdateTableOptions
      : DEActionType.UpdateTableOptions
  return {
    type,
    payload: {
      tableOptions,
    },
  }
}

export const updateLineColors = (
  lineColors: ColorString[],
  stateToUpdate: QueryUpdateState
) => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.UpdateLineColors
      : DEActionType.UpdateLineColors
  return {
    type,
    payload: {
      lineColors,
    },
  }
}

export const updateTimeFormat = (
  timeFormat: string,
  stateToUpdate: QueryUpdateState
) => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.ChangeTimeFormat
      : DEActionType.ChangeTimeFormat
  return {
    type,
    payload: {
      timeFormat,
    },
  }
}

export const updateDecimalPlaces = (
  decimalPlaces: DecimalPlaces,
  stateToUpdate: QueryUpdateState
) => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.ChangeDecimalPlaces
      : DEActionType.ChangeDecimalPlaces
  return {
    type,
    payload: {
      decimalPlaces,
    },
  }
}

export const updateFieldOptions = (
  fieldOptions: FieldOption[],
  stateToUpdate: QueryUpdateState
) => {
  const type =
    stateToUpdate === QueryUpdateState.CEO
      ? CEOActionType.UpdateFieldOptions
      : DEActionType.UpdateFieldOptions
  return {
    type,
    payload: {
      fieldOptions,
    },
  }
}
