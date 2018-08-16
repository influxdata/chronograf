import React, {PureComponent} from 'react'

import CopyToClipboard from 'react-copy-to-clipboard'

import {
  notifyCopyToClipboardSuccess,
  notifyCopyToClipboardFailed,
} from 'src/shared/copy/notifications'

import {NotificationAction} from 'src/types'

interface Props {
  formattedValue: string
  notify: NotificationAction
}

class LogsMessage extends PureComponent<Props> {
  public render() {
    const {formattedValue} = this.props

    return (
      <div className="logs-message">
        {formattedValue}
        <CopyToClipboard text={formattedValue} onCopy={this.handleCopyAttempt}>
          <div className="logs-message--copy" title="copy to clipboard">
            <span className="icon duplicate" />
            Copy
          </div>
        </CopyToClipboard>
      </div>
    )
  }

  private handleCopyAttempt = (
    copiedText: string,
    isSuccessful: boolean
  ): void => {
    const {notify} = this.props
    const text = copiedText.slice(0, 20).trimRight()
    const truncatedText = `${text}...`
    const title = 'Log message '

    if (isSuccessful) {
      notify(notifyCopyToClipboardSuccess(truncatedText, title))
    } else {
      notify(notifyCopyToClipboardFailed(truncatedText, title))
    }
  }
}

export default LogsMessage
