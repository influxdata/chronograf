// Libraries
import React, {PureComponent, MouseEvent} from 'react'

// Components
import TagKeyListItem from 'src/flux/components/TagKeyListItem'
import LoaderSkeleton from 'src/flux/components/LoaderSkeleton'

// Utils
import {ErrorHandling} from 'src/shared/decorators/errors'

// types
import {Source, NotificationAction} from 'src/types'

interface Props {
  db: string
  measurement?: string
  source: Source
  tagKeys: string[]
  notify: NotificationAction
}

interface State {
  searchTerm: string
}

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
    const {db, source, notify, measurement} = this.props

    if (!this.props.tagKeys.length) {
      return <LoaderSkeleton />
    }

    const excludedTagKeys = ['_measurement', '_field']
    const tagKeys = this.props.tagKeys.filter(
      tk => !excludedTagKeys.includes(tk)
    )
    if (tagKeys.length) {
      return tagKeys.map(tagKey => (
        <TagKeyListItem
          db={db}
          source={source}
          tagKey={tagKey}
          measurement={measurement}
          key={tagKey}
          notify={notify}
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
