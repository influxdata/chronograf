// Libraries
import React, {PureComponent, ChangeEvent, MouseEvent} from 'react'

// Components
import LoaderSkeleton from 'src/flux/components/LoaderSkeleton'
import FieldListItem from 'src/flux/components/FieldListItem'

// Utils
import {ErrorHandling} from 'src/shared/decorators/errors'
// types
import {Source, NotificationAction, RemoteDataState} from 'src/types'

interface Props {
  db: string
  source: Source
  measurement?: string
  fields: string[]
  notify: NotificationAction
  loading: RemoteDataState
  onAddFilter?: (value: {[k: string]: string}) => void
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
    const {loading, measurement, onAddFilter} = this.props
    const {searchTerm} = this.state

    if (loading === RemoteDataState.Error) {
      return (
        <div
          className={`flux-schema-tree flux-schema--child flux-schema-tree--error`}
          onClick={this.handleClick}
        >
          Could not fetch fields
        </div>
      )
    }
    if (loading !== RemoteDataState.Done) {
      return <LoaderSkeleton />
    }
    const term = searchTerm.toLocaleLowerCase()
    const fields = this.props.fields.filter(f =>
      f.toLocaleLowerCase().includes(term)
    )

    if (fields.length) {
      return fields.map(field => (
        <FieldListItem
          key={`fieldlistitem-${field}`}
          field={field}
          measurement={measurement}
          onAddFilter={onAddFilter}
        />
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
