import React, {PureComponent, MouseEvent} from 'react'

import CopyToClipboard from 'react-copy-to-clipboard'

import {
  notifyCopyToClipboardSuccess,
  notifyCopyToClipboardFailed,
} from 'src/shared/copy/notifications'
import {getMatchSections} from 'src/logs/utils/matchSections'
import {Button, IconFont, ComponentColor, ComponentSize} from 'src/reusable_ui'

import {NotificationAction} from 'src/types'

interface Props {
  formattedValue: string
  notify: NotificationAction
  searchPattern?: string
}

class LogsMessage extends PureComponent<Props> {
  public render() {
    const {formattedValue} = this.props

    return (
      <div className="logs-message">
        {this.messageSections}
        <CopyToClipboard text={formattedValue} onCopy={this.handleCopyAttempt}>
          <Button
            size={ComponentSize.ExtraSmall}
            color={ComponentColor.Primary}
            customClass="logs-message--copy"
            titleText="copy to clipboard"
            icon={IconFont.Duplicate}
            text="Copy"
            onClick={this.handleClickCopy}
          />
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
    const {searchPattern, formattedValue} = this.props

    if (!searchPattern) {
      return formattedValue
    }

    const sections = getMatchSections(searchPattern, formattedValue)

    return sections.map(s => (
      <span key={s.id} className={`logs-message--${s.type}`}>
        {s.text}
      </span>
    ))
  }

  private handleClickCopy(e: MouseEvent<HTMLDivElement>) {
    e.stopPropagation()
    e.preventDefault()
  }
}

export default LogsMessage
