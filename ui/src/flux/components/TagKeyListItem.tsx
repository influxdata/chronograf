// Libraries
import React, {PureComponent} from 'react'
import {CopyToClipboard} from 'react-copy-to-clipboard'

// Components
import TagValueList from 'src/flux/components/TagValueList'

// Utils
import {
  notifyCopyToClipboardSuccess,
  notifyCopyToClipboardFailed,
} from 'src/shared/copy/notifications'
import {ErrorHandling} from 'src/shared/decorators/errors'

// Constants
import {OpenState} from 'src/flux/constants/explorer'

// types
import {Source, NotificationAction} from 'src/types'

interface Props {
  db: string
  source: Source
  tagKey: string
  measurement?: string
  notify: NotificationAction
}

interface State {
  opened: OpenState
}

@ErrorHandling
class TagKeyListItem extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      opened: OpenState.UNOPENED,
    }
  }

  public render() {
    const {db, source, tagKey, notify, measurement} = this.props
    const {opened} = this.state
    const isOpen = opened === OpenState.OPENED
    const isUnopen = opened === OpenState.UNOPENED

    return (
      <div
        className={`flux-schema-tree flux-schema--child ${
          isOpen ? 'expanded' : ''
        }`}
        key={tagKey}
        onClick={this.handleItemClick}
      >
        <div className="flux-schema--item">
          <div className="flex-schema-item-group">
            <div className="flux-schema--expander" />
            {tagKey}
            <span className="flux-schema--type">Tag Key</span>
          </div>
          <CopyToClipboard text={tagKey} onCopy={this.handleCopyAttempt}>
            <div className="flux-schema-copy" onClick={this.handleClickCopy}>
              <span className="icon duplicate" title="copy to clipboard" />
              Copy
            </div>
          </CopyToClipboard>
        </div>
        {!isUnopen && (
          <div className={`flux-schema--children ${isOpen ? '' : 'hidden'}`}>
            <TagValueList
              db={db}
              source={source}
              tagKey={tagKey}
              measurement={measurement}
              notify={notify}
            />
          </div>
        )}
      </div>
    )
  }

  private handleClickCopy = (e): void => {
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

export default TagKeyListItem
