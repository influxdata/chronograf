// Libraries
import React, {PureComponent, ChangeEvent, MouseEvent} from 'react'

// Components
import TagValueListItem from 'src/flux/components/TagValueListItem'
import LoaderSkeleton from 'src/flux/components/LoaderSkeleton'
import LoadingSpinner from 'src/flux/components/LoadingSpinner'

// apis
import {fetchTagValues} from 'src/shared/apis/flux/metaQueries'

// Utils
import {ErrorHandling} from 'src/shared/decorators/errors'
import DefaultDebouncer, {Debouncer} from 'src/shared/utils/debouncer'

// types
import {Source, NotificationAction, RemoteDataState, TimeRange} from 'src/types'

const TAG_VALUES_LIMIT = 25

interface Props {
  db: string
  source: Source
  timeRange: TimeRange
  tagKey: string
  notify: NotificationAction
  onAddFilter?: (value: {[k: string]: string}) => void
}

interface State {
  tagValues: string[]
  searchTerm: string
  loading: RemoteDataState
  loadingMoreValues: RemoteDataState
  limit: number
  shouldShowMoreValues: boolean
}

class TagValueList extends PureComponent<Props, State> {
  private debouncer: Debouncer = new DefaultDebouncer()

  constructor(props: Props) {
    super(props)

    this.state = {
      tagValues: [],
      searchTerm: '',
      loading: RemoteDataState.Loading,
      loadingMoreValues: RemoteDataState.NotStarted,
      limit: TAG_VALUES_LIMIT,
      shouldShowMoreValues: true,
    }
  }

  public async componentDidMount() {
    this.setState({loading: RemoteDataState.Loading})
    try {
      const tagValues = await this.fetchData()
      this.setState({
        tagValues,
        loading: RemoteDataState.Done,
        shouldShowMoreValues: tagValues.length >= TAG_VALUES_LIMIT,
      })
    } catch (error) {
      this.setState({loading: RemoteDataState.Error})
    }
  }

  public componentWillUnmount() {
    this.debouncer.cancelAll()
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
    const {source, db, tagKey, notify} = this.props
    const {searchTerm, loading, shouldShowMoreValues} = this.state

    if (loading === RemoteDataState.Error) {
      return (
        <div
          className={`flux-schema-tree flux-schema--child flux-schema-tree--error`}
          onClick={this.handleClick}
        >
          Could not fetch tag values
        </div>
      )
    }

    if (loading === RemoteDataState.Loading) {
      return <LoaderSkeleton />
    }

    const term = searchTerm.toLocaleLowerCase()
    const tagValues = this.state.tagValues.filter(
      tv => tv !== '' && tv.toLocaleLowerCase().includes(term)
    )

    if (tagValues.length) {
      return (
        <>
          {tagValues.map(tagValue => (
            <TagValueListItem
              source={source}
              db={db}
              searchTerm={searchTerm}
              tagValue={tagValue}
              tagKey={tagKey}
              key={tagValue}
              notify={notify}
              onAddFilter={this.props.onAddFilter}
            />
          ))}
          {shouldShowMoreValues && (
            <div className="flux-schema-tree flux-schema--child">
              <div className="flux-schema--item no-hover">
                <button
                  className="btn btn-xs btn-default increase-values-limit"
                  onClick={this.onLoadMoreValues}
                >
                  {this.loadMoreButtonValue}
                </button>
              </div>
            </div>
          )}
        </>
      )
    }
    return (
      <div className="flux-schema-tree flux-schema--child">
        <div className="flux-schema--item no-hover" onClick={this.handleClick}>
          <div className="no-results">
            {`No ${
              term ? 'matching ' : ''
            }tag values in the selected time range.`}
          </div>
        </div>
      </div>
    )
  }

  private get loadMoreButtonValue(): string | JSX.Element {
    const {tagKey} = this.props
    const {loadingMoreValues} = this.state

    if (loadingMoreValues === RemoteDataState.Loading) {
      return <LoadingSpinner />
    }
    return `Load next ${TAG_VALUES_LIMIT} values for ${tagKey}`
  }

  private fetchData = async (): Promise<string[]> => {
    const {source, timeRange, db, tagKey} = this.props
    const {searchTerm, limit} = this.state

    return await fetchTagValues({
      source,
      timeRange,
      bucket: db,
      tagKey,
      limit,
      searchTerm,
    })
  }

  private onSearch = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState(
      {
        searchTerm: e.target.value,
      },
      () => {
        try {
          this.debouncer.call(async () => {
            const tagValues = await this.fetchData()
            this.setState({tagValues})
          }, 50)
        } catch (error) {
          this.setState({
            loading: RemoteDataState.Error,
            loadingMoreValues: RemoteDataState.Error,
          })
        }
      }
    )
  }

  private handleClick = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation()
  }

  private onLoadMoreValues = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    const previousTagValuesCount = this.state.tagValues.length

    this.setState(
      {
        limit: this.state.limit + TAG_VALUES_LIMIT,
        loadingMoreValues: RemoteDataState.Loading,
      },
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      async () => {
        try {
          const tagValues = await this.fetchData()
          this.setState({
            tagValues,
            loading: RemoteDataState.Done,
            loadingMoreValues: RemoteDataState.Done,
          })
        } catch (error) {
          this.setState({
            loading: RemoteDataState.Error,
            loadingMoreValues: RemoteDataState.Error,
          })
        }

        if (
          this.state.tagValues.length <
          previousTagValuesCount + TAG_VALUES_LIMIT
        ) {
          this.setState({shouldShowMoreValues: false})
        }
      }
    )
  }
}

export default ErrorHandling(TagValueList)
