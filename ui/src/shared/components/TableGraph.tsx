import React, {Component} from 'react'
import _ from 'lodash'
import classnames from 'classnames'
import {connect} from 'react-redux'
import moment from 'moment'

import {ColumnSizer, SizedColumnProps, AutoSizer} from 'react-virtualized'
import {MultiGrid, PropsMultiGrid} from 'src/shared/components/MultiGrid'
import {bindActionCreators} from 'redux'
import {fastReduce} from 'src/utils/fast'
import {timeSeriesToTableGraph} from 'src/utils/timeSeriesTransformers'
import {
  computeFieldOptions,
  transformTableData,
} from 'src/dashboards/utils/tableGraph'
import {updateFieldOptions} from 'src/dashboards/actions/cellEditorOverlay'
import {DEFAULT_TIME_FIELD} from 'src/dashboards/constants'
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
import {ErrorHandling} from 'src/shared/decorators/errors'
import {TimeSeriesServerResponse, TimeSeriesValue} from 'src/types/series'
import {ColorString} from 'src/types/colors'
import {
  TableOptions,
  FieldOption,
  DecimalPlaces,
  Sort,
} from 'src/types/dashboards'

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

interface Props {
  data: TimeSeriesServerResponse[]
  tableOptions: TableOptions
  timeFormat: string
  decimalPlaces: DecimalPlaces
  fieldOptions: FieldOption[]
  hoverTime: string
  handleUpdateFieldOptions: (fieldOptions: FieldOption[]) => void
  handleSetHoverTime: (hovertime: string) => void
  colors: ColorString
  isInCEO: boolean
}

interface State {
  data: TimeSeriesValue[][]
  transformedData: TimeSeriesValue[][]
  sortedTimeVals: TimeSeriesValue[]
  sortedLabels: Label[]
  hoveredColumnIndex: number
  hoveredRowIndex: number
  timeColumnWidth: number
  sort: Sort
  columnWidths: {[x: string]: number}
  totalColumnWidths: number
  isTimeVisible: boolean
  shouldResize: boolean
}

@ErrorHandling
class TableGraph extends Component<Props, State> {
  private gridContainer: HTMLDivElement
  private multiGrid?: MultiGrid

  constructor(props: Props) {
    super(props)

    const sortField: string = _.get(
      this.props,
      'tableOptions.sortBy.internalName',
      DEFAULT_TIME_FIELD.internalName
    )
    this.state = {
      shouldResize: false,
      data: [[]],
      transformedData: [[]],
      sortedTimeVals: [],
      sortedLabels: [],
      hoveredColumnIndex: NULL_ARRAY_INDEX,
      hoveredRowIndex: NULL_ARRAY_INDEX,
      sort: {field: sortField, direction: DEFAULT_SORT_DIRECTION},
      columnWidths: {},
      totalColumnWidths: 0,
      isTimeVisible: true,
      timeColumnWidth: 0,
    }
  }

  public render() {
    const {transformedData} = this.state

    const columnCount = _.get(transformedData, ['0', 'length'], 0)
    const rowCount = columnCount === 0 ? 0 : transformedData.length
    const fixedColumnCount = this.fixFirstColumn && columnCount > 1 ? 1 : 0
    const {scrollToColumn, scrollToRow} = this.scrollToColRow

    return (
      <div
        className="table-graph-container"
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
    window.removeEventListener('resize', this.handleResize)
  }

  public get timeField() {
    const {fieldOptions} = this.props

    return _.find(
      fieldOptions,
      f => f.internalName === DEFAULT_TIME_FIELD.internalName
    )
  }

  public componentDidMount() {
    window.addEventListener('resize', this.handleResize)

    const sortField: string = _.get(
      this.props,
      ['tableOptions', 'sortBy', 'internalName'],
      DEFAULT_TIME_FIELD.internalName
    )

    const sort: Sort = {field: sortField, direction: DEFAULT_SORT_DIRECTION}
    const {
      data,
      tableOptions,
      timeFormat,
      fieldOptions,
      decimalPlaces,
    } = this.props
    const result = timeSeriesToTableGraph(data)
    const sortedLabels = result.sortedLabels
    const computedFieldOptions = computeFieldOptions(fieldOptions, sortedLabels)

    this.handleUpdateFieldOptions(computedFieldOptions)

    const {transformedData, sortedTimeVals, columnWidths} = transformTableData(
      result.data,
      sort,
      computedFieldOptions,
      tableOptions,
      timeFormat,
      decimalPlaces
    )

    const isTimeVisible = _.get(this.timeField, 'visible', true)

    this.setState(
      {
        transformedData,
        sortedTimeVals,
        columnWidths: columnWidths.widths,
        data: result.data,
        sortedLabels,
        totalColumnWidths: columnWidths.totalWidths,
        hoveredColumnIndex: NULL_ARRAY_INDEX,
        hoveredRowIndex: NULL_ARRAY_INDEX,
        sort,
        isTimeVisible,
      },
      () => {
        window.setTimeout(() => {
          this.forceUpdate()
        }, 0)
      }
    )
  }

  public componentWillReceiveProps(nextProps: Props) {
    const {sort} = this.state

    let result = {}
    if (this.hasDataChanged(nextProps.data)) {
      result = timeSeriesToTableGraph(nextProps.data)
    }
    const data = _.get(result, 'data', this.state.data)

    if (_.isEmpty(data[0])) {
      return
    }

    const updatedProps = _.keys(_.omit(nextProps, 'data')).filter(
      k => !_.isEqual(this.props[k], nextProps[k])
    )

    const {tableOptions, fieldOptions, timeFormat, decimalPlaces} = nextProps
    const sortedLabels = _.get(result, 'sortedLabels', this.state.sortedLabels)
    const computedFieldOptions = computeFieldOptions(fieldOptions, sortedLabels)

    if (this.hasDataChanged(nextProps.data)) {
      this.handleUpdateFieldOptions(computedFieldOptions)
    }

    const internalName = _.get(tableOptions, 'sortBy.internalName', '')

    if (
      _.get(this.props, 'tableOptions.sortBy.internalName', '') !== internalName
    ) {
      sort.direction = DEFAULT_SORT_DIRECTION
      sort.field = internalName
    }

    if (
      this.hasDataChanged(nextProps.data) ||
      _.includes(updatedProps, 'tableOptions') ||
      _.includes(updatedProps, 'fieldOptions') ||
      _.includes(updatedProps, 'timeFormat')
    ) {
      const {
        transformedData,
        sortedTimeVals,
        columnWidths,
      } = transformTableData(
        data,
        sort,
        computedFieldOptions,
        tableOptions,
        timeFormat,
        decimalPlaces
      )

      let isTimeVisible = this.state.isTimeVisible
      if (_.includes(updatedProps, 'fieldOptions')) {
        const timeField = _.find(
          nextProps.fieldOptions,
          f => f.internalName === DEFAULT_TIME_FIELD.internalName
        )
        isTimeVisible = _.get(timeField, 'visible', this.state.isTimeVisible)
      }

      this.setState({
        data,
        sortedLabels,
        transformedData,
        sortedTimeVals,
        sort,
        columnWidths: columnWidths.widths,
        totalColumnWidths: columnWidths.totalWidths,
        isTimeVisible,
        shouldResize: true,
      })
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

  private hasDataChanged(data): boolean {
    const newUUID = _.get(data, '0.response.uuid', null)
    const oldUUID = _.get(this.props.data, '0.response.uuid', null)

    return newUUID !== oldUUID
  }

  private get fixFirstColumn(): boolean {
    const {tableOptions} = this.props
    const {fixFirstColumn = DEFAULT_FIX_FIRST_COLUMN} = tableOptions
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
    const tableWidth = _.get(this, ['gridContainer', 'clientWidth'], 0)

    return tableWidth
  }

  private get computedTableWidth(): number {
    return this.tableWidth
  }

  private handleUpdateFieldOptions = (fieldOptions: FieldOption[]): void => {
    const {isInCEO, handleUpdateFieldOptions} = this.props
    if (isInCEO) {
      handleUpdateFieldOptions(fieldOptions)
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

    const firstDiff = Math.abs(Number(hoverTime) - Number(sortedTimeVals[1])) // sortedTimeVals[0] is "time"
    const hoverTimeFound = fastReduce<
      TimeSeriesValue,
      {index: number; diff: number}
    >(
      sortedTimeVals,
      (acc, currentTime, index) => {
        const thisDiff = Math.abs(Number(hoverTime) - Number(currentTime))
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

  private handleClickFieldName = (clickedFieldName: string) => (): void => {
    const {tableOptions, fieldOptions, timeFormat, decimalPlaces} = this.props
    const {data, sort} = this.state

    if (clickedFieldName === sort.field) {
      sort.direction = sort.direction === ASCENDING ? DESCENDING : ASCENDING
    } else {
      sort.field = clickedFieldName
      sort.direction = DEFAULT_SORT_DIRECTION
    }

    const {transformedData, sortedTimeVals} = transformTableData(
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

    if (this.fixFirstColumn && index === 0) {
      return columnWidths[columnLabel]
    }

    if (this.computedTableWidth <= totalColumnWidths) {
      return columnWidths[columnLabel]
    }

    if (this.columnCount <= 1) {
      return columnSizerWidth
    }

    const difference = this.computedTableWidth - totalColumnWidths
    const increment = difference / this.computedColumnCount

    return columnWidths[columnLabel] + increment
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

  private get timeFieldIndex(): number {
    const {fieldOptions = [DEFAULT_TIME_FIELD]} = this.props

    return fieldOptions.findIndex(
      ({internalName}) => internalName === DEFAULT_TIME_FIELD.internalName
    )
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

    const {fieldOptions = [DEFAULT_TIME_FIELD], colors} = this.props
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
    const isNumerical = _.isNumber(cellData)

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

    const cellClass = classnames('table-graph-cell', {
      'table-graph-cell__fixed-row': isFixedRow,
      'table-graph-cell__fixed-column': isFixedColumn,
      'table-graph-cell__fixed-corner': isFixedCorner,
      'table-graph-cell__highlight-row':
        rowIndex === parent.props.scrollToRow ||
        (rowIndex === hoveredRowIndex && hoveredRowIndex > 0),
      'table-graph-cell__highlight-column':
        columnIndex === hoveredColumnIndex && hoveredColumnIndex > 0,
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
}

const mstp = ({dashboardUI}) => ({
  hoverTime: dashboardUI.hoverTime,
})

const mapDispatchToProps = dispatch => ({
  handleUpdateFieldOptions: bindActionCreators(updateFieldOptions, dispatch),
})

export default connect(mstp, mapDispatchToProps)(TableGraph)
