import {ColorNumber, ColorString} from 'src/types/colors'
import {CellType, Axes, Status} from 'src/types'
import {
  DecimalPlaces,
  FieldOption,
  ThresholdType,
  TableOptions,
  NoteVisibility,
} from 'src/types/dashboards'

// Write Data Modes
export enum WriteDataMode {
  Manual = 'Manual Entry',
  File = 'File Upload',
}

export interface DEState {
  sourceLink: string
  queryStatus: {
    queryID: string | null
    status: Status
  }
}

export interface VisualizationOptions {
  type: CellType
  axes: Axes | null
  tableOptions: TableOptions
  fieldOptions: FieldOption[]
  timeFormat: string
  decimalPlaces: DecimalPlaces
  note: string
  noteVisibility: NoteVisibility
  thresholdsListColors: ColorNumber[]
  thresholdsListType: ThresholdType
  gaugeColors: ColorNumber[]
  lineColors: ColorString[]
}

export enum QueryUpdateState {
  CEO = 'cellEditorOverlay',
  DE = 'dataExplorer',
}
