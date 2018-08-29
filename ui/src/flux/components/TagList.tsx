import React, {PureComponent, MouseEvent} from 'react'

import TagListItem from 'src/flux/components/TagListItem'

import {SchemaFilter, Service, NotificationAction} from 'src/types'

interface Props {
  db: string
  service: Service
  tags: string[]
  filter: SchemaFilter[]
  notify: NotificationAction
}

export default class TagList extends PureComponent<Props> {
  public render() {
    const {db, service, tags, filter, notify} = this.props

    if (tags.length) {
      return (
        <>
          {tags.map(t => (
            <TagListItem
              db={db}
              key={t}
              tagKey={t}
              service={service}
              filter={filter}
              notify={notify}
            />
          ))}
        </>
      )
    }

    return (
      <div className="flux-schema-tree flux-schema--child">
        <div className="flux-schema--item no-hover" onClick={this.handleClick}>
          <div className="no-results">No more tag keys.</div>
        </div>
      </div>
    )
  }

  private handleClick(e: MouseEvent<HTMLDivElement>) {
    e.stopPropagation()
  }
}
