// Libraries
import React, {PureComponent} from 'react'

// Components
import MeasurementList from 'src/flux/components/MeasurementList'
import FieldList from 'src/flux/components/FieldList'
import TagKeyList from 'src/flux/components/TagKeyList'
import {ErrorHandling} from 'src/shared/decorators/errors'

// Constants
import {OpenState} from 'src/flux/constants/explorer'

// Types
import {Source, NotificationAction} from 'src/types'

export enum CategoryType {
  Measurements = 'measurements',
  Fields = 'fields',
  Tags = 'tags',
}

interface Props {
  source: Source
  notify: NotificationAction
  db: string
  type: CategoryType
  onAppendScript: (appendage: string) => void
}

interface State {
  opened: OpenState
}

@ErrorHandling
class SchemaItemCategory extends PureComponent<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      opened: OpenState.UNOPENED,
    }
  }

  public render() {
    const {opened} = this.state
    const isOpen = opened === OpenState.OPENED
    const isUnopened = opened === OpenState.UNOPENED

    return (
      <div
        className={`flux-schema-tree flux-schema--child ${
          isOpen ? 'expanded' : ''
        }`}
      >
        <div className="flux-schema--item" onClick={this.handleClick}>
          <div className="flex-schema-item-group">
            <div className="flux-schema--expander" />
            {this.categoryName}
          </div>
        </div>
        {!isUnopened && (
          <div className={`flux-schema--children ${isOpen ? '' : 'hidden'}`}>
            {this.itemList}
          </div>
        )}
      </div>
    )
  }

  private get categoryName(): string {
    switch (this.props.type) {
      case CategoryType.Measurements:
        return 'MEASUREMENTS'
      case CategoryType.Fields:
        return 'FIELDS'
      case CategoryType.Tags:
        return 'TAGS'
    }
  }

  private get itemList(): JSX.Element {
    const {type, db, source, notify, onAppendScript} = this.props

    switch (type) {
      case CategoryType.Measurements:
        return (
          <MeasurementList
            db={db}
            source={source}
            notify={notify}
            onAppendScript={onAppendScript}
          />
        )

      case CategoryType.Fields:
        return (
          <FieldList
            db={db}
            source={source}
            notify={notify}
            onAppendScript={onAppendScript}
          />
        )
      case CategoryType.Tags:
        return (
          <TagKeyList
            db={db}
            source={source}
            notify={notify}
            onAppendScript={onAppendScript}
          />
        )
    }
  }

  private handleClick = e => {
    e.stopPropagation()
    const opened = this.state.opened

    if (opened === OpenState.OPENED) {
      this.setState({opened: OpenState.ClOSED})
      return
    }
    this.setState({opened: OpenState.OPENED})
  }
}

export default SchemaItemCategory
