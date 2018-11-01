// Libraries
import React, {PureComponent, MouseEvent} from 'react'

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
  onAddFilter?: (value: {[k: string]: string}) => void
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
            <button
              className="button button-xs button-primary"
              onClick={this.handleAddFilter}
            >
              Add Filter
            </button>
          </div>
        </div>
      </div>
    )
  }

  private handleAddFilter = (e: MouseEvent) => {
    e.stopPropagation()

    const {onAddFilter, tagValue, tagKey} = this.props

    if (!onAddFilter) {
      return
    }

    onAddFilter({[tagKey]: tagValue})
  }

  private handleClick = (e): void => {
    e.stopPropagation()
  }
}

export default TagValueListItem
