// Libraries
import React, {PureComponent} from 'react'

// Components
import SchemaItemCategory, {
  CategoryType,
} from 'src/flux/components/SchemaItemCategory'
import {ErrorHandling} from 'src/shared/decorators/errors'

// Types
import {Source, NotificationAction} from 'src/types'

interface Props {
  source: Source
  db: string
  notify: NotificationAction
}

@ErrorHandling
class SchemaItemCategories extends PureComponent<Props> {
  public render() {
    const {source, db, notify} = this.props

    return (
      <>
        <SchemaItemCategory
          source={source}
          db={db}
          type={CategoryType.Measurements}
          notify={notify}
        />
        <SchemaItemCategory
          source={source}
          db={db}
          type={CategoryType.Tags}
          notify={notify}
        />
        <SchemaItemCategory
          source={source}
          db={db}
          type={CategoryType.Fields}
          notify={notify}
        />
      </>
    )
  }
}

export default SchemaItemCategories
