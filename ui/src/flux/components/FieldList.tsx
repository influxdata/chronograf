// Libraries
import React, {PureComponent, ChangeEvent, MouseEvent} from 'react'
import {CopyToClipboard} from 'react-copy-to-clipboard'

// Components
import LoaderSkeleton from 'src/flux/components/LoaderSkeleton'

// Utils
import {ErrorHandling} from 'src/shared/decorators/errors'
import {
  notifyCopyToClipboardSuccess,
  notifyCopyToClipboardFailed,
} from 'src/shared/copy/notifications'

// types
import {Source, NotificationAction} from 'src/types'

interface Props {
  db: string
  source: Source
  measurement?: string
  fields: string[]
  notify: NotificationAction
}

interface State {
  searchTerm: string
}

@ErrorHandling
class FieldList extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      searchTerm: '',
    }
  }

  public render() {
    const {searchTerm} = this.state

    return (
      <>
        {!this.props.measurement && (
          <div className="flux-schema--filter">
            <input
              className="form-control input-xs"
              placeholder={'Filter Fields'}
              type="text"
              spellCheck={false}
              autoComplete="off"
              value={searchTerm}
              onClick={this.handleInputClick}
              onChange={this.onSearch}
            />
          </div>
        )}
        {this.fields}
      </>
    )
  }

  private get fields(): JSX.Element | JSX.Element[] {
    const {searchTerm} = this.state

    if (!this.props.fields.length) {
      return <LoaderSkeleton />
    }

    const term = searchTerm.toLocaleLowerCase()
    const fields = this.props.fields.filter(f =>
      f.toLocaleLowerCase().includes(term)
    )

    if (fields.length) {
      return fields.map(field => (
        <div
          className="flux-schema-tree flux-schema--child"
          key={field}
          onClick={this.handleClick}
        >
          <div className="flux-schema--item">
            <div className="flex-schema-item-group">
              {field}
              <span className="flux-schema--type">Field</span>
            </div>
            <CopyToClipboard text={field} onCopy={this.handleCopyAttempt}>
              <div className="flux-schema-copy" onClick={this.handleClick}>
                <span className="icon duplicate" title="copy to clipboard" />
                Copy
              </div>
            </CopyToClipboard>
          </div>
        </div>
      ))
    }

    return (
      <div className="flux-schema-tree flux-schema--child">
        <div className="flux-schema--item no-hover" onClick={this.handleClick}>
          <div className="no-results">No more fields.</div>
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

  private onSearch = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({
      searchTerm: e.target.value,
    })
  }

  private handleInputClick = (e: MouseEvent<HTMLInputElement>) => {
    e.stopPropagation()
  }
}

export default FieldList
