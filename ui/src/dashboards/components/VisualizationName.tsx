// Libraries
import React, {Component, ChangeEvent, KeyboardEvent} from 'react'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  name: string
  handleRenameCell: (name: string) => void
}

interface State {
  workingName: string
  isEditing: boolean
}

@ErrorHandling
class VisualizationName extends Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      workingName: props.name,
      isEditing: false,
    }
  }

  public render() {
    const {workingName, isEditing} = this.state

    if (isEditing) {
      return (
        <div className="rename-dashboard">
          <input
            type="text"
            className="rename-dashboard--input form-control input-sm"
            value={workingName}
            onChange={this.handleChange}
            autoFocus={true}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
            onKeyDown={this.handleKeyDown}
            placeholder="Name this Cell..."
            spellCheck={false}
          />
        </div>
      )
    }

    return (
      <div className="rename-dashboard" data-test="rename-graph">
        <div className="rename-dashboard--title" onClick={this.handleClick}>
          {workingName}
          <span className="icon pencil" />
        </div>
      </div>
    )
  }

  private handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    this.setState({workingName: e.target.value})
  }

  private handleBlur = (): void => {
    const {handleRenameCell} = this.props
    const {workingName} = this.state

    this.setState({isEditing: false})
    handleRenameCell(workingName)
  }

  private handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    const {handleRenameCell} = this.props
    const {workingName} = this.state

    if (e.key === 'Enter' || e.key === 'Escape') {
      handleRenameCell(workingName)
      this.setState({isEditing: false})
    }
  }

  private handleFocus = (e: ChangeEvent<HTMLInputElement>): void => {
    e.target.select()
    this.setState({isEditing: true})
  }

  private handleClick = (): void => {
    this.setState({isEditing: true})
  }
}

export default VisualizationName
