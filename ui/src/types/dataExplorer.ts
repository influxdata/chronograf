import {
  ThresholdColor,
  GaugeColor,
  LineColor,
  ColorNumber,
  ColorString,
} from 'src/types/colors'
import {TimeRange, CellQuery, QueryStatus, CellType, Axes} from 'src/types'
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
  queryDrafts: CellQuery[]
  timeRange: TimeRange
  queryStatus: QueryStatus
  script: string
  sourceLink: string
  thresholdsListType: ThresholdType
  thresholdsListColors: ThresholdColor[]
  gaugeColors: GaugeColor[]
  lineColors: LineColor[]
  visType: CellType
  axes: Axes
  tableOptions: TableOptions
  timeFormat: string
  decimalPlaces: DecimalPlaces
  fieldOptions: FieldOption[]
  note: string
  noteVisibility: NoteVisibility
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
