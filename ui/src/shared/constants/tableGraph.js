export const DEFAULT_COLUMN_WIDTH = 300
export const DEFAULT_ROW_HEIGHT = 30
export const COLUMN_PADDING = 32
export const ROW_PADDING = 16

export const TABLE_TEXT_SINGLE_LINE = 'single-line'
export const TABLE_TEXT_WRAP = 'wrap'
export const TABLE_TEXT_TRUNCATE = 'truncate'

export const NULL_COLUMN_INDEX = -1
export const NULL_ROW_INDEX = -1

export const NULL_HOVER_TIME = '0'

export const TIME_FORMAT_DEFAULT = 'MM/DD/YYYY HH:mm:ss.ss'
export const TIME_FORMAT_CUSTOM = 'Custom'

export const FORMAT_OPTIONS = [
  {text: TIME_FORMAT_DEFAULT},
  {text: 'MM/DD/YYYY HH:mm'},
  {text: 'MM/DD/YYYY'},
  {text: 'h:mm:ss A'},
  {text: 'h:mm A'},
  {text: 'MMMM D, YYYY'},
  {text: 'MMMM D, YYYY h:mm A'},
  {text: 'dddd, MMMM D, YYYY h:mm A'},
  {text: TIME_FORMAT_CUSTOM},
]

export const DEFAULT_TABLE_OPTIONS = {
  timeFormat: 'MM/DD/YYYY HH:mm:ss.ss',
  verticalTimeAxis: true,
  sortBy: {internalName: 'time', displayName: ''},
  wrapping: 'truncate',
  columnNames: [{internalName: 'time', displayName: ''}],
}

export const initializeOptions = cellType => {
  switch (cellType) {
    case 'table':
      return DEFAULT_TABLE_OPTIONS
    default:
      return {}
  }
}
