import React, {Component} from 'react'

import {Page} from 'src/reusable_ui'
import LogsToggle from 'src/kapacitor/components/LogsToggle'
import ConfirmButton from 'src/shared/components/ConfirmButton'
import TickscriptSave from 'src/kapacitor/components/TickscriptSave'
import {Task} from 'src/types'

interface Props {
  task: Task
  unsavedChanges: boolean
  areLogsVisible: boolean
  areLogsEnabled: boolean
  isNewTickscript: boolean
  onSave: () => void
  onExit: () => void
  onToggleLogsVisibility: (visibility: boolean) => void
  onOpenBuilderUI: () => void
}

class TickscriptHeader extends Component<Props> {
  public render() {
    const {
      task,
      onSave,
      unsavedChanges,
      isNewTickscript,
      areLogsEnabled,
      areLogsVisible,
      onToggleLogsVisibility,
      onOpenBuilderUI,
    } = this.props

    return (
      <Page.Header fullWidth={true}>
        <Page.Header.Left>
          <Page.Title title="TICKscript Editor" />
        </Page.Header.Left>
        <Page.Header.Right showSourceIndicator={true}>
          {!!task.query && !task.templateID ? (
            <button
              className="btn btn-sm btn-primary"
              title="Open TICKscript in Alert Rule Builder"
              onClick={onOpenBuilderUI}
            >
              Alert Rule Builder
            </button>
          ) : undefined}
          {isNewTickscript ? (
            <button
              className="btn btn-sm btn-default"
              title="Use Alert Rule Builder to create a new TICKscript"
              onClick={onOpenBuilderUI}
            >
              Alert Rule Builder
            </button>
          ) : undefined}

          <LogsToggle
            areLogsEnabled={areLogsEnabled}
            areLogsVisible={areLogsVisible}
            onToggleLogsVisibility={onToggleLogsVisibility}
          />
          {task.templateID ? undefined : (
            <TickscriptSave
              task={task}
              onSave={onSave}
              unsavedChanges={unsavedChanges}
              isNewTickscript={isNewTickscript}
            />
          )}
          {this.saveButton}
        </Page.Header.Right>
      </Page.Header>
    )
  }

  private get saveButton(): JSX.Element {
    const {unsavedChanges, onExit} = this.props

    if (unsavedChanges) {
      return (
        <ConfirmButton
          text="Exit"
          confirmText="Discard unsaved changes?"
          confirmAction={onExit}
        />
      )
    }

    return (
      <button
        className="btn btn-default btn-sm"
        title="Return to Alert Rules"
        onClick={onExit}
      >
        Exit
      </button>
    )
  }
}

export default TickscriptHeader
