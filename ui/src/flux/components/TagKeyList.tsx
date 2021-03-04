// Libraries
import React, {PureComponent, MouseEvent} from 'react'

// Components
import TagKeyListItem from 'src/flux/components/TagKeyListItem'
import LoaderSkeleton from 'src/flux/components/LoaderSkeleton'

// Utils
import {ErrorHandling} from 'src/shared/decorators/errors'

// types
import {Source, NotificationAction, RemoteDataState} from 'src/types'

interface Props {
  db: string
  source: Source
  tagKeys: string[]
  notify: NotificationAction
  loading: RemoteDataState
  onAddFilter?: (value: {[k: string]: string}) => void
}

interface State {
  searchTerm: string
}

const excludedTagKeys = ['_measurement', '_field', '_start', '_stop']

@ErrorHandling
class TagKeyList extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      searchTerm: '',
    }
  }

  public render() {
    return <>{this.tagKeys}</>
  }

  private get tagKeys(): JSX.Element | JSX.Element[] {
    const {db, source, notify, loading} = this.props

    if (loading === RemoteDataState.Error) {
      return (
        <div
          className={`flux-schema-tree flux-schema--child flux-schema-tree--error`}
          onClick={this.handleClick}
        >
          Could not fetch tag keys
        </div>
      )
    }
    if (loading !== RemoteDataState.Done) {
      return <LoaderSkeleton />
    }

    const tagKeys = this.props.tagKeys.filter(
      tk => !excludedTagKeys.includes(tk)
    )
    if (tagKeys.length) {
      return tagKeys.map(tagKey => (
        <TagKeyListItem
          db={db}
          source={source}
          tagKey={tagKey}
          key={tagKey}
          notify={notify}
          onAddFilter={this.props.onAddFilter}
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

  private handleClick = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation()
  }
}

export default TagKeyList
