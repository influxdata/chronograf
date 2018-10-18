import React, {PureComponent} from 'react'
import classnames from 'classnames'
import {CopyToClipboard} from 'react-copy-to-clipboard'

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
  onAppendScript: (appendage: string, db: string) => void
}

interface State {
  isOpen: boolean
  searchTerm: string
}

class DatabaseListItem extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      isOpen: false,
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
    const {db, source, notify, onAppendScript} = this.props
    const {isOpen} = this.state

    return (
      <div className={`flux-schema--children ${isOpen ? '' : 'hidden'}`}>
        <SchemaItemCategories
          db={db}
          source={source}
          notify={notify}
          onAppendScript={onAppendScript}
        />
      </div>
    )
  }

  private get className(): string {
    return classnames('flux-schema-tree', {
      expanded: this.state.isOpen,
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

  private handleClick = () => {
    this.setState({isOpen: !this.state.isOpen})
  }
}

export default DatabaseListItem
