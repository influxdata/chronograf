// Libraries
import React, {PureComponent} from 'react'
import {CopyToClipboard} from 'react-copy-to-clipboard'

// Utils
import {
  notifyCopyToClipboardSuccess,
  notifyCopyToClipboardFailed,
} from 'src/shared/copy/notifications'

// types
import {Source, NotificationAction} from 'src/types'
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  db: string
  source: Source
  searchTerm: string
  tagValue: string
  tagKey: string
  notify: NotificationAction
  measurement: string
}

@ErrorHandling
class TagValueListItem extends PureComponent<Props> {
  public render() {
    const {tagValue} = this.props
    return (
      <div
        className={`flux-schema-tree flux-schema--child`}
        key={tagValue}
        onClick={this.handleClick}
      >
        <div className="flux-schema--item">
          <div className="flex-schema-item-group">
            {tagValue}
            <span className="flux-schema--type">Tag Value</span>
          </div>
          <CopyToClipboard text={tagValue} onCopy={this.handleCopyAttempt}>
            <div className="flux-schema-copy" onClick={this.handleClick}>
              <span className="icon duplicate" title="copy to clipboard" />
              Copy
            </div>
          </CopyToClipboard>
        </div>
      </div>
    )
  }

  private handleClick = (e): void => {
    e.stopPropagation()
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
}

export default TagValueListItem
