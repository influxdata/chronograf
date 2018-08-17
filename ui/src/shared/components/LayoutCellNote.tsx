// Libraries
import React, {Component} from 'react'
import classnames from 'classnames'

// Components
import FancyScrollbar from 'src/shared/components/FancyScrollbar'

interface Props {
  note: string
  cellX: number
  cellY: number
}

class LayoutCellNote extends Component<Props> {
  public render() {
    const {note} = this.props

    if (note === '') {
      return null
    }

    return (
      <div className="dash-graph--note">
        <div className="dash-graph--note-icon">
          <span className="icon chat" />
        </div>
        <div className={this.noteContentsClass}>
          <FancyScrollbar autoHide={false} autoHeight={true} maxHeight={140}>
            <div className="dash-graph--note-contents">{note}</div>
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
