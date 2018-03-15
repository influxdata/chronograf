import React, {Component} from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import classnames from 'classnames'
import calculateSize from 'calculate-size'
import moment from 'moment'

import {MultiGrid} from 'react-virtualized'
import {timeSeriesToTableGraph} from 'src/utils/timeSeriesToDygraph'
import {
  NULL_COLUMN_INDEX,
  NULL_ROW_INDEX,
  NULL_HOVER_TIME,
  TIME_FORMAT_DEFAULT,
} from 'src/shared/constants/tableGraph'

const isEmpty = data => data.length <= 1

const dataCount = data => {
  const columnCount = _.get(data, ['0', 'length'], 0)
  const rowCount = data.length
  return {columnCount, rowCount}
}

import {
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_ROW_HEIGHT,
  COLUMN_PADDING,
  ROW_PADDING,
  TABLE_TEXT_SINGLE_LINE,
  TABLE_TEXT_WRAP,
  TABLE_TEXT_TRUNCATE,
} from 'shared/constants/tableGraph'

class TableGraph extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hoveredColumnIndex: NULL_COLUMN_INDEX,
      hoveredRowIndex: NULL_ROW_INDEX,
    }
  }

  componentWillMount() {
    this._data = [[]]
  }

  componentWillUpdate(nextProps) {
    const {data} = timeSeriesToTableGraph(nextProps.data)
    this._data = data
  }

  calcHoverTimeRow = (data, hoverTime) =>
    !isEmpty(data) && hoverTime !== NULL_HOVER_TIME
      ? data.findIndex(
          row => row[0] && _.isNumber(row[0]) && row[0] >= hoverTime
        )
      : undefined

  handleHover = (columnIndex, rowIndex) => () => {
    if (this.props.onSetHoverTime) {
      this.props.onSetHoverTime(this._data[rowIndex][0].toString())
      this.setState({
        hoveredColumnIndex: columnIndex,
        hoveredRowIndex: rowIndex,
      })
    }
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

  cellRenderer = ({columnIndex, rowIndex, key, style, parent}) => {
    const {tableOptions: {wrapping}} = this.props
    const data = this._data
    const {hoveredColumnIndex, hoveredRowIndex} = this.state

    const {columnCount, rowCount} = dataCount(data)
    const {tableOptions} = this.props
    const timeFormat = tableOptions
      ? tableOptions.timeFormat
      : TIME_FORMAT_DEFAULT

    const isFixedRow = rowIndex === 0 && columnIndex > 0
    const isFixedColumn = rowIndex > 0 && columnIndex === 0
    const isTimeData = isFixedColumn
    const isFixedCorner = rowIndex === 0 && columnIndex === 0
    const isLastRow = rowIndex === rowCount - 1
    const isLastColumn = columnIndex === columnCount - 1
    const isHighlighted =
      rowIndex === parent.props.scrollToRow ||
      (rowIndex === hoveredRowIndex && hoveredRowIndex !== 0) ||
      (columnIndex === hoveredColumnIndex && hoveredColumnIndex !== 0)
    const dataIsNumerical = _.isNumber(data[rowIndex][columnIndex])

    const cellClass = classnames('table-graph-cell', {
      'table-graph-cell__fixed-row': isFixedRow,
      'table-graph-cell__fixed-column': isFixedColumn,
      'table-graph-cell__fixed-corner': isFixedCorner,
      'table-graph-cell__last-row': isLastRow,
      'table-graph-cell__last-column': isLastColumn,
      'table-graph-cell__wrap': wrapping === TABLE_TEXT_WRAP,
      'table-graph-cell__truncate': wrapping === TABLE_TEXT_TRUNCATE,
      'table-graph-cell__highlight': isHighlighted,
      'table-graph-cell__numerical': dataIsNumerical,
    })

    return (
      <div
        key={key}
        style={style}
        className={cellClass}
        onMouseOver={this.handleHover(columnIndex, rowIndex)}
      >
        {isTimeData
          ? `${moment(data[rowIndex][columnIndex]).format(timeFormat)}`
          : `${data[rowIndex][columnIndex]}`}
      </div>
    )
  }

  measureColumnWidth = column => {
    const {tableOptions: {timeFormat, wrapping}} = this.props
    const data = this._data
    const {index: columnIndex} = column
    const columnValues = []
    let longestValue = ''

    if (
      columnIndex > 0 &&
      (wrapping === TABLE_TEXT_TRUNCATE || wrapping === TABLE_TEXT_WRAP)
    ) {
      longestValue = `${data[0][columnIndex]}`
    } else {
      const {rowCount} = dataCount(data)

      columnValues[0] = `${data[0][columnIndex]}`

      for (let rowIndex = 1; rowIndex < rowCount; rowIndex++) {
        columnValues[rowIndex] = data[rowIndex][columnIndex]
          ? `${moment(data[rowIndex][columnIndex]).format(timeFormat)}`
          : ''
      }

      longestValue = columnValues.reduce(
        (a, b) => (a.length > b.length ? a : b)
      )
    }

    const {width} = calculateSize(longestValue, {
      font: '"RobotoMono", monospace',
      fontSize: '13px',
      fontWeight: 'bold',
    })

    return width + COLUMN_PADDING
  }

  measureRowHeight = row => {
    const {tableOptions: {wrapping}} = this.props

    if (wrapping === TABLE_TEXT_WRAP) {
      const {index: rowIndex} = row
      const data = this._data
      const columnCount = data[rowIndex].length
      const cellHeights = []

      for (let colIndex = 0; colIndex < columnCount; colIndex++) {
        const columnHeaderData = data[0][colIndex]
        const {width} = calculateSize(columnHeaderData, {
          font: 'Roboto',
          fontSize: '13px',
          fontWeight: 'bold',
        })

        const {height} = calculateSize(columnHeaderData, {
          font: 'Roboto',
          fontSize: '13px',
          fontWeight: 'bold',
          width: `${width}px`,
        })

        cellHeights[colIndex] = height
      }

      const rowHeight = cellHeights.reduce(
        (a, b) => (a.length > b.length ? a : b)
      )

      return rowIndex === 0 ? DEFAULT_ROW_HEIGHT : rowHeight + ROW_PADDING
    }

    return DEFAULT_ROW_HEIGHT
  }

  render() {
    const {hoveredColumnIndex, hoveredRowIndex} = this.state
    const {hoverTime, tableOptions} = this.props
    const data = this._data
    const {columnCount, rowCount} = dataCount(data)
    const tableWidth = this.gridContainer ? this.gridContainer.clientWidth : 0
    const tableHeight = this.gridContainer ? this.gridContainer.clientHeight : 0
    const hoverTimeRow = this.calcHoverTimeRow(data, hoverTime)

    return (
      <div
        className="table-graph-container"
        ref={gridContainer => (this.gridContainer = gridContainer)}
        onMouseOut={this.handleMouseOut}
      >
        {!isEmpty(data) &&
          <MultiGrid
            height={tableHeight}
            width={tableWidth}
            columnCount={columnCount}
            fixedColumnCount={1}
            rowCount={rowCount}
            fixedRowCount={1}
            estimatedColumnSize={DEFAULT_COLUMN_WIDTH}
            columnWidth={this.measureColumnWidth}
            estimatedRowSize={DEFAULT_ROW_HEIGHT}
            rowHeight={this.measureRowHeight}
            enableFixedColumnScroll={true}
            enableFixedRowScroll={true}
            timeFormat={
              tableOptions ? tableOptions.timeFormat : TIME_FORMAT_DEFAULT
            }
            scrollToRow={hoverTimeRow}
            cellRenderer={this.cellRenderer}
            hoveredColumnIndex={hoveredColumnIndex}
            hoveredRowIndex={hoveredRowIndex}
            hoverTime={hoverTime}
          />}
      </div>
    )
  }
}

const {arrayOf, number, shape, string, func} = PropTypes

TableGraph.defaultProps = {
  tableOptions: {
    wrapping: TABLE_TEXT_SINGLE_LINE,
  },
}

TableGraph.propTypes = {
  cellHeight: number,
  data: arrayOf(shape()),
  tableOptions: shape({
    wrapping: string.isRequired,
  }),
  hoverTime: string,
  onSetHoverTime: func,
}

export default TableGraph
