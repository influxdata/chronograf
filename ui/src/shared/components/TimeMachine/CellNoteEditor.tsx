// Libraries
import React, {Component} from 'react'
import {connect} from 'react-redux'

// Components
import {Controlled as ReactCodeMirror, IInstance} from 'react-codemirror2'
import {EditorChange} from 'codemirror'

// Actions
import {updateCellNote} from 'src/dashboards/actions/cellEditorOverlay'

interface Props {
  note: string
  handleUpdateCellNote: (note: string) => void
}

class CellNoteEditor extends Component<Props> {
  public render() {
    const {note} = this.props

    const options = {
      tabIndex: 1,
      mode: 'flux',
      readonly: false,
      lineNumbers: false,
      autoRefresh: true,
      theme: 'time-machine',
      completeSingle: false,
    }

    return (
      <div className="cell-note-editor">
        <div className="cell-note-editor--field">
          <ReactCodeMirror
            autoFocus={true}
            autoCursor={true}
            value={note}
            options={options}
            onBeforeChange={this.handleUpdateNote}
            onChange={this.handleChange}
            onTouchStart={this.onTouchStart}
          />
        </div>
      </div>
    )
  }

  private onTouchStart = () => {}

  private handleChange = (): void => {}

  private handleUpdateNote = (
    _: IInstance,
    __: EditorChange,
    note: string
  ): void => {
    this.props.handleUpdateCellNote(note)
  }
}

const mstp = ({
  cellEditorOverlay: {
    cell: {note},
  },
}) => ({
  note,
})

const mdtp = {
  handleUpdateCellNote: updateCellNote,
}

export default connect(mstp, mdtp)(CellNoteEditor)
