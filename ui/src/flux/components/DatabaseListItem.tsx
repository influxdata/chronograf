import React, {PureComponent} from 'react'
import classnames from 'classnames'
import {CopyToClipboard} from 'react-copy-to-clipboard'

// Components
import SchemaExplorerTree from 'src/flux/components/SchemaExplorerTree'

// Constants
import {OpenState} from 'src/flux/constants/explorer'

// Types
import {
  notifyCopyToClipboardSuccess,
  notifyCopyToClipboardFailed,
} from 'src/shared/copy/notifications'
import {Source, NotificationAction} from 'src/types'
import SchemaItemCategories from 'src/flux/components/SchemaItemCategories'

interface Props {
  db: string
  source: Source
  notify: NotificationAction
}

interface State {
  opened: OpenState
  searchTerm: string
}

class DatabaseListItem extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      opened: OpenState.UNOPENED,
      searchTerm: '',
    }
  }

  public render() {
    const {db} = this.props

    return (
      <div className={this.className} onClick={this.handleClick}>
        <div className="flux-schema--item">
          <div className="flex-schema-item-group">
            <div className="flux-schema--expander" />
            {db}
            <span className="flux-schema--type">Bucket</span>
          </div>
          <CopyToClipboard text={db} onCopy={this.handleCopyAttempt}>
            <div className="flux-schema-copy" onClick={this.handleClickCopy}>
              <span className="icon duplicate" title="copy to clipboard" />
              Copy
            </div>
          </CopyToClipboard>
        </div>
        {this.categories}
      </div>
    )
  }

  private get categories(): JSX.Element {
    const {db, source, notify} = this.props
    const {opened} = this.state
    const isOpen = opened === OpenState.OPENED
    const isUnopen = opened === OpenState.UNOPENED

    if (!isUnopen) {
      return (
        <div className={`flux-schema--children ${isOpen ? '' : 'hidden'}`}>
          <SchemaExplorerTree bucket={db} source={source} key={db}>
            {() => (
              <SchemaItemCategories db={db} source={source} notify={notify} />
            )}
          </SchemaExplorerTree>
        </div>
      )
    }
  }

  private get className(): string {
    return classnames('flux-schema-tree', {
      expanded: this.state.opened === OpenState.OPENED,
    })
  }

  private handleClickCopy = e => {
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

  private handleClick = (e): void => {
    e.stopPropagation()

    const opened = this.state.opened

    if (opened === OpenState.OPENED) {
      this.setState({opened: OpenState.ClOSED})
      return
    }
    this.setState({opened: OpenState.OPENED})
  }
}

export default DatabaseListItem
