// Libraries
import React, {PureComponent} from 'react'
import {CopyToClipboard} from 'react-copy-to-clipboard'

// Components
import TagKeyList from 'src/flux/components/TagKeyList'
import {ErrorHandling} from 'src/shared/decorators/errors'

// Utils
import {
  notifyCopyToClipboardSuccess,
  notifyCopyToClipboardFailed,
} from 'src/shared/copy/notifications'

// Constants
import {OpenState} from 'src/flux/constants/explorer'

// types
import {Source, NotificationAction} from 'src/types'

interface Props {
  db: string
  source: Source
  searchTerm: string
  measurement: string
  notify: NotificationAction
  onAppendScript: (appendage: string) => void
}

interface State {
  opened: OpenState
}

@ErrorHandling
class MeasurementListItem extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      opened: OpenState.UNOPENED,
    }
  }

  public render() {
    const {db, source, measurement, notify, onAppendScript} = this.props
    const {opened} = this.state
    const isOpen = opened === OpenState.OPENED
    const isUnopen = opened === OpenState.UNOPENED

    return (
      <div
        className={`flux-schema-tree flux-schema--child ${
          isOpen ? 'expanded' : ''
        }`}
        key={measurement}
        onClick={this.handleItemClick}
      >
        <div className="flux-schema--item">
          <div className="flex-schema-item-group">
            <div className="flux-schema--expander" />
            {measurement}
            <span className="flux-schema--type">Measurement</span>
          </div>
          <button
            className="btn btn-xs btn-primary make-filter"
            onClick={this.handleMakeFilter}
          >
            Make Filter
          </button>
          <CopyToClipboard text={measurement} onCopy={this.handleCopyAttempt}>
            <div className="flux-schema-copy" onClick={this.handleClickCopy}>
              <span className="icon duplicate" title="copy to clipboard" />
              Copy
            </div>
          </CopyToClipboard>
        </div>
        {!isUnopen && (
          <div className={`flux-schema--children ${isOpen ? '' : 'hidden'}`}>
            <TagKeyList
              db={db}
              source={source}
              notify={notify}
              measurement={measurement}
              onAppendScript={onAppendScript}
            />
          </div>
        )}
      </div>
    )
  }

  private handleClickCopy = (e): void => {
    e.stopPropagation()
  }

  private handleMakeFilter = (e): void => {
    e.stopPropagation()
    const {measurement, onAppendScript} = this.props

    const filter = `|> filter(fn: (r) => r._measurement == "${measurement}")`

    onAppendScript(filter)
  }

  private handleCopyAttempt = (
    copiedText: string,
    isSuccessful: boolean
  ): void => {
    const {notify} = this.props
    if (isSuccessful) {
      notify(notifyCopyToClipboardSuccess(copiedText))
    } else {
      notify(notifyCopyToClipboardFailed(copiedText))
    }
  }

  private handleItemClick = (e): void => {
    e.stopPropagation()

    const opened = this.state.opened

    if (opened === OpenState.OPENED) {
      this.setState({opened: OpenState.ClOSED})
      return
    }
    this.setState({opened: OpenState.OPENED})
  }
}

export default MeasurementListItem
