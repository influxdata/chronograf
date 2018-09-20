// Types
import {ColorNumber, ColorString} from 'src/types/colors'
import {TimeRange, CellQuery, Status, CellType, Axes} from 'src/types'
import {
  DecimalPlaces,
  FieldOption,
  ThresholdType,
  TableOptions,
  NoteVisibility,
} from 'src/types/dashboards'
import {DEState} from 'src/types/dataExplorer'
import {GeoRequest} from 'src/types/geo'

export interface State {
  dataExplorer: DEState
}

export enum ActionType {
  LoadDE = 'LOAD_DE',
  UpdateQueryDrafts = 'DE_UPDATE_QUERY_DRAFTS',
  UpdateEditorTimeRange = 'DE_UPDATE_EDITOR_TIME_RANGE',
  UpdateQueryStatus = 'DE_UPDATE_QUERY_STATUS',
  UpdateScript = 'DE_UPDATE_SCRIPT',
  UpdateSourceLink = 'DE_UPDATE_SOURCE_LINK',
  ChangeVisualizationType = 'DE_CHANGE_Visualization_TYPE',
  UpdateThresholdsListColors = 'DE_UPDATE_THRESHOLDS_LIST_COLORS',
  UpdateThresholdsListType = 'DE_UPDATE_THRESHOLDS_LIST_TYPE',
  UpdateGaugeColors = 'DE_UPDATE_GAUGE_COLORS',
  UpdateAxes = 'DE_UPDATE_AXES',
  UpdateGeoImage = 'DE_UPDATE_GEO_IMAGE',
  UpdateTableOptions = 'DE_UPDATE_TABLE_OPTIONS',
  UpdateLineColors = 'DE_UPDATE_LINE_COLORS',
  ChangeTimeFormat = 'DE_CHANGE_TIME_FORMAT',
  ChangeDecimalPlaces = 'DE_CHANGE_DECIMAL_PLACES',
  UpdateFieldOptions = 'DE_UPDATE_FIELD_OPTIONS',
  UpdateQueryDraft = 'DE_UPDATE_QUERY_DRAFT',
  UpdateNote = 'DE_UPDATE_NOTE',
  UpdateNoteVisibility = 'DE_UPDATE_NOTE_VISIBILITY',
}

export type Action =
  | LoadDEAction
  | UpdateEditorTimeRangeAction
  | UpdateQueryDraftsAction
  | UpdateQueryStatusAction
  | UpdateScriptAction
  | UpdateSourceLinkAction
  | ChangeVisualizationTypeAction
  | UpdateThresholdsListColorsAction
  | UpdateThresholdsListTypeAction
  | UpdateGaugeColorsAction
  | UpdateAxesAction
  | UpdateGeoImageAction
  | UpdateTableOptionsAction
  | UpdateLineColorsAction
  | ChangeTimeFormatAction
  | ChangeDecimalPlacesAction
  | UpdateFieldOptionsAction
  | UpdateCellNoteAction
  | UpdateCellNoteVisibilityAction

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

export interface ChangeVisualizationTypeAction {
  type: ActionType.ChangeVisualizationType
  payload: {
    cellType: CellType
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

export interface UpdateGeoImage {
  type: ActionType.UpdateGeoImage
  payload: {
    geoRequest: GeoRequest
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

export interface UpdateCellNoteAction {
  type: ActionType.UpdateNote
  payload: {
    note: string
  }
}

export interface UpdateCellNoteVisibilityAction {
  type: ActionType.UpdateNoteVisibility
  payload: {
    noteVisibility: NoteVisibility
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
