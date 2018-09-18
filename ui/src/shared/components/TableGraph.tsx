// Libraries
import React, {PureComponent} from 'react'
import _ from 'lodash'
import classnames from 'classnames'
import {connect} from 'react-redux'
import moment from 'moment'
import {ColumnSizer, SizedColumnProps, AutoSizer} from 'react-virtualized'

// Components
import {MultiGrid, PropsMultiGrid} from 'src/shared/components/MultiGrid'
import InvalidData from 'src/shared/components/InvalidData'

// Utils
import {fastReduce} from 'src/utils/fast'
import {timeSeriesToTableGraph} from 'src/utils/timeSeriesTransformers'
import {
  computeFieldOptions,
  getDefaultTimeField,
} from 'src/dashboards/utils/tableGraph'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {manager} from 'src/worker/JobManager'

// Constants
import {
  ASCENDING,
  DESCENDING,
  NULL_HOVER_TIME,
  NULL_ARRAY_INDEX,
  DEFAULT_FIX_FIRST_COLUMN,
  DEFAULT_VERTICAL_TIME_AXIS,
  DEFAULT_SORT_DIRECTION,
} from 'src/shared/constants/tableGraph'
import {generateThresholdsListHexs} from 'src/shared/constants/colorOperations'
import {DataType} from 'src/shared/constants'

// Types
import {
  TimeSeriesServerResponse,
  TimeSeriesValue,
  TimeSeriesToTableGraphReturnType,
  InfluxQLQueryType,
} from 'src/types/series'
import {ColorString} from 'src/types/colors'
import {
  TableOptions,
  FieldOption,
  DecimalPlaces,
  Sort,
} from 'src/types/dashboards'
import {FluxTable, QueryUpdateState} from 'src/types'

const COLUMN_MIN_WIDTH = 100
const ROW_HEIGHT = 30

interface Label {
  label: string
  seriesIndex: number
  responseIndex: number
}

interface CellRendererProps {
  columnIndex: number
  rowIndex: number
  key: string
  parent: React.Component<PropsMultiGrid>
  style: React.CSSProperties
}

enum ErrorTypes {
  MetaQueryCombo = 'MetaQueryCombo',
  GeneralError = 'Error',
}

interface Props {
  data: TimeSeriesServerResponse[] | FluxTable
  dataType: DataType
  tableOptions: TableOptions
  timeFormat: string
  decimalPlaces: DecimalPlaces
  fieldOptions: FieldOption[]
  hoverTime: string
  handleSetHoverTime?: (hovertime: string) => void
  colors: ColorString[]
  editorLocation?: QueryUpdateState
  onUpdateFieldOptions?: (fieldOptions: FieldOption[]) => void
}

interface State {
  data: TimeSeriesValue[][]
  transformedData: TimeSeriesValue[][]
  sortedTimeVals: TimeSeriesValue[]
  sortedLabels: Label[]
  influxQLQueryType: InfluxQLQueryType
  hoveredColumnIndex: number
  hoveredRowIndex: number
  timeColumnWidth: number
  sort: Sort
  columnWidths: {[x: string]: number}
  totalColumnWidths: number
  isTimeVisible: boolean
  shouldResize: boolean
  invalidDataError: ErrorTypes
}

@ErrorHandling
class TableGraph extends PureComponent<Props, State> {
  private gridContainer: HTMLDivElement
  private multiGrid?: MultiGrid
  private isComponentMounted: boolean = false

  constructor(props: Props) {
    super(props)

    const sortField: string = _.get(
      this.props,
      'tableOptions.sortBy.internalName',
      ''
    )

    this.state = {
      shouldResize: false,
      data: [[]],
      transformedData: [[]],
      sortedTimeVals: [],
      sortedLabels: [],
      influxQLQueryType: InfluxQLQueryType.DataQuery,
      hoveredColumnIndex: NULL_ARRAY_INDEX,
      hoveredRowIndex: NULL_ARRAY_INDEX,
      sort: {field: sortField, direction: DEFAULT_SORT_DIRECTION},
      columnWidths: {},
      totalColumnWidths: 0,
      isTimeVisible: true,
      timeColumnWidth: 0,
      invalidDataError: null,
    }
  }

  public render() {
    const {transformedData} = this.state

    const columnCount = _.get(transformedData, ['0', 'length'], 0)
    const rowCount = columnCount === 0 ? 0 : transformedData.length
    const fixedColumnCount = this.fixFirstColumn && columnCount > 1 ? 1 : 0
    const {scrollToColumn, scrollToRow} = this.scrollToColRow

    if (this.state.invalidDataError) {
      return <InvalidData message={this.invalidDataMessage} />
    }

    return (
      <div
        className={this.tableContainerClassName}
        ref={gridContainer => (this.gridContainer = gridContainer)}
        onMouseLeave={this.handleMouseLeave}
      >
        {rowCount > 0 && (
          <AutoSizer>
            {({width, height}) => (
              <ColumnSizer
                columnCount={this.computedColumnCount}
                columnMinWidth={COLUMN_MIN_WIDTH}
                width={width}
              >
                {({
                  adjustedWidth,
                  columnWidth,
                  registerChild,
                }: SizedColumnProps) => (
                  <MultiGrid
                    onMount={this.handleMultiGridMount}
                    ref={registerChild}
                    columnCount={columnCount}
                    columnWidth={this.calculateColumnWidth(columnWidth)}
                    scrollToRow={scrollToRow}
                    scrollToColumn={scrollToColumn}
                    rowCount={rowCount}
                    rowHeight={ROW_HEIGHT}
                    height={height}
                    width={adjustedWidth}
                    fixedColumnCount={fixedColumnCount}
                    fixedRowCount={1}
                    cellRenderer={this.cellRenderer}
                    classNameBottomRightGrid="table-graph--scroll-window"
                  />
                )}
              </ColumnSizer>
            )}
          </AutoSizer>
        )}
      </div>
    )
  }

  public handleMultiGridMount = (ref: MultiGrid) => {
    this.multiGrid = ref
    ref.forceUpdate()
  }

  public componentWillUnmount() {
    this.isComponentMounted = false
    window.removeEventListener('resize', this.handleResize)
  }

  public get timeField() {
    const {fieldOptions} = this.props

    return _.find(
      fieldOptions,
      f => f.internalName === this.defaultTimeField.internalName
    )
  }

  public async componentDidMount() {
    const {
      data,
      dataType,
      timeFormat,
      tableOptions,
      fieldOptions,
      decimalPlaces,
    } = this.props

    this.isComponentMounted = true
    window.addEventListener('resize', this.handleResize)

    let sortField: string = _.get(
      this.props,
      ['tableOptions', 'sortBy', 'internalName'],
      ''
    )
    const isValidSortField = !!fieldOptions.find(
      f => f.internalName === sortField
    )

    if (!isValidSortField) {
      sortField = _.get(
        this.defaultTimeField,
        'internalName',
        _.get(fieldOptions, '0.internalName', '')
      )
    }

    const sort: Sort = {field: sortField, direction: DEFAULT_SORT_DIRECTION}

    try {
      const {
        data: resultData,
        sortedLabels,
        influxQLQueryType,
      } = await this.getTableGraphData(data, dataType)

      const computedFieldOptions = computeFieldOptions(
        fieldOptions,
        sortedLabels,
        dataType,
        influxQLQueryType
      )

      this.handleUpdateFieldOptions(computedFieldOptions)

      const {
        transformedData,
        sortedTimeVals,
        columnWidths,
      } = await manager.tableTransform(
        resultData,
        sort,
        computedFieldOptions,
        tableOptions,
        timeFormat,
        decimalPlaces
      )

      const isTimeVisible = _.get(this.timeField, 'visible', false)

      this.setState(
        {
          transformedData,
          sortedTimeVals,
          columnWidths: columnWidths.widths,
          data: resultData,
          sortedLabels,
          totalColumnWidths: columnWidths.totalWidths,
          hoveredColumnIndex: NULL_ARRAY_INDEX,
          hoveredRowIndex: NULL_ARRAY_INDEX,
          sort,
          isTimeVisible,
          invalidDataError: null,
        },
        () => {
          window.setTimeout(() => {
            this.forceUpdate()
          }, 0)
        }
      )
    } catch (e) {
      this.handleError(e)
    }
  }

  public async componentWillReceiveProps(nextProps: Props) {
    const {sort} = this.state

    let result: TimeSeriesToTableGraphReturnType
    const hasDataChanged = this.hasDataChanged(nextProps.data)

    try {
      if (hasDataChanged) {
        result = await this.getTableGraphData(
          nextProps.data,
          nextProps.dataType
        )
      }
      const data = _.get(result, 'data', this.state.data)
      const influxQLQueryType = _.get(
        result,
        'influxQLQueryType',
        this.state.influxQLQueryType
      )

      if (_.isEmpty(data[0])) {
        return
      }

      const updatedProps = _.keys(_.omit(nextProps, 'data')).filter(
        k => !_.isEqual(this.props[k], nextProps[k])
      )

      const {
        tableOptions,
        fieldOptions,
        timeFormat,
        decimalPlaces,
        dataType,
      } = nextProps

      const sortedLabels = _.get(
        result,
        'sortedLabels',
        this.state.sortedLabels
      )
      const computedFieldOptions = computeFieldOptions(
        fieldOptions,
        sortedLabels,
        dataType,
        influxQLQueryType
      )

      if (hasDataChanged) {
        this.handleUpdateFieldOptions(computedFieldOptions)
      }

      let sortField = _.get(tableOptions, 'sortBy.internalName', '')

      const isValidSortField = !!fieldOptions.find(
        f => f.internalName === sortField
      )

      const defaultTimeField = getDefaultTimeField(dataType)

      if (!isValidSortField) {
        const timeField = fieldOptions.find(
          f => f.internalName === defaultTimeField.internalName
        )
        sortField = _.get(
          timeField,
          'internalName',
          _.get(fieldOptions, '0.internalName', '')
        )
      }

      if (
        _.get(this.props, 'tableOptions.sortBy.internalName', '') !== sortField
      ) {
        sort.direction = DEFAULT_SORT_DIRECTION
        sort.field = sortField
      }

      if (
        hasDataChanged ||
        _.includes(updatedProps, 'tableOptions') ||
        _.includes(updatedProps, 'fieldOptions') ||
        _.includes(updatedProps, 'timeFormat')
      ) {
        const {
          transformedData,
          sortedTimeVals,
          columnWidths,
        } = await manager.tableTransform(
          data,
          sort,
          computedFieldOptions,
          tableOptions,
          timeFormat,
          decimalPlaces
        )

        let isTimeVisible = this.state.isTimeVisible
        if (_.includes(updatedProps, 'fieldOptions')) {
          const timeField = _.find(nextProps.fieldOptions, f => {
            return f.internalName === defaultTimeField.internalName
          })
          isTimeVisible = _.get(timeField, 'visible', false)
        }

        if (!this.isComponentMounted) {
          return
        }

        this.setState({
          data,
          sortedLabels,
          influxQLQueryType,
          transformedData,
          sortedTimeVals,
          sort,
          columnWidths: columnWidths.widths,
          totalColumnWidths: columnWidths.totalWidths,
          isTimeVisible,
          shouldResize: true,
          invalidDataError: null,
        })
      }
    } catch (e) {
      this.handleError(e)
    }
  }

  public componentDidUpdate() {
    if (this.state.shouldResize) {
      if (this.multiGrid) {
        this.multiGrid.recomputeGridSize()
      }

      this.setState({shouldResize: false})
    }
  }

  private get tableContainerClassName(): string {
    const {dataType} = this.props

    if (dataType === DataType.flux) {
      return 'time-machine-table'
    }

    return 'table-graph-container'
  }

  private hasDataChanged(data): boolean {
    const newUUID =
      _.get(data, '0.response.uuid', null) || _.get(data, 'id', null)
    const oldUUID =
      _.get(this.props.data, '0.response.uuid', null) ||
      _.get(this.props.data, 'id', null)

    return newUUID !== oldUUID || !!this.props.editorLocation
  }

  private handleError(e: Error): void {
    let invalidDataError: ErrorTypes
    switch (e.toString()) {
      case 'Error: Cannot display meta and data query':
        invalidDataError = ErrorTypes.MetaQueryCombo
        break
      default:
        invalidDataError = ErrorTypes.GeneralError
        break
    }
    this.setState({invalidDataError})
  }

  private get invalidDataMessage(): string {
    switch (this.state.invalidDataError) {
      case ErrorTypes.MetaQueryCombo:
        return 'Cannot display data for meta queries mixed with data queries'
      default:
        return null
    }
  }

  private get fixFirstColumn(): boolean {
    const {tableOptions, fieldOptions} = this.props
    const {fixFirstColumn = DEFAULT_FIX_FIRST_COLUMN} = tableOptions

    if (fieldOptions.length === 1) {
      return false
    }

    const visibleFields = fieldOptions.reduce((acc, f) => {
      if (f.visible) {
        acc += 1
      }
      return acc
    }, 0)

    if (visibleFields === 1) {
      return false
    }

    return fixFirstColumn
  }

  private get columnCount(): number {
    const {transformedData} = this.state
    return _.get(transformedData, ['0', 'length'], 0)
  }

  private get computedColumnCount(): number {
    if (this.fixFirstColumn) {
      return this.columnCount - 1
    }

    return this.columnCount
  }

  private get tableWidth(): number {
    let tableWidth = 0

    if (this.gridContainer && this.gridContainer.clientWidth) {
      tableWidth = this.gridContainer.clientWidth
    }

    return tableWidth
  }

  private handleUpdateFieldOptions = (fieldOptions: FieldOption[]): void => {
    const {onUpdateFieldOptions} = this.props

    if (onUpdateFieldOptions) {
      onUpdateFieldOptions(fieldOptions)
    }
  }

  private get isEmpty(): boolean {
    const {data} = this.state
    return _.isEmpty(data[0])
  }

  private get scrollToColRow(): {
    scrollToRow: number | null
    scrollToColumn: number | null
  } {
    const {sortedTimeVals, hoveredColumnIndex, isTimeVisible} = this.state
    const {hoverTime} = this.props
    const hoveringThisTable = hoveredColumnIndex !== NULL_ARRAY_INDEX
    const notHovering = hoverTime === NULL_HOVER_TIME
    if (this.isEmpty || notHovering || hoveringThisTable || !isTimeVisible) {
      return {scrollToColumn: 0, scrollToRow: -1}
    }

    const firstDiff = this.getTimeDifference(hoverTime, sortedTimeVals[1]) // sortedTimeVals[0] is "time"

    const hoverTimeFound = fastReduce<
      TimeSeriesValue,
      {index: number; diff: number}
    >(
      sortedTimeVals,
      (acc, currentTime, index) => {
        const thisDiff = this.getTimeDifference(hoverTime, currentTime)
        if (thisDiff < acc.diff) {
          return {index, diff: thisDiff}
        }
        return acc
      },
      {index: 1, diff: firstDiff}
    )

    const scrollToColumn = this.isVerticalTimeAxis ? -1 : hoverTimeFound.index
    const scrollToRow = this.isVerticalTimeAxis ? hoverTimeFound.index : null
    return {scrollToRow, scrollToColumn}
  }

  private getTimeDifference(hoverTime, time: string | number) {
    return Math.abs(parseInt(hoverTime, 10) - parseInt(time as string, 10))
  }

  private get isVerticalTimeAxis(): boolean {
    return _.get(
      this.props,
      'tableOptions.verticalTimeAxis',
      DEFAULT_VERTICAL_TIME_AXIS
    )
  }

  private handleHover = (e: React.MouseEvent<HTMLElement>) => {
    const {dataset} = e.target as HTMLElement
    const {handleSetHoverTime} = this.props
    const {sortedTimeVals, isTimeVisible} = this.state
    if (this.isVerticalTimeAxis && +dataset.rowIndex === 0) {
      return
    }
    if (handleSetHoverTime && isTimeVisible) {
      const hoverTime = this.isVerticalTimeAxis
        ? sortedTimeVals[dataset.rowIndex]
        : sortedTimeVals[dataset.columnIndex]
      handleSetHoverTime(_.defaultTo(hoverTime, '').toString())
    }
    this.setState({
      hoveredColumnIndex: +dataset.columnIndex,
      hoveredRowIndex: +dataset.rowIndex,
    })
  }

  private handleMouseLeave = (): void => {
    if (this.props.handleSetHoverTime) {
      this.props.handleSetHoverTime(NULL_HOVER_TIME)
      this.setState({
        hoveredColumnIndex: NULL_ARRAY_INDEX,
        hoveredRowIndex: NULL_ARRAY_INDEX,
      })
    }
  }

  private handleClickFieldName = (
    clickedFieldName: string
  ) => async (): Promise<void> => {
    const {tableOptions, fieldOptions, timeFormat, decimalPlaces} = this.props
    const {data, sort} = this.state

    if (clickedFieldName === sort.field) {
      sort.direction = sort.direction === ASCENDING ? DESCENDING : ASCENDING
    } else {
      sort.field = clickedFieldName
      sort.direction = DEFAULT_SORT_DIRECTION
    }

    const {transformedData, sortedTimeVals} = await manager.tableTransform(
      data,
      sort,
      fieldOptions,
      tableOptions,
      timeFormat,
      decimalPlaces
    )

    this.setState({
      transformedData,
      sortedTimeVals,
      sort,
    })
  }

  private calculateColumnWidth = (columnSizerWidth: number) => (column: {
    index: number
  }): number => {
    const {index} = column

    const {transformedData, columnWidths, totalColumnWidths} = this.state
    const columnLabel = transformedData[0][index]

    const original = columnWidths[columnLabel]

    if (this.fixFirstColumn && index === 0) {
      return original
    }

    if (this.tableWidth <= totalColumnWidths) {
      return original
    }

    if (this.columnCount <= 1) {
      return columnSizerWidth
    }

    const difference = this.tableWidth - totalColumnWidths
    const increment = difference / this.computedColumnCount

    return original + increment
  }

  private createCellContents = (
    cellData: TimeSeriesValue,
    fieldName: TimeSeriesValue,
    isTimeData: boolean,
    isFieldName: boolean
  ): string => {
    const {timeFormat, decimalPlaces} = this.props

    if (isTimeData) {
      return moment(cellData).format(timeFormat)
    }
    if (_.isString(cellData) && isFieldName) {
      return _.defaultTo(fieldName, '').toString()
    }
    if (
      _.isNumber(cellData) &&
      decimalPlaces.isEnforced &&
      decimalPlaces.digits < 100
    ) {
      return cellData.toFixed(decimalPlaces.digits)
    }

    return _.defaultTo(cellData, '').toString()
  }

  private handleResize = () => {
    this.forceUpdate()
  }

  private get defaultTimeField(): FieldOption {
    const {dataType} = this.props

    return getDefaultTimeField(dataType)
  }

  private get timeFieldIndex(): number {
    const {fieldOptions} = this.props

    let hiddenBeforeTime = 0
    const timeIndex = fieldOptions.findIndex(({internalName, visible}) => {
      if (!visible) {
        hiddenBeforeTime += 1
      }
      return internalName === this.defaultTimeField.internalName
    })

    return timeIndex - hiddenBeforeTime
  }

  private cellRenderer = ({
    columnIndex,
    rowIndex,
    key,
    parent,
    style,
  }: CellRendererProps) => {
    const {
      hoveredColumnIndex,
      hoveredRowIndex,
      transformedData,
      sort,
      isTimeVisible,
    } = this.state

    const {fieldOptions = [this.defaultTimeField], colors} = this.props
    const cellData = transformedData[rowIndex][columnIndex]
    const isSorted = sort.field === cellData
    const isAscending = sort.direction === ASCENDING
    const isFirstRow = rowIndex === 0
    const isFirstCol = columnIndex === 0
    const isFixedRow = isFirstRow && !isFirstCol
    const isFixedColumn = this.fixFirstColumn && !isFirstRow && isFirstCol
    const isTimeData =
      isTimeVisible &&
      (this.isVerticalTimeAxis
        ? !isFirstRow && columnIndex === this.timeFieldIndex
        : rowIndex === this.timeFieldIndex && isFirstCol)
    const isFieldName = this.isVerticalTimeAxis ? isFirstRow : isFirstCol
    const isFixedCorner = isFirstRow && isFirstCol
    const isNumerical = !isNaN(Number.parseFloat(cellData as string))

    let cellStyle: React.CSSProperties = style //tslint:disable-line
    if (
      !isFixedRow &&
      !isFixedColumn &&
      !isFixedCorner &&
      !isTimeData &&
      isNumerical
    ) {
      const thresholdData = {colors, lastValue: cellData, cellType: 'table'}
      const {bgColor, textColor} = generateThresholdsListHexs(thresholdData)

      cellStyle = {
        ...cellStyle,
        backgroundColor: bgColor,
        color: textColor,
      }
    }

    const foundField =
      isFieldName &&
      fieldOptions.find(({internalName}) => internalName === cellData)
    const fieldName =
      foundField && (foundField.displayName || foundField.internalName)

    const isHighlightedRow =
      rowIndex === parent.props.scrollToRow ||
      (rowIndex === hoveredRowIndex && hoveredRowIndex > 0)

    const isHighlightedColumn =
      columnIndex === hoveredColumnIndex && hoveredColumnIndex > 0

    const cellClass = classnames('table-graph-cell', {
      'table-graph-cell__fixed-row': isFixedRow,
      'table-graph-cell__fixed-column': isFixedColumn,
      'table-graph-cell__fixed-corner': isFixedCorner,
      'table-graph-cell__highlight-row': isHighlightedRow,
      'table-graph-cell__highlight-column': isHighlightedColumn,
      'table-graph-cell__numerical': isNumerical,
      'table-graph-cell__field-name': isFieldName,
      'table-graph-cell__sort-asc': isFieldName && isSorted && isAscending,
      'table-graph-cell__sort-desc': isFieldName && isSorted && !isAscending,
    })

    const cellContents = this.createCellContents(
      cellData,
      fieldName,
      isTimeData,
      isFieldName
    )

    return (
      <div
        key={key}
        style={cellStyle}
        className={cellClass}
        onClick={
          isFieldName && _.isString(cellData)
            ? this.handleClickFieldName(cellData)
            : null
        }
        data-column-index={columnIndex}
        data-row-index={rowIndex}
        onMouseOver={this.handleHover}
        title={cellContents}
      >
        {cellContents}
      </div>
    )
  }

  private async getTableGraphData(
    data: TimeSeriesServerResponse[] | FluxTable,
    dataType: DataType
  ): Promise<TimeSeriesToTableGraphReturnType> {
    if (dataType === DataType.influxQL) {
      const result = await timeSeriesToTableGraph(
        data as TimeSeriesServerResponse[]
      )

      return result
    } else {
      const resultData = (data as FluxTable).data
      const sortedLabels = _.get(resultData, '0', []).map(label => ({
        label,
        seriesIndex: 0,
        responseIndex: 0,
      }))

      return {data: resultData, sortedLabels} as {
        data: TimeSeriesValue[][]
        sortedLabels: Label[]
        influxQLQueryType: null
      }
    }
  }
}

const mstp = ({dashboardUI}) => ({
  hoverTime: dashboardUI.hoverTime,
})

export default connect(mstp)(TableGraph)
