// Libraries
import React, {Component} from 'react'
import {connect} from 'react-redux'

// Components
import {Controlled as ReactCodeMirror} from 'react-codemirror2'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import {SlideToggle, ComponentSize} from 'src/reusable_ui'

// Actions
import {updateCellNote} from 'src/dashboards/actions/cellEditorOverlay'

interface Props {
  note: string
  handleUpdateCellNote: (note: string) => void
}

interface State {
  noteDraft: string
  editorIsFocused: boolean
  displayNoteWhenBadQuery: boolean
}

class CellNoteEditor extends Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      noteDraft: props.note,
      editorIsFocused: false,
      displayNoteWhenBadQuery: false,
    }
  }

  public render() {
    const {noteDraft, displayNoteWhenBadQuery} = this.state

    const options = {
      tabIndex: 1,
      mode: 'markdown',
      readonly: false,
      lineNumbers: false,
      autoRefresh: true,
      theme: 'markdown',
      completeSingle: false,
    }

    return (
      <FancyScrollbar className="cell-note-editor--container">
        <div className="cell-note-editor">
          <div className="cell-note-editor--header">Markdown is supported</div>
          <div className="cell-note-editor--field">
            <ReactCodeMirror
              autoCursor={true}
              value={noteDraft}
              options={options}
              onBeforeChange={this.handleChange}
              onTouchStart={this.onTouchStart}
              onFocus={this.handleFocus}
              onBlur={this.handleBlur}
            />
          </div>
          <div className="form-control-static cell-note-editor--display-option">
            <SlideToggle
              size={ComponentSize.ExtraSmall}
              onChange={this.handleSlideToggle}
              active={displayNoteWhenBadQuery}
            />
            <label>Display note in cell when query returns no results</label>
          </div>
        </div>
      </FancyScrollbar>
    )
  }

  private handleSlideToggle = (): void => {
    this.setState({
      displayNoteWhenBadQuery: !this.state.displayNoteWhenBadQuery,
    })
  }

  private handleFocus = (): void => {
    this.setState({editorIsFocused: true})
  }

  private handleBlur = (): void => {
    const {handleUpdateCellNote} = this.props
    const {noteDraft} = this.state

    this.setState({editorIsFocused: false})
    handleUpdateCellNote(noteDraft)
  }

  private onTouchStart = (): void => {}

  private handleChange = (_, __, note: string): void => {
    this.setState({noteDraft: note})
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
