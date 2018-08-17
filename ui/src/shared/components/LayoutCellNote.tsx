// Libraries
import React, {Component} from 'react'

interface Props {
  note: string
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
          <span className="icon zap" />
        </div>
        <div className="dash-graph--note-contents">{note}</div>
      </div>
    )
  }
}

export default LayoutCellNote
