// Libraries
import React, {PureComponent, ChangeEvent, MouseEvent} from 'react'

// Components
import TagKeyListItem from 'src/flux/components/TagKeyListItem'
import LoaderSkeleton from 'src/flux/components/LoaderSkeleton'

// apis
import {tagKeys as fetchTagKeys} from 'src/shared/apis/flux/metaQueries'

// Utils
import parseValuesColumn from 'src/shared/parsing/flux/values'
import {ErrorHandling} from 'src/shared/decorators/errors'

// types
import {Source, NotificationAction, RemoteDataState} from 'src/types'

interface Props {
  db: string
  measurement?: string
  source: Source
  notify: NotificationAction
  onAppendScript: (appendage: string) => void
}

interface State {
  tagKeys: string[]
  searchTerm: string
  loading: RemoteDataState
}

@ErrorHandling
class TagKeyList extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      tagKeys: [],
      searchTerm: '',
      loading: RemoteDataState.NotStarted,
    }
  }

  public async componentDidMount() {
    this.setState({loading: RemoteDataState.Loading})
    try {
      const tagKeys = await this.fetchTagKeys()
      this.setState({tagKeys, loading: RemoteDataState.Done})
    } catch (error) {
      this.setState({loading: RemoteDataState.Error})
    }
  }

  public render() {
    const {measurement} = this.props
    const {searchTerm} = this.state

    return (
      <>
        <div className="flux-schema--filter">
          <input
            className="form-control input-xs"
            placeholder={`Filter within ${measurement || 'Tags'}`}
            type="text"
            spellCheck={false}
            autoComplete="off"
            value={searchTerm}
            onClick={this.handleClick}
            onChange={this.onSearch}
          />
        </div>
        {this.tagKeys}
      </>
    )
  }

  private get tagKeys(): JSX.Element | JSX.Element[] {
    const {db, source, notify, measurement, onAppendScript} = this.props
    const {searchTerm, loading} = this.state

    if (loading === RemoteDataState.Loading) {
      return <LoaderSkeleton />
    }

    const excludedTagKeys = ['_measurement', '_field']
    const term = searchTerm.toLocaleLowerCase()
    const tagKeys = this.state.tagKeys.filter(
      tk =>
        !excludedTagKeys.includes(tk) && tk.toLocaleLowerCase().includes(term)
    )
    if (tagKeys.length) {
      return tagKeys.map(tagKey => (
        <TagKeyListItem
          db={db}
          source={source}
          searchTerm={searchTerm}
          tagKey={tagKey}
          measurement={measurement}
          key={tagKey}
          notify={notify}
          onAppendScript={onAppendScript}
        />
      ))
    }
    return (
      <div className="flux-schema-tree flux-schema--child">
        <div className="flux-schema--item no-hover" onClick={this.handleClick}>
          <div className="no-results">No more tag keys.</div>
        </div>
      </div>
    )
  }

  private async fetchTagKeys(): Promise<string[]> {
    const {source, db, measurement} = this.props
    const filter = measurement
      ? [{key: '_measurement', value: measurement}]
      : []

    const response = await fetchTagKeys(source, db, filter)
    const tagKeys = parseValuesColumn(response)
    return tagKeys
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

export default TagKeyList
