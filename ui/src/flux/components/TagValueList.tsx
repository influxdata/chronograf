// Libraries
import React, {PureComponent, ChangeEvent, MouseEvent} from 'react'

// Components
import TagValueListItem from 'src/flux/components/TagValueListItem'
import LoaderSkeleton from 'src/flux/components/LoaderSkeleton'

// apis
import {tagValues as fetchTagValues} from 'src/shared/apis/flux/metaQueries'

// Utils
import parseValuesColumn from 'src/shared/parsing/flux/values'
import {ErrorHandling} from 'src/shared/decorators/errors'

// types
import {Source, NotificationAction, RemoteDataState} from 'src/types'

interface Props {
  db: string
  source: Source
  tagKey: string
  notify: NotificationAction
  measurement: string
  onAppendScript: (appendage: string, db: string) => void
}

interface State {
  tagValues: string[]
  searchTerm: string
  loading: RemoteDataState
}

@ErrorHandling
class TagValueList extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      tagValues: [],
      searchTerm: '',
      loading: RemoteDataState.Loading,
    }
  }

  public async componentDidMount() {
    this.setState({loading: RemoteDataState.Loading})
    try {
      const tagValues = await this.fetchTagValues()
      this.setState({tagValues, loading: RemoteDataState.Done})
    } catch (error) {
      this.setState({loading: RemoteDataState.Error})
    }
  }

  public render() {
    const {tagKey} = this.props
    const {searchTerm} = this.state
    return (
      <>
        <div className="flux-schema--filter">
          <input
            className="form-control input-xs"
            placeholder={`Filter within ${tagKey}`}
            type="text"
            spellCheck={false}
            autoComplete="off"
            value={searchTerm}
            onClick={this.handleClick}
            onChange={this.onSearch}
          />
        </div>
        {this.tagValues}
      </>
    )
  }

  private get tagValues(): JSX.Element | JSX.Element[] {
    const {source, db, tagKey, measurement, notify, onAppendScript} = this.props
    const {searchTerm, loading} = this.state

    if (loading === RemoteDataState.Loading) {
      return <LoaderSkeleton />
    }

    const term = searchTerm.toLocaleLowerCase()
    const tagValues = this.state.tagValues.filter(
      tv => tv !== '' && tv.toLocaleLowerCase().includes(term)
    )

    if (tagValues.length) {
      return tagValues.map(tagValue => (
        <TagValueListItem
          source={source}
          db={db}
          searchTerm={searchTerm}
          tagValue={tagValue}
          tagKey={tagKey}
          measurement={measurement}
          key={tagValue}
          notify={notify}
          onAppendScript={onAppendScript}
        />
      ))
    }
    return (
      <div className="flux-schema-tree flux-schema--child">
        <div className="flux-schema--item no-hover" onClick={this.handleClick}>
          <div className="no-results">No more tag values.</div>
        </div>
      </div>
    )
  }

  private async fetchTagValues(): Promise<string[]> {
    const {source, db, tagKey, measurement} = this.props
    const limit = 50

    const filter = measurement
      ? [{key: '_measurement', value: measurement}]
      : []

    const response = await fetchTagValues({
      source,
      bucket: db,
      tagKey,
      filter,
      limit,
    })
    const tagValues = parseValuesColumn(response)
    return tagValues
  }

  private onSearch = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({
      searchTerm: e.target.value,
    })
  }

  private handleClick = (e: MouseEvent<HTMLInputElement>) => {
    e.stopPropagation()
  }
}

export default TagValueList
