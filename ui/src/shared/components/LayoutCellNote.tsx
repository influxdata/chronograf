// Libraries
import React, {Component} from 'react'
import classnames from 'classnames'
import Markdown from 'react-markdown'

// Components
import FancyScrollbar from 'src/shared/components/FancyScrollbar'

// Utils
import {humanizeNote} from 'src/dashboards/utils/notes'

// Types
import {CellType, CellNoteVisibility} from 'src/types/dashboards'

interface Props {
  note: string
  cellX: number
  cellY: number
  cellType: CellType
  visibility: CellNoteVisibility
}

class LayoutCellNote extends Component<Props> {
  public render() {
    const {note, cellType, visibility} = this.props

    if (
      !note ||
      note === '' ||
      note === undefined ||
      cellType === CellType.Note ||
      visibility === CellNoteVisibility.ShowWhenNoData
    ) {
      return null
    }

    return (
      <div className="dash-graph--note">
        <div className="dash-graph--note-icon">
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
