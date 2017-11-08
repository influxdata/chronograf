import * as React from 'react'
import * as _ from 'lodash'

import LayoutCellMenu from 'shared/components/LayoutCellMenu'
import LayoutCellHeader from 'shared/components/LayoutCellHeader'
import {errorThrown} from 'shared/actions/errors'
import {dashboardtoCSV} from 'shared/parsing/resultsToCSV'
import download from 'external/download'

import {Cell} from 'src/types'

export interface LayoutCellProps {
  cell: Cell
  celldata: Cell[]
  onDeleteCell: (cell: Cell) => void
  onSummonOverlayTechnologies: (cell: Cell) => void
  isEditable: boolean
}

export interface LayoutCellState {
  isDeleting: boolean
}

class LayoutCell extends React.Component<LayoutCellProps, LayoutCellState> {
  public state = {
    isDeleting: false,
  }

  private closeMenu = () => {
    this.setState({
      isDeleting: false,
    })
  }

  private handleDeleteClick = () => {
    this.setState({isDeleting: true})
  }

  private handleDeleteCell = cell => () => {
    this.props.onDeleteCell(cell)
  }

  private handleSummonOverlay = cell => () => {
    this.props.onSummonOverlayTechnologies(cell)
  }

  private handleCSVDownload = cell => () => {
    const joinedName = cell.name.split(' ').join('_')
    const {celldata} = this.props
    try {
      download(dashboardtoCSV(celldata), `${joinedName}.csv`, 'text/plain')
    } catch (error) {
      errorThrown(error, 'Unable to download .csv file')
      console.error(error)
    }
  }

  public render() {
    const {cell, children, isEditable, celldata} = this.props

    const {isDeleting} = this.state
    const queries = _.get(cell, ['queries'], [])

    return (
      <div className="dash-graph">
        <LayoutCellMenu
          cell={cell}
          dataExists={!!celldata.length}
          isDeleting={isDeleting}
          isEditable={isEditable}
          onDelete={this.handleDeleteCell}
          onEdit={this.handleSummonOverlay}
          handleClickOutside={this.closeMenu}
          onDeleteClick={this.handleDeleteClick}
          onCSVDownload={this.handleCSVDownload}
        />
        <LayoutCellHeader
          queries={queries}
          cellName={cell.name}
          isEditable={isEditable}
        />
        <div className="dash-graph--container">
          {queries.length ? (
            children
          ) : (
            <div className="graph-empty">
              <button
                className="no-query--button btn btn-md btn-primary"
                onClick={this.handleSummonOverlay(cell)}
              >
                <span className="icon plus" /> Add Graph
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }
}

export default LayoutCell
