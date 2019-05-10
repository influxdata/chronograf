import {
  DEFAULT_VERTICAL_TIME_AXIS,
  DEFAULT_FIX_FIRST_COLUMN,
} from 'src/shared/constants/tableGraph'
import {QueryConfig} from 'src/types'
import {
  CellType,
  Dashboard,
  DecimalPlaces,
  SourceItemValue,
  NewDefaultCell,
  NoteVisibility,
} from 'src/types/dashboards'

export const UNTITLED_GRAPH: string = 'Untitled Graph'

export const TIME_FORMAT_TOOLTIP_LINK: string =
  'http://momentjs.com/docs/#/parsing/string-format/'

export const DEFAULT_DECIMAL_PLACES: DecimalPlaces = {
  isEnforced: true,
  digits: 3,
}

export interface TimeField {
  internalName: string
  displayName: string
  visible: boolean
}

export const DEFAULT_INFLUXQL_TIME_FIELD: TimeField = {
  internalName: 'time',
  displayName: '',
  visible: true,
}

export const DEFAULT_FLUX_TIME_FIELD: TimeField = {
  internalName: '_time',
  displayName: '',
  visible: true,
}

export const DEFAULT_TABLE_OPTIONS = {
  verticalTimeAxis: DEFAULT_VERTICAL_TIME_AXIS,
  sortBy: DEFAULT_INFLUXQL_TIME_FIELD,
  wrapping: 'truncate',
  fixFirstColumn: DEFAULT_FIX_FIRST_COLUMN,
}

export const DEFAULT_TIME_FORMAT: string = 'MM/DD/YYYY HH:mm:ss'
export const TIME_FORMAT_CUSTOM: string = 'Custom'

export const FORMAT_OPTIONS: Array<{text?: string; format: string}> = [
  {format: DEFAULT_TIME_FORMAT},
  {format: 'MM/DD/YYYY HH:mm:ss.SSS'},
  {format: 'YYYY-MM-DD HH:mm:ss'},
  {format: 'HH:mm:ss'},
  {format: 'HH:mm:ss.SSS'},
  {format: 'MMMM D, YYYY HH:mm:ss'},
  {format: 'dddd, MMMM D, YYYY HH:mm:ss'},
  {format: 'X', text: 'Unix Time'},
  {format: 'x', text: 'Unix Time (milliseconds)'},
  {format: TIME_FORMAT_CUSTOM},
]

export const DEFAULT_FIELD_OPTIONS = [DEFAULT_INFLUXQL_TIME_FIELD]

export const NEW_DEFAULT_DASHBOARD_CELL: NewDefaultCell = {
  x: 0,
  y: 0,
  w: 4,
  h: 4,
  name: UNTITLED_GRAPH,
  type: CellType.Line,
  queries: [],
  tableOptions: DEFAULT_TABLE_OPTIONS,
  timeFormat: DEFAULT_TIME_FORMAT,
  decimalPlaces: DEFAULT_DECIMAL_PLACES,
  fieldOptions: DEFAULT_FIELD_OPTIONS,
  inView: true,
  note: '',
  noteVisibility: NoteVisibility.Default,
}

interface EmptyDefaultDashboardCell {
  x: number
  y: number
  queries: QueryConfig[]
  name: string
  type: CellType
}
type EmptyDefaultDashboard = Pick<
  Dashboard,
  Exclude<keyof Dashboard, 'templates' | 'links' | 'organization' | 'cells'>
> & {
  cells: EmptyDefaultDashboardCell[]
}
export const EMPTY_DASHBOARD: EmptyDefaultDashboard = {
  id: 0,
  name: '',
  cells: [
    {
      x: 0,
      y: 0,
      queries: [],
      name: 'Loading...',
      type: CellType.Line,
    },
  ],
}

type NewDefaultDashboard = Pick<
  Dashboard,
  Exclude<keyof Dashboard, 'id' | 'templates' | 'organization' | 'cells'> & {
    cells: NewDefaultCell[]
  }
>
export const DEFAULT_DASHBOARD_NAME = 'Name This Dashboard'

export const NEW_DASHBOARD: NewDefaultDashboard = {
  name: DEFAULT_DASHBOARD_NAME,
  cells: [NEW_DEFAULT_DASHBOARD_CELL],
}

export const NEW_EMPTY_DASHBOARD: NewDefaultDashboard = {
  name: DEFAULT_DASHBOARD_NAME,
  cells: [],
}

export const TYPE_QUERY_CONFIG: string = 'queryConfig'
export const TYPE_SHIFTED: string = 'shifted queryConfig'
export const TYPE_FLUX: string = 'flux'
export const DASHBOARD_NAME_MAX_LENGTH: number = 50

export enum CEOTabs {
  Queries = 'Queries',
  Vis = 'Visualization',
}

export const MAX_TOLOCALESTRING_VAL = 20 // 20 is the max input to maximumFractionDigits in spec for tolocalestring
export const MIN_DECIMAL_PLACES = '0'
export const MAX_DECIMAL_PLACES = MAX_TOLOCALESTRING_VAL.toString()

// used in importing dashboards and mapping sources
export const DYNAMIC_SOURCE = 'dynamic'
export const DYNAMIC_SOURCE_INFO = {
  name: 'Dynamic Source',
  id: DYNAMIC_SOURCE,
  link: '',
}
export const DYNAMIC_SOURCE_ITEM: SourceItemValue = {
  text: 'Dynamic Source',
  sourceInfo: DYNAMIC_SOURCE_INFO,
  importedSourceID: '',
}

export const DEFAULT_CELL_BG_COLOR = '#292933'
export const DEFAULT_CELL_TEXT_COLOR = '#FFFFFF'
