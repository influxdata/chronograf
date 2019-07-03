// Libraries
import React, {PureComponent} from 'react'
import _ from 'lodash'
import classnames from 'classnames'
import {connect} from 'react-redux'
import moment from 'moment'
import {ColumnSizer, SizedColumnProps, AutoSizer} from 'react-virtualized'

// Components
import {MultiGrid, PropsMultiGrid} from 'src/shared/components/MultiGrid'

// Utils
import {fastReduce} from 'src/utils/fast'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {
  getDefaultTimeField,
  isNumerical,
  formatNumericCell,
} from 'src/dashboards/utils/tableGraph'

// Constants
import {
  ASCENDING,
  NULL_HOVER_TIME,
  NULL_ARRAY_INDEX,
  DEFAULT_FIX_FIRST_COLUMN,
  DEFAULT_VERTICAL_TIME_AXIS,
} from 'src/shared/constants/tableGraph'
import {generateThresholdsListHexs} from 'src/shared/constants/colorOperations'
import {DataType} from 'src/shared/constants'

// Types
import {TimeSeriesValue} from 'src/types/series'
import {ColorString} from 'src/types/colors'
import {
  TableOptions,
  FieldOption,
  DecimalPlaces,
  Sort,
} from 'src/types/dashboards'
import {QueryUpdateState, TimeZones} from 'src/types'

import {FormattedTableData} from 'src/shared/components/TableGraphFormat'

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
  data: FormattedTableData
  onSort: (fieldName: string) => void
  sort: Sort
  dataType: DataType
  tableOptions: TableOptions
  timeFormat: string
  timeZone: TimeZones
  decimalPlaces: DecimalPlaces
  fieldOptions: FieldOption[]
  hoverTime: string
  handleSetHoverTime?: (hovertime: string) => void
  colors: ColorString[]
  editorLocation?: QueryUpdateState
  onUpdateFieldOptions?: (fieldOptions: FieldOption[]) => void
}

interface State {
  sortedLabels: Label[]
  hoveredColumnIndex: number
  hoveredRowIndex: number
  timeColumnWidth: number
  isTimeVisible: boolean
  shouldResize: boolean
}

@ErrorHandling
class TableGraph extends PureComponent<Props, State> {
  private gridContainer: HTMLDivElement
  private multiGrid?: MultiGrid

  constructor(props: Props) {
    super(props)

    this.state = {
      shouldResize: false,
      sortedLabels: [],
      hoveredColumnIndex: NULL_ARRAY_INDEX,
      hoveredRowIndex: NULL_ARRAY_INDEX,
      isTimeVisible: true,
      timeColumnWidth: 0,
    }
  }

  public render() {
    const {
      data: {transformedData},
    } = this.props

    const columnCount = _.get(transformedData, ['0', 'length'], 0)
    const rowCount = columnCount === 0 ? 0 : transformedData.length
    const fixedColumnCount = this.fixFirstColumn && columnCount > 1 ? 1 : 0
    const {scrollToColumn, scrollToRow, externalScroll} = this.scrollToColRow

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
                    height={height}
                    fixedRowCount={1}
                    ref={registerChild}
                    rowCount={rowCount}
                    width={adjustedWidth}
                    rowHeight={ROW_HEIGHT}
                    columnCount={columnCount}
                    scrollToRow={scrollToRow}
                    scrollToColumn={scrollToColumn}
                    externalScroll={externalScroll}
                    cellRenderer={this.cellRenderer}
                    onMount={this.handleMultiGridMount}
                    fixedColumnCount={fixedColumnCount}
                    classNameBottomRightGrid="table-graph--scroll-window"
                    columnWidth={this.calculateColumnWidth(columnWidth)}
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
      f => f.internalName === this.defaultTimeField.internalName
    )
  }

  public async componentDidMount() {
    const {fieldOptions} = this.props

    window.addEventListener('resize', this.handleResize)

    this.handleUpdateFieldOptions(fieldOptions)

    const isTimeVisible = _.get(this.timeField, 'visible', false)

    this.setState(
      {
        hoveredColumnIndex: NULL_ARRAY_INDEX,
        hoveredRowIndex: NULL_ARRAY_INDEX,
        isTimeVisible,
      },
      () => {
        window.setTimeout(() => {
          this.forceUpdate()
        }, 0)
      }
    )
  }

  public async componentWillReceiveProps(nextProps: Props) {
    const {dataType} = nextProps

    const defaultTimeField = getDefaultTimeField(dataType)
    const timeField = _.find(nextProps.fieldOptions, f => {
      return f.internalName === defaultTimeField.internalName
    })

    const isTimeVisible = _.get(timeField, 'visible', this.state.isTimeVisible)

    const updatedProps = _.keys(_.omit(nextProps, 'data')).filter(
      k => !_.isEqual(this.props[k], nextProps[k])
    )

    const shouldResize =
      _.includes(updatedProps, 'tableOptions') ||
      _.includes(updatedProps, 'fieldOptions') ||
      _.includes(updatedProps, 'timeFormat')

    this.setState({
      isTimeVisible,
      shouldResize,
    })
  }

  public componentDidUpdate(prevProps: Props) {
    if (this.state.shouldResize) {
      if (this.multiGrid) {
        this.multiGrid.recomputeGridSize()
      }

      this.setState({shouldResize: false})
    }
    if (this.multiGrid) {
      this.multiGrid.forceUpdate()
    }
    if (!_.isEqual(this.props.fieldOptions, prevProps.fieldOptions)) {
      this.handleUpdateFieldOptions(this.props.fieldOptions)
    }
  }

  private get tableContainerClassName(): string {
    const {dataType} = this.props

    if (dataType === DataType.flux) {
      return 'time-machine-table'
    }

    return 'table-graph-container'
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
    const {
      data: {transformedData},
    } = this.props
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
    const {
      data: {transformedData},
    } = this.props
    return _.isEmpty(transformedData)
  }

  private get scrollToColRow(): {
    scrollToRow: number | null
    scrollToColumn: number | null
    externalScroll: boolean
  } {
    const {
      data: {sortedTimeVals},
    } = this.props
    const {hoveredColumnIndex, isTimeVisible} = this.state
    const {hoverTime} = this.props
    const hoveringThisTable = hoveredColumnIndex !== NULL_ARRAY_INDEX
    const notHovering = hoverTime === NULL_HOVER_TIME
    const hoveringOtherCell = !notHovering && !hoveringThisTable

    if (this.isEmpty || notHovering || hoveringThisTable || !isTimeVisible) {
      return {
        scrollToColumn: 0,
        scrollToRow: -1,
        externalScroll: hoveringOtherCell,
      }
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
    return {scrollToRow, scrollToColumn, externalScroll: hoveringOtherCell}
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
    const {
      data: {sortedTimeVals},
    } = this.props
    const {isTimeVisible} = this.state
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
    this.props.onSort(clickedFieldName)
  }

  private calculateColumnWidth = (columnSizerWidth: number) => (column: {
    index: number
  }): number => {
    const {index} = column

    const {
      data: {
        transformedData,
        columnWidths: {widths: columnWidths, totalWidths: totalColumnWidths},
      },
    } = this.props

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
    const {timeFormat, timeZone, decimalPlaces} = this.props

    if (isTimeData) {
      if (timeZone === TimeZones.UTC) {
        return moment(cellData)
          .utc()
          .format(timeFormat)
      }

      return moment(cellData).format(timeFormat)
    }

    if (_.isString(cellData) && isFieldName) {
      return _.defaultTo(fieldName, '').toString()
    }

    if (isNumerical(cellData)) {
      return formatNumericCell(cellData, decimalPlaces)
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
    const {hoveredColumnIndex, hoveredRowIndex, isTimeVisible} = this.state
    const {
      data: {transformedData},
      sort,
    } = this.props

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

    const cellDataIsNumerical = isNumerical(cellData)

    let cellStyle: React.CSSProperties = style //tslint:disable-line
    if (
      !isFixedRow &&
      !isFixedColumn &&
      !isFixedCorner &&
      !isTimeData &&
      cellDataIsNumerical
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
      'table-graph-cell__numerical': cellDataIsNumerical,
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

const mstp = ({dashboardUI, app}) => ({
  hoverTime: dashboardUI.hoverTime,
  timeZone: app.persisted.timeZone,
})

export default connect(mstp)(TableGraph)
