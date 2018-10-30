// Libraries
import React, {PureComponent} from 'react'

// types
import {Source, NotificationAction} from 'src/types'
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  db: string
  source: Source
  searchTerm: string
  tagValue: string
  tagKey: string
  notify: NotificationAction
  measurement: string
}

@ErrorHandling
class TagValueListItem extends PureComponent<Props> {
  public render() {
    const {tagValue} = this.props
    return (
      <div
        className={`flux-schema-tree flux-schema--child`}
        key={tagValue}
        onClick={this.handleClick}
      >
        <div className="flux-schema--item">
          <div className="flex-schema-item-group">
            {tagValue}
            <span className="flux-schema--type">Tag Value</span>
          </div>
        </div>
      </div>
    )
  }

  private handleClick = (e): void => {
    e.stopPropagation()
  }
}

export default TagValueListItem
