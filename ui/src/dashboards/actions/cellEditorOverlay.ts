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
} from 'src/types/dashboards'
import {
  Status,
  Field,
  GroupBy,
  Tag,
  TimeShift,
  ApplyFuncsToFieldArgs,
} from 'src/types'
import {CEOInitialState} from 'src/dashboards/reducers/cellEditorOverlay'

interface State {
  cellEditorOverlay: CEOInitialState
}

type GetState = () => State

export enum ActionType {
  LoadCellForCEO = 'LOAD_CELL_FOR_CEO',
  ClearCellFromCEO = 'CLEAR_CELL_FROM_CEO',
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
}

export type Action =
  | LoadCellForCEOAction
  | ClearCellFromCEOAction
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

export interface LoadCellForCEOAction {
  type: ActionType.LoadCellForCEO
  payload: {
    cell: Cell | NewDefaultCell
  }
}

export interface ClearCellFromCEOAction {
  type: ActionType.ClearCellFromCEO
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

export const loadCellForCEO = (
  cell: Cell | NewDefaultCell
): LoadCellForCEOAction => ({
  type: ActionType.LoadCellForCEO,
  payload: {
    cell,
  },
})

export const clearCellFromCEO = (): ClearCellFromCEOAction => ({
  type: ActionType.ClearCellFromCEO,
})

export const changeCellType = (cellType: CellType): ChangeCellTypeAction => ({
  type: ActionType.ChangeCellType,
  payload: {
    cellType,
  },
})

export const renameCell = (cellName: string): RenameCellAction => ({
  type: ActionType.RenameCell,
  payload: {
    cellName,
  },
})

export const updateThresholdsListColors = (
  thresholdsListColors: ColorNumber[]
): UpdateThresholdsListColorsAction => ({
  type: ActionType.UpdateThresholdsListColors,
  payload: {
    thresholdsListColors,
  },
})

export const updateThresholdsListType = (
  thresholdsListType: ThresholdType
): UpdateThresholdsListTypeAction => ({
  type: ActionType.UpdateThresholdsListType,
  payload: {
    thresholdsListType,
  },
})

export const updateGaugeColors = (
  gaugeColors: ColorNumber[]
): UpdateGaugeColorsAction => ({
  type: ActionType.UpdateGaugeColors,
  payload: {
    gaugeColors,
  },
})

export const updateAxes = (axes: Axes): UpdateAxesAction => ({
  type: ActionType.UpdateAxes,
  payload: {
    axes,
  },
})

export const updateTableOptions = (
  tableOptions: TableOptions
): UpdateTableOptionsAction => ({
  type: ActionType.UpdateTableOptions,
  payload: {
    tableOptions,
  },
})

export const updateLineColors = (
  lineColors: ColorString[]
): UpdateLineColorsAction => ({
  type: ActionType.UpdateLineColors,
  payload: {
    lineColors,
  },
})

export const changeTimeFormat = (
  timeFormat: string
): ChangeTimeFormatAction => ({
  type: ActionType.ChangeTimeFormat,
  payload: {
    timeFormat,
  },
})

export const changeDecimalPlaces = (
  decimalPlaces: DecimalPlaces
): ChangeDecimalPlacesAction => ({
  type: ActionType.ChangeDecimalPlaces,
  payload: {
    decimalPlaces,
  },
})

export const updateFieldOptions = (
  fieldOptions: FieldOption[]
): UpdateFieldOptionsAction => ({
  type: ActionType.UpdateFieldOptions,
  payload: {
    fieldOptions,
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
    cellEditorOverlay: {queryDrafts},
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
    cellEditorOverlay: {queryDrafts},
  } = getState()

  const updatedQueryDrafts = queryDrafts.filter(query => query.id !== queryID)
  dispatch(updateQueryDrafts(updatedQueryDrafts))
}

export const toggleFieldAsync = (queryID: string, fieldFunc: Field) => async (
  dispatch,
  getState: GetState
) => {
  const {
    cellEditorOverlay: {queryDrafts},
  } = getState()

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = {
        ...toggleField(query.queryConfig, fieldFunc),
        rawText: null,
      }

      return {...query, queryConfig: nextQueryConfig}
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
    cellEditorOverlay: {queryDrafts},
  } = getState()

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = groupByTime(query.queryConfig, time)

      return {...query, queryConfig: nextQueryConfig}
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
    cellEditorOverlay: {queryDrafts},
  } = getState()

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = fill(query.queryConfig, value)

      return {...query, queryConfig: nextQueryConfig}
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
    cellEditorOverlay: {queryDrafts},
  } = getState()

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = removeFuncs(query.queryConfig, fields)

      return {...query, queryConfig: nextQueryConfig}
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
    cellEditorOverlay: {queryDrafts},
  } = getState()

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = applyFuncsToField(
        query.queryConfig,
        fieldFunc,
        groupBy
      )

      return {...query, queryConfig: nextQueryConfig}
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
    cellEditorOverlay: {queryDrafts},
  } = getState()

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = chooseTag(query.queryConfig, tag)

      return {...query, queryConfig: nextQueryConfig}
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
    cellEditorOverlay: {queryDrafts},
  } = getState()

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = chooseNamespace(query.queryConfig, {
        database,
        retentionPolicy,
      })
      return {...query, queryConfig: nextQueryConfig}
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
    cellEditorOverlay: {queryDrafts},
  } = getState()

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = {
        ...chooseMeasurement(query.queryConfig, measurement),
        rawText: getDeep<string>(query, 'queryConfig.rawText', ''),
      }
      return {...query, queryConfig: nextQueryConfig}
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
    cellEditorOverlay: {queryDrafts},
  } = getState()

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = groupByTag(query.queryConfig, tagKey)
      return {...query, queryConfig: nextQueryConfig}
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
    cellEditorOverlay: {queryDrafts},
  } = getState()

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = toggleTagAcceptance(query.queryConfig)
      return {...query, queryConfig: nextQueryConfig}
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
    cellEditorOverlay: {queryDrafts},
  } = getState()

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = addInitialField(query.queryConfig, field, groupBy)
      return {...query, queryConfig: nextQueryConfig}
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
    cellEditorOverlay: {queryDrafts},
  } = getState()

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = {...query.queryConfig, status}
      return {...query, queryConfig: nextQueryConfig}
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
    cellEditorOverlay: {queryDrafts},
  } = getState()

  const updatedQueryDrafts = queryDrafts.map(query => {
    if (query.id === queryID) {
      const nextQueryConfig = timeShift(query.queryConfig, shift)
      return {...query, queryConfig: nextQueryConfig}
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
