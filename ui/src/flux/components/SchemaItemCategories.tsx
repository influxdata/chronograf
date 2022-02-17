// Libraries
import React, {PureComponent} from 'react'

// Components
import SchemaItemCategory, {
  CategoryType,
} from 'src/flux/components/SchemaItemCategory'
import {ErrorHandling} from 'src/shared/decorators/errors'

// Types
import {Source, NotificationAction, TimeRange} from 'src/types'
import {CategoryTree} from 'src/flux/components/SchemaExplorerTree'

interface Props {
  source: Source
  timeRange: TimeRange
  db: string
  categoryTree: CategoryTree
  notify: NotificationAction
}

@ErrorHandling
class SchemaItemCategories extends PureComponent<Props> {
  public render() {
    const {source, timeRange, db, categoryTree, notify} = this.props

    return (
      <>
        <SchemaItemCategory
          source={source}
          timeRange={timeRange}
          db={db}
          type={CategoryType.Measurements}
          categoryTree={categoryTree}
          notify={notify}
        />
        <SchemaItemCategory
          source={source}
          timeRange={timeRange}
          db={db}
          type={CategoryType.Tags}
          categoryTree={categoryTree}
          notify={notify}
        />
        <SchemaItemCategory
          source={source}
          timeRange={timeRange}
          db={db}
          type={CategoryType.Fields}
          categoryTree={categoryTree}
          notify={notify}
        />
      </>
    )
  }
}

export default SchemaItemCategories
