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
  onAppendScript: (appendage: string) => void
}

@ErrorHandling
class SchemaItemCategories extends PureComponent<Props> {
  public render() {
    const {source, db, notify, onAppendScript} = this.props

    return (
      <>
        <SchemaItemCategory
          source={source}
          db={db}
          type={CategoryType.Measurements}
          notify={notify}
          onAppendScript={onAppendScript}
        />
        <SchemaItemCategory
          source={source}
          db={db}
          type={CategoryType.Tags}
          notify={notify}
          onAppendScript={onAppendScript}
        />
        <SchemaItemCategory
          source={source}
          db={db}
          type={CategoryType.Fields}
          notify={notify}
          onAppendScript={onAppendScript}
        />
      </>
    )
  }
}

export default SchemaItemCategories
