import React, {Component} from 'react'
import classnames from 'classnames'
import chroma from 'chroma-js'
import {isCellUntitled} from 'src/dashboards/utils/cellGetters'
import {DEFAULT_CELL_BG_COLOR} from 'src/dashboards/constants'
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  isEditable: boolean
  cellName: string
  makeSpaceForCellNote: boolean
  cellBackgroundColor: string
  cellTextColor: string
}

@ErrorHandling
class LayoutCellHeader extends Component<Props> {
  public render() {
    return (
      <div className={this.headingClass}>
        {this.cellName}
        {this.headingBar}
      </div>
    )
  }

  private get headingClass(): string {
    const {isEditable} = this.props

    return classnames('dash-graph--heading', {
      'dash-graph--draggable': isEditable,
      'dash-graph--heading-draggable': isEditable,
    })
  }

  private get cellName(): JSX.Element {
    const {
      cellName,
      makeSpaceForCellNote,
      cellTextColor,
      cellBackgroundColor,
    } = this.props

    const className = classnames('dash-graph--name', {
      'dash-graph--name__default': isCellUntitled(cellName),
      'dash-graph--name__note': makeSpaceForCellNote,
    })

    let nameStyle = {}

    if (cellBackgroundColor !== DEFAULT_CELL_BG_COLOR) {
      nameStyle = {
        color: cellTextColor,
      }
    }

    return (
      <span className={className} style={nameStyle}>
        {cellName}
      </span>
    )
  }

  private get headingBar(): JSX.Element {
    const {isEditable, cellBackgroundColor} = this.props

    if (isEditable) {
      let barStyle

      if (cellBackgroundColor !== DEFAULT_CELL_BG_COLOR) {
        barStyle = {
          backgroundColor: chroma(cellBackgroundColor).brighten(),
        }
      }

      return (
        <>
          <div className="dash-graph--heading-bar" style={barStyle} />
          <div className="dash-graph--heading-dragger" />
        </>
      )
    }
  }
}

export default LayoutCellHeader
