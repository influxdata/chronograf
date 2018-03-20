import React, {Component} from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import classnames from 'classnames'
import isEmpty from 'lodash/isEmpty'

import {MultiGrid} from 'react-virtualized'
import moment from 'moment'

import {timeSeriesToTableGraph} from 'src/utils/timeSeriesToDygraph'
import {
  NULL_COLUMN_INDEX,
  NULL_ROW_INDEX,
  NULL_HOVER_TIME,
  TIME_FORMAT_DEFAULT,
  TIME_COLUMN_DEFAULT,
} from 'src/shared/constants/tableGraph'
import {generateThresholdsListHexs} from 'shared/constants/colorOperations'

class TableGraph extends Component {
  constructor(props) {
    super(props)
    this.state = {
      data: [[]],
      unzippedData: [[]],
      hoveredColumnIndex: NULL_COLUMN_INDEX,
      hoveredRowIndex: NULL_ROW_INDEX,
      sortByColumnIndex: -1,
    }
  }

  componentWillReceiveProps(nextProps) {
    const {data, unzippedData} = timeSeriesToTableGraph(nextProps.data)

    const {tableOptions: {sortBy: {internalName}}} = nextProps
    const sortByColumnIndex = _.indexOf(data[0], internalName)

    const sortedData = _.sortBy(_.drop(data, 1), sortByColumnIndex)
    this.setState({
      data: [data[0], ...sortedData],
      unzippedData,
      sortByColumnIndex,
    })
  }

  calcHoverTimeIndex = (data, hoverTime, verticalTimeAxis) => {
    if (isEmpty(data) || hoverTime === NULL_HOVER_TIME) {
      return undefined
    }
    if (verticalTimeAxis) {
      return data.findIndex(
        row => row[0] && _.isNumber(row[0]) && row[0] >= hoverTime
      )
    }
    return data[0].findIndex(d => _.isNumber(d) && d >= hoverTime)
  }

  handleHover = (columnIndex, rowIndex) => () => {
    const {onSetHoverTime, tableOptions} = this.props
    const {data} = this.state
    if (onSetHoverTime) {
      const hoverTime = tableOptions.verticalTimeAxis
        ? data[rowIndex][0]
        : data[0][columnIndex]
      onSetHoverTime(hoverTime.toString())
    }
    this.setState({
      hoveredColumnIndex: columnIndex,
      hoveredRowIndex: rowIndex,
    })
  }

  handleMouseOut = () => {
    if (this.props.onSetHoverTime) {
      this.props.onSetHoverTime(NULL_HOVER_TIME)
      this.setState({
        hoveredColumnIndex: NULL_COLUMN_INDEX,
        hoveredRowIndex: NULL_ROW_INDEX,
      })
    }
  }

  cellRenderer = ({columnIndex, rowIndex, key, parent, style}) => {
    const data = _.get(this.props, ['tableOptions', 'verticalTimeAxis'], true)
      ? this.state.data
      : this.state.unzippedData
    const {hoveredColumnIndex, hoveredRowIndex} = this.state
    const {colors} = this.props
    const columnCount = _.get(data, ['0', 'length'], 0)
    const rowCount = data.length
    const {tableOptions} = this.props
    const timeFormat = _.get(tableOptions, 'timeFormat', TIME_FORMAT_DEFAULT)
    const columnNames = _.get(tableOptions, 'columnNames', [
      TIME_COLUMN_DEFAULT,
    ])

    const isFixedRow = rowIndex === 0 && columnIndex > 0
    const isFixedColumn = rowIndex > 0 && columnIndex === 0
    const isTimeData = tableOptions.verticalTimeAxis
      ? isFixedColumn
      : isFixedRow
    const isFixedCorner = rowIndex === 0 && columnIndex === 0
    const isLastRow = rowIndex === rowCount - 1
    const isLastColumn = columnIndex === columnCount - 1
    const isHighlighted =
      rowIndex === parent.props.scrollToRow ||
      columnIndex === parent.props.scrollToColumn ||
      (rowIndex === hoveredRowIndex && hoveredRowIndex !== 0) ||
      (columnIndex === hoveredColumnIndex && hoveredColumnIndex !== 0)
    const dataIsNumerical = _.isNumber(data[rowIndex][columnIndex])

    let cellStyle = style

    if (!isFixedRow && !isFixedColumn && !isFixedCorner) {
      const {bgColor, textColor} = generateThresholdsListHexs(
        colors,
        data[rowIndex][columnIndex]
      )

      cellStyle = {
        ...style,
        backgroundColor: bgColor,
        color: textColor,
      }
    }

    const cellClass = classnames('table-graph-cell', {
      'table-graph-cell__fixed-row': isFixedRow,
      'table-graph-cell__fixed-column': isFixedColumn,
      'table-graph-cell__fixed-corner': isFixedCorner,
      'table-graph-cell__last-row': isLastRow,
      'table-graph-cell__last-column': isLastColumn,
      'table-graph-cell__highlight': isHighlighted,
      'table-graph-cell__numerical': dataIsNumerical,
    })

    const cellData = data[rowIndex][columnIndex]
    const foundColumn = columnNames.find(
      column => column.internalName === cellData
    )
    const columnName =
      foundColumn && (foundColumn.displayName || foundColumn.internalName)

    return (
      <div
        key={key}
        style={cellStyle}
        className={cellClass}
        onMouseOver={this.handleHover(columnIndex, rowIndex)}
      >
        {isTimeData
          ? `${moment(cellData).format(timeFormat)}`
          : columnName || `${cellData}`}
      </div>
    )
  }

  render() {
    const {sortByColumnIndex, hoveredColumnIndex, hoveredRowIndex} = this.state
    const {hoverTime, tableOptions, colors} = this.props

    const verticalTimeAxis = _.get(tableOptions, 'verticalTimeAxis', true)

    const data = verticalTimeAxis ? this.state.data : this.state.unzippedData

    const columnCount = _.get(data, ['0', 'length'], 0)
    const rowCount = data.length
    const COLUMN_WIDTH = 300
    const ROW_HEIGHT = 30
    const tableWidth = this.gridContainer ? this.gridContainer.clientWidth : 0
    const tableHeight = this.gridContainer ? this.gridContainer.clientHeight : 0
    const hoverTimeIndex =
      hoveredRowIndex === NULL_ROW_INDEX
        ? this.calcHoverTimeIndex(data, hoverTime, verticalTimeAxis)
        : hoveredRowIndex

    return (
      <div
        className="table-graph-container"
        ref={gridContainer => (this.gridContainer = gridContainer)}
        onMouseOut={this.handleMouseOut}
      >
        {!isEmpty(data) && (
          <MultiGrid
            columnCount={columnCount}
            columnWidth={COLUMN_WIDTH}
            rowCount={rowCount}
            rowHeight={ROW_HEIGHT}
            height={tableHeight}
            width={tableWidth}
            fixedColumnCount={1}
            fixedRowCount={1}
            enableFixedColumnScroll={true}
            enableFixedRowScroll={true}
            timeFormat={
              tableOptions ? tableOptions.timeFormat : TIME_FORMAT_DEFAULT
            }
            columnNames={
              tableOptions ? tableOptions.columnNames : [TIME_COLUMN_DEFAULT]
            }
            scrollToRow={verticalTimeAxis ? hoverTimeIndex : undefined}
            scrollToColumn={verticalTimeAxis ? undefined : hoverTimeIndex}
            verticalTimeAxis={verticalTimeAxis}
            sortByColumnIndex={sortByColumnIndex}
            cellRenderer={this.cellRenderer}
            hoveredColumnIndex={hoveredColumnIndex}
            hoveredRowIndex={hoveredRowIndex}
            hoverTime={hoverTime}
            colors={colors}
          />
        )}
      </div>
    )
  }
}

const {arrayOf, number, shape, string, func} = PropTypes

TableGraph.propTypes = {
  cellHeight: number,
  data: arrayOf(shape()),
  tableOptions: shape({}),
  hoverTime: string,
  onSetHoverTime: func,
  colors: arrayOf(
    shape({
      type: string.isRequired,
      hex: string.isRequired,
      id: string.isRequired,
      name: string.isRequired,
      value: string.isRequired,
    }).isRequired
  ),
}

export default TableGraph
