// Libraries
import React, {Component} from 'react'
import {connect} from 'react-redux'
import classnames from 'classnames'

// Components
import {Controlled as ReactCodeMirror} from 'react-codemirror2'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import {SlideToggle, ComponentSize} from 'src/reusable_ui'

// Actions
import {
  updateCellNote,
  UpdateCellNoteVisibility,
} from 'src/dashboards/actions/cellEditorOverlay'

// Types
import {CellNoteVisibility} from 'src/types/dashboards'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  note: string
  noteVisibility: CellNoteVisibility
  handleUpdateCellNote: (note: string) => void
  handleUpdateCellNoteVisibility: (noteVisibility: CellNoteVisibility) => void
}

interface State {
  noteDraft: string
  editorIsFocused: boolean
}

@ErrorHandling
class CellNoteEditor extends Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      noteDraft: props.note,
      editorIsFocused: false,
    }
  }

  public render() {
    const {noteVisibility} = this.props
    const {noteDraft} = this.state

    const options = {
      tabIndex: 1,
      mode: 'markdown',
      readonly: false,
      lineNumbers: false,
      autoRefresh: true,
      theme: 'markdown',
      completeSingle: false,
      lineWrapping: true,
      placeholder:
        'Notes are a great way to help others on your team use dashboards more effectively.\nYou can also talk to your future self!\n\nWhy not add a note?',
    }

    return (
      <FancyScrollbar className="cell-note-editor--container">
        <div className="cell-note-editor">
          <div className="cell-note-editor--header">Markdown is supported</div>
          <div className={this.fieldClassName}>
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
              active={noteVisibility === CellNoteVisibility.ShowWhenNoData}
            />
            <label>Display note in cell when query returns no results</label>
          </div>
        </div>
      </FancyScrollbar>
    )
  }

  private handleSlideToggle = (): void => {
    const {noteVisibility, handleUpdateCellNoteVisibility} = this.props

    if (noteVisibility === CellNoteVisibility.Default) {
      handleUpdateCellNoteVisibility(CellNoteVisibility.ShowWhenNoData)
    } else {
      handleUpdateCellNoteVisibility(CellNoteVisibility.Default)
    }
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

  private get fieldClassName(): string {
    const {editorIsFocused} = this.state

    return classnames('cell-note-editor--field', {focus: editorIsFocused})
  }
}

const mstp = ({
  cellEditorOverlay: {
    cell: {note, noteVisibility},
  },
}) => ({
  note,
  noteVisibility,
})

const mdtp = {
  handleUpdateCellNote: updateCellNote,
  handleUpdateCellNoteVisibility: UpdateCellNoteVisibility,
}

export default connect(mstp, mdtp)(CellNoteEditor)
