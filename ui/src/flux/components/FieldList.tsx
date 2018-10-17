// Libraries
import React, {PureComponent, ChangeEvent, MouseEvent} from 'react'
import {CopyToClipboard} from 'react-copy-to-clipboard'

// Components
import LoaderSkeleton from 'src/flux/components/LoaderSkeleton'

// APIS
import {fields as fetchFields} from 'src/shared/apis/flux/metaQueries'

// Utils
import {ErrorHandling} from 'src/shared/decorators/errors'
import parseValuesColumn from 'src/shared/parsing/flux/values'
import {
  notifyCopyToClipboardSuccess,
  notifyCopyToClipboardFailed,
} from 'src/shared/copy/notifications'

// types
import {Source, NotificationAction, RemoteDataState} from 'src/types'

interface Props {
  db: string
  source: Source
  tag?: {key: string; value: string}
  measurement?: string
  notify: NotificationAction
  onAppendScript: (appendage: string) => void
}

interface State {
  fields: string[]
  searchTerm: string
  loading: RemoteDataState
}

@ErrorHandling
class FieldList extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      fields: [],
      searchTerm: '',
      loading: RemoteDataState.NotStarted,
    }
  }

  public async componentDidMount() {
    this.setState({loading: RemoteDataState.Loading})
    try {
      const fields = await this.fetchFields()
      this.setState({fields, loading: RemoteDataState.Done})
    } catch (error) {
      this.setState({loading: RemoteDataState.Error})
    }
  }

  public render() {
    const {tag} = this.props
    const {searchTerm} = this.state

    return (
      <>
        <div className="flux-schema--filter">
          <input
            className="form-control input-xs"
            placeholder={`Filter within ${(tag && tag.value) || 'Fields'}`}
            type="text"
            spellCheck={false}
            autoComplete="off"
            value={searchTerm}
            onClick={this.handleInputClick}
            onChange={this.onSearch}
          />
        </div>
        {this.fields}
      </>
    )
  }

  private get fields(): JSX.Element | JSX.Element[] {
    const {searchTerm, loading} = this.state

    if (loading === RemoteDataState.Loading) {
      return <LoaderSkeleton />
    }

    const term = searchTerm.toLocaleLowerCase()
    const fields = this.state.fields.filter(f =>
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
            <button
              className="btn btn-xs btn-primary make-filter"
              onClick={this.handleMakeFilter(field)}
            >
              Make Filter
            </button>
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

  private async fetchFields(): Promise<string[]> {
    const {source, db} = this.props

    const filter = this.filters
    const limit = 50

    const response = await fetchFields(source, db, filter, limit)
    const fields = parseValuesColumn(response)
    return fields
  }

  private get filters(): Array<{value: string; key: string}> {
    const {tag, measurement} = this.props
    const filters = []
    if (tag) {
      filters.push(tag)
    }
    if (measurement) {
      filters.push({key: '_measurement', value: measurement})
    }

    return filters
  }

  private handleClick = (e): void => {
    e.stopPropagation()
  }

  private handleMakeFilter = field => (e): void => {
    e.stopPropagation()
    const {onAppendScript, tag, measurement} = this.props

    let filter = `|> filter(fn: (r) => r._field == "${field}")`

    if (tag && !measurement) {
      filter = `|> filter(fn: (r) => (r._field == "${field}" AND r.${
        tag.key
      } == "${tag.value}"))`
    }

    if (!tag && measurement) {
      filter = `|> filter(fn: (r) => (r._measurement == "${measurement}" AND r._field == "${field}"))`
    }

    if (tag && measurement) {
      filter = `|> filter(fn: (r) => (r._measurement == "${measurement}" AND r._field == "${field}" AND r.${
        tag.key
      } == "${tag.value}"))`
    }

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
