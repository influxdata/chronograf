import {ThresholdColor, GaugeColor, LineColor} from 'src/types/colors'
import {TimeRange, CellQuery, QueryStatus, CellType, Axes} from 'src/types'
import {
  DecimalPlaces,
  FieldOption,
  ThresholdType,
  TableOptions,
  CellNoteVisibility,
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
  noteVisibility: CellNoteVisibility
}
