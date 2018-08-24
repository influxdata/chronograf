// Libraries
import React, {PureComponent} from 'react'

// Components
import {Radio, ComponentColor} from 'src/reusable_ui'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  areLogsVisible: boolean
  areLogsEnabled: boolean
  onToggleLogsVisibility: (visibility: boolean) => void
}

@ErrorHandling
class LogsToggle extends PureComponent<Props> {
  public render() {
    const {areLogsVisible, areLogsEnabled, onToggleLogsVisibility} = this.props

    return (
      <Radio color={ComponentColor.Success}>
        <Radio.Button
          id="tickscript-logs--hidden"
          active={!areLogsVisible}
          value={false}
          onClick={onToggleLogsVisibility}
          titleText="Show just the TICKscript Editor"
          disabledTitleText="Log viewing is currently disabled"
          disabled={!areLogsEnabled}
        >
          Editor
        </Radio.Button>
        <Radio.Button
          id="tickscript-logs--visible"
          active={areLogsVisible}
          value={true}
          onClick={onToggleLogsVisibility}
          titleText="Show the TICKscript Editor & Logs Viewer"
          disabledTitleText="Log viewing is currently disabled"
          disabled={!areLogsEnabled}
        >
          Editor + Logs
        </Radio.Button>
      </Radio>
    )
  }
}

export default LogsToggle
