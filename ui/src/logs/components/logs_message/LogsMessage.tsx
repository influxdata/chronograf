import React, {PureComponent} from 'react'
import _ from 'lodash'

import CopyToClipboard from 'react-copy-to-clipboard'

import {
  notifyCopyToClipboardSuccess,
  notifyCopyToClipboardFailed,
} from 'src/shared/copy/notifications'
import {getMatchSections} from 'src/logs/utils/matchSections'

import {NotificationAction} from 'src/types'
import {Filter} from 'src/types/logs'

interface Props {
  formattedValue: string
  notify: NotificationAction
  filters: Filter[]
}

class LogsMessage extends PureComponent<Props> {
  public render() {
    const {formattedValue} = this.props

    return (
      <div className="logs-message">
        {this.messageSections}
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

  private get messageSections(): JSX.Element[] | string {
    const {filters, formattedValue} = this.props

    if (_.isEmpty(filters)) {
      return formattedValue
    }

    const sections = getMatchSections(filters, formattedValue)

    return sections.map(s => (
      <span key={s.id} className={`logs-message--${s.type}`}>
        {s.text}
      </span>
    ))
  }
}

export default LogsMessage
