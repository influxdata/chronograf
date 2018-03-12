import React, {PropTypes, Component} from 'react'
import _ from 'lodash'
import classnames from 'classnames'
import calculateSize from 'calculate-size'
import {timeSeriesToTable} from 'src/utils/timeSeriesToDygraph'
import {MultiGrid} from 'react-virtualized'

import {
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_ROW_HEIGHT,
  COLUMN_PADDING,
  TABLE_TEXT_SINGLE_LINE,
} from 'shared/constants/tableGraph'

class TableGraph extends Component {
  componentWillMount() {
    this._labels = []
    this._data = [[]]
  }

  componentWillUpdate(nextProps) {
    // TODO: determine if in dataExplorer
    const {labels, data} = timeSeriesToTable(nextProps.data)
    this._labels = labels
    this._data = data
  }

  cellRenderer = ({columnIndex, key, rowIndex, style}) => {
    const data = this._data
    const columnCount = _.get(data, ['0', 'length'], 0)
    const rowCount = data.length

    const isFixedRow = rowIndex === 0 && columnIndex > 0
    const isFixedColumn = rowIndex > 0 && columnIndex === 0
    const isFixedCorner = rowIndex === 0 && columnIndex === 0
    const isLastRow = rowIndex === rowCount - 1
    const isLastColumn = columnIndex === columnCount - 1

    const cellClass = classnames('table-graph-cell', {
      'table-graph-cell__fixed-row': isFixedRow,
      'table-graph-cell__fixed-column': isFixedColumn,
      'table-graph-cell__fixed-corner': isFixedCorner,
      'table-graph-cell__last-row': isLastRow,
      'table-graph-cell__last-column': isLastColumn,
    })

    return (
      <div key={key} className={cellClass} style={style}>
        {data[rowIndex][columnIndex]}
      </div>
    )
  }

  measureColumnWidth = cell => {
    const data = this._data
    const {index: columnIndex} = cell
    const columnValues = []
    const rowCount = data.length

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      columnValues[rowIndex] = data[rowIndex][columnIndex]
        ? `${data[rowIndex][columnIndex]}`
        : ''
    }

    const longestValue = columnValues.reduce(
      (a, b) => (a.length > b.length ? a : b)
    )

    const {width} = calculateSize(longestValue, {
      font: 'Roboto',
      fontSize: '13px',
      fontWeight: 'bold',
    })

    return width + COLUMN_PADDING
  }

  render() {
    const data = this._data
    const columnCount = _.get(data, ['0', 'length'], 0)
    const rowCount = data.length
    const tableWidth = this.gridContainer ? this.gridContainer.clientWidth : 0
    const tableHeight = this.gridContainer ? this.gridContainer.clientHeight : 0

    const dataExists = data.length > 2
    return (
      <div
        className="table-graph-container"
        ref={gridContainer => (this.gridContainer = gridContainer)}
      >
        {dataExists &&
          <MultiGrid
            fixedColumnCount={1}
            fixedRowCount={1}
            cellRenderer={this.cellRenderer}
            columnCount={columnCount}
            estimatedColumnSize={DEFAULT_COLUMN_WIDTH}
            columnWidth={this.measureColumnWidth}
            height={tableHeight}
            rowCount={rowCount}
            rowHeight={DEFAULT_ROW_HEIGHT}
            width={tableWidth}
            enableFixedColumnScroll={true}
            enableFixedRowScroll={true}
          />}
      </div>
    )
  }
}

const {arrayOf, number, shape, string} = PropTypes

TableGraph.defaultProps = {
  textWrapping: TABLE_TEXT_SINGLE_LINE,
}

TableGraph.propTypes = {
  cellHeight: number,
  data: arrayOf(shape()),
  textWrapping: string.isRequired,
}

export default TableGraph
