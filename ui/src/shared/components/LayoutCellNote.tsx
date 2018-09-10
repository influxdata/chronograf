// Libraries
import React, {Component, CSSProperties} from 'react'
import classnames from 'classnames'
import Markdown from 'react-markdown'

// Components
import FancyScrollbar from 'src/shared/components/FancyScrollbar'

// Utils
import {humanizeNote} from 'src/dashboards/utils/notes'

// Constants
import {DEFAULT_CELL_BG_COLOR} from 'src/dashboards/constants'

// Types
import {CellType, NoteVisibility} from 'src/types/dashboards'

interface Props {
  note: string
  cellX: number
  cellY: number
  cellType: CellType
  visibility: NoteVisibility
  cellBackgroundColor: string
  cellTextColor: string
}

class LayoutCellNote extends Component<Props> {
  public render() {
    const {note, cellType, visibility} = this.props

    if (
      !note ||
      note === '' ||
      cellType === CellType.Note ||
      visibility === NoteVisibility.ShowWhenNoData
    ) {
      return null
    }

    return (
      <div className="dash-graph--note">
        <div className="dash-graph--note-icon" style={this.noteIconStyle}>
          <span className="icon chat" />
        </div>
        <div className={this.noteContentsClass}>
          <FancyScrollbar autoHide={false} autoHeight={true} maxHeight={140}>
            <div className="dash-graph--note-contents">
              <Markdown
                source={humanizeNote(note)}
                className="markdown-format"
              />
            </div>
          </FancyScrollbar>
        </div>
      </div>
    )
  }

  private get noteIconStyle(): CSSProperties {
    const {cellBackgroundColor, cellTextColor} = this.props

    if (cellBackgroundColor !== DEFAULT_CELL_BG_COLOR) {
      return {
        color: cellTextColor,
      }
    }
  }

  private get noteContentsClass(): string {
    const {cellX, cellY} = this.props

    return classnames('dash-graph--note-tooltip', {
      'dash-graph--note__top': cellY === 0,
      'dash-graph--note__bottom': cellY > 0,
      'dash-graph--note__left': cellX > 0,
      'dash-graph--note__right': cellX === 0,
    })
  }
}

export default LayoutCellNote
