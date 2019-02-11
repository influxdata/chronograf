import _ from 'lodash'
import {fastMap, fastReduce, fastFilter} from 'src/utils/fast'

import {CELL_HORIZONTAL_PADDING} from 'src/shared/constants/tableGraph'
import {
  DEFAULT_INFLUXQL_TIME_FIELD,
  DEFAULT_FLUX_TIME_FIELD,
  DEFAULT_TIME_FORMAT,
} from 'src/dashboards/constants'
import {
  Sort,
  FieldOption,
  TableOptions,
  DecimalPlaces,
} from 'src/types/dashboards'
import {TimeSeriesValue, InfluxQLQueryType} from 'src/types/series'
import {DataType} from 'src/shared/constants'
import {isTruncatedNumber, toFixed} from 'src/shared/utils/decimalPlaces'

const calculateSize = (message: string): number => {
  return message.length * 7
}

export interface ColumnWidths {
  totalWidths: number
  widths: {[x: string]: number}
}

interface SortedLabel {
  label: string
  responseIndex: number
  seriesIndex: number
}

interface TransformTableDataReturnType {
  transformedData: TimeSeriesValue[][]
  sortedTimeVals: TimeSeriesValue[]
  columnWidths: ColumnWidths
}

export enum ErrorTypes {
  MetaQueryCombo = 'MetaQueryCombo',
  GeneralError = 'Error',
}

export const getInvalidDataMessage = (errorType: ErrorTypes): string => {
  switch (errorType) {
    case ErrorTypes.MetaQueryCombo:
      return 'Cannot display data for meta queries mixed with data queries'
    default:
      return null
  }
}

const calculateTimeColumnWidth = (timeFormat: string): number => {
  // Force usage of longest format names for ideal measurement
  timeFormat = _.replace(timeFormat, 'MMMM', 'September')
  timeFormat = _.replace(timeFormat, 'dddd', 'Wednesday')
  timeFormat = _.replace(timeFormat, 'A', 'AM')
  timeFormat = _.replace(timeFormat, 'h', '00')
  timeFormat = _.replace(timeFormat, 'X', '1522286058')
  timeFormat = _.replace(timeFormat, 'x', '1536106867461')

  const width = calculateSize(timeFormat)

  return width + CELL_HORIZONTAL_PADDING
}

const updateMaxWidths = (
  row: TimeSeriesValue[],
  maxColumnWidths: ColumnWidths,
  topRow: TimeSeriesValue[],
  isTopRow: boolean,
  fieldOptions: FieldOption[],
  timeFormatWidth: number,
  verticalTimeAxis: boolean,
  decimalPlaces: DecimalPlaces
): ColumnWidths => {
  const maxWidths = fastReduce<TimeSeriesValue>(
    row,
    (acc: ColumnWidths, col: TimeSeriesValue, c: number) => {
      const isLabel =
        (verticalTimeAxis && isTopRow) || (!verticalTimeAxis && c === 0)

      const foundField =
        isLabel && _.isString(col)
          ? fieldOptions.find(field => field.internalName === col)
          : null

      let colValue = `${col}`
      if (foundField && foundField.displayName) {
        colValue = foundField.displayName
      } else if (isTruncatedNumber(col, decimalPlaces)) {
        colValue = toFixed(col, decimalPlaces)
      }

      const columnLabel = topRow[c]
      const isTimeColumn =
        columnLabel === DEFAULT_INFLUXQL_TIME_FIELD.internalName ||
        columnLabel === DEFAULT_FLUX_TIME_FIELD.internalName

      const isTimeRow =
        topRow[0] === DEFAULT_INFLUXQL_TIME_FIELD.internalName ||
        topRow[0] === DEFAULT_FLUX_TIME_FIELD.internalName

      const useTimeWidth =
        (isTimeColumn && verticalTimeAxis && !isTopRow) ||
        (!verticalTimeAxis && isTopRow && isTimeRow && c !== 0)

      const currentWidth = useTimeWidth
        ? timeFormatWidth
        : calculateSize(colValue.toString().trim()) + CELL_HORIZONTAL_PADDING

      const {widths: Widths} = maxColumnWidths
      const maxWidth = _.get(Widths, `${columnLabel}`, 0)

      if (isTopRow || currentWidth > maxWidth) {
        acc.widths[columnLabel] = currentWidth
        acc.totalWidths += currentWidth - maxWidth
      }

      return acc
    },
    {...maxColumnWidths}
  )

  return maxWidths
}

export const getDefaultTimeField = (dataType: DataType): FieldOption => {
  if (dataType === DataType.flux) {
    return DEFAULT_FLUX_TIME_FIELD
  }

  return DEFAULT_INFLUXQL_TIME_FIELD
}

export const computeFieldOptions = (
  existingFieldOptions: FieldOption[],
  sortedLabels: SortedLabel[],
  dataType: DataType,
  influxQLQueryType: InfluxQLQueryType
): FieldOption[] => {
  const defaultTimeField = getDefaultTimeField(dataType)

  let astNames = []
  if (
    dataType === DataType.influxQL &&
    influxQLQueryType === InfluxQLQueryType.DataQuery
  ) {
    astNames = [defaultTimeField]
  }

  sortedLabels.forEach(({label}) => {
    const field: FieldOption = {
      internalName: label,
      displayName: '',
      visible: true,
    }
    astNames = [...astNames, field]
  })

  if (
    dataType === DataType.influxQL &&
    influxQLQueryType === InfluxQLQueryType.MetaQuery
  ) {
    return astNames
  }

  const intersection = existingFieldOptions.filter(f => {
    return astNames.find(a => a.internalName === f.internalName)
  })

  const newFields = astNames.filter(a => {
    return !existingFieldOptions.find(f => f.internalName === a.internalName)
  })

  return [...intersection, ...newFields]
}

export const calculateColumnWidths = (
  data: TimeSeriesValue[][],
  fieldOptions: FieldOption[],
  timeFormat: string,
  verticalTimeAxis: boolean,
  decimalPlaces: DecimalPlaces
): ColumnWidths => {
  const timeFormatWidth = calculateTimeColumnWidth(
    timeFormat === '' ? DEFAULT_TIME_FORMAT : timeFormat
  )

  return fastReduce<TimeSeriesValue[], ColumnWidths>(
    data,
    (acc: ColumnWidths, row: TimeSeriesValue[], r: number) => {
      return updateMaxWidths(
        row,
        acc,
        data[0],
        r === 0,
        fieldOptions,
        timeFormatWidth,
        verticalTimeAxis,
        decimalPlaces
      )
    },
    {widths: {}, totalWidths: 0}
  )
}

export const filterTableColumns = (
  data: TimeSeriesValue[][],
  fieldOptions: FieldOption[]
): TimeSeriesValue[][] => {
  const visibility = {}
  const filteredData = fastMap<TimeSeriesValue[], TimeSeriesValue[]>(
    data,
    (row, i) => {
      return fastFilter<TimeSeriesValue>(row, (col, j) => {
        if (i === 0) {
          const foundField = fieldOptions.find(
            field => field.internalName === col
          )
          visibility[j] = foundField ? foundField.visible : true
        }
        return visibility[j]
      })
    }
  )
  return filteredData[0].length ? filteredData : [[]]
}

export const orderTableColumns = (
  data: TimeSeriesValue[][],
  fieldOptions: FieldOption[]
): TimeSeriesValue[][] => {
  const fieldsSortOrder = fieldOptions.map(fieldOption => {
    return _.findIndex(data[0], dataLabel => {
      return dataLabel === fieldOption.internalName
    })
  })

  const filteredFieldSortOrder = fieldsSortOrder.filter(f => f !== -1)

  const orderedData = fastMap<TimeSeriesValue[], TimeSeriesValue[]>(
    data,
    (row: TimeSeriesValue[]): TimeSeriesValue[] => {
      return row.map((__, j, arr) => arr[filteredFieldSortOrder[j]])
    }
  )
  return orderedData[0].length ? orderedData : [[]]
}

export const sortTableData = (
  data: TimeSeriesValue[][],
  sort: Sort
): {sortedData: TimeSeriesValue[][]; sortedTimeVals: TimeSeriesValue[]} => {
  const sortIndex = _.indexOf(data[0], sort.field)
  const dataValues = _.drop(data, 1)
  const sortedData = [
    data[0],
    ..._.orderBy<TimeSeriesValue[][]>(dataValues, sortIndex, [sort.direction]),
  ] as TimeSeriesValue[][]
  const sortedTimeVals = fastMap<TimeSeriesValue[], TimeSeriesValue>(
    sortedData,
    (r: TimeSeriesValue[]): TimeSeriesValue => r[0]
  )
  return {sortedData, sortedTimeVals}
}

export const transformTableData = (
  data: TimeSeriesValue[][],
  sort: Sort,
  fieldOptions: FieldOption[],
  tableOptions: TableOptions,
  timeFormat: string,
  decimalPlaces: DecimalPlaces
): TransformTableDataReturnType => {
  const {verticalTimeAxis} = tableOptions

  const {sortedData, sortedTimeVals} = sortTableData(data, sort)
  const filteredData = filterTableColumns(sortedData, fieldOptions)
  const orderedData = orderTableColumns(filteredData, fieldOptions)
  const transformedData = verticalTimeAxis ? orderedData : _.unzip(orderedData)
  const columnWidths = calculateColumnWidths(
    transformedData,
    fieldOptions,
    timeFormat,
    verticalTimeAxis,
    decimalPlaces
  )

  return {transformedData, sortedTimeVals, columnWidths}
}

/*
  Checks whether an input value of arbitrary type can be parsed into a
  number. Note that there are two different `isNaN` checks, since

  - `Number('')` is 0
  - `Number('02abc')` is NaN
  - `parseFloat('')` is NaN
  - `parseFloat('02abc')` is 2

*/
export const isNumerical = <T>(x: T | string): x is string =>
  !isNaN(Number(x)) && !isNaN(parseFloat(x as string))

export const formatNumericCell = (
  cellData: string,
  decimalPlaces: DecimalPlaces
) => {
  const cellValue = parseFloat(cellData)

  if (isTruncatedNumber(cellValue, decimalPlaces)) {
    return toFixed(cellValue, decimalPlaces)
  }

  return `${cellValue}`
}
