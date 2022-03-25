// Libraries
import React, {PureComponent} from 'react'

// Components
import MeasurementList from 'src/flux/components/MeasurementList'
import FieldList from 'src/flux/components/FieldList'
import TagKeyList from 'src/flux/components/TagKeyList'
import {ErrorHandling} from 'src/shared/decorators/errors'

// Constants
import {OpenState} from 'src/flux/constants/explorer'

// Utils
import {
  TimeMachineContainer,
  TimeMachineContextConsumer,
} from 'src/shared/utils/TimeMachineContext'

// Types
import {Source, NotificationAction, TimeRange} from 'src/types'
import {CategoryTree} from 'src/flux/components/SchemaExplorerTree'
import TimeRangeLabel from 'src/shared/components/TimeRangeLabel'

export enum CategoryType {
  Measurements = 'measurements',
  Fields = 'fields',
  Tags = 'tags',
}

interface ConnectedProps {
  onAddFilter?: (db: string, value: {[k: string]: string}) => void
}

interface PassedProps {
  source: Source
  timeRange: TimeRange
  notify: NotificationAction
  db: string
  categoryTree: CategoryTree
  type: CategoryType
}

interface State {
  opened: OpenState
}

@ErrorHandling
class SchemaItemCategory extends PureComponent<
  PassedProps & ConnectedProps,
  State
> {
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
        <div
          className="flux-schema--item"
          onClick={this.handleClick}
          data-test="schema-category-field"
        >
          <div className="flex-schema-item-group flux-schema-item--expandable">
            <div
              className="flux-schema--expander"
              data-test="schema-category-item"
            />
            {this.categoryName}
            <span className="flux-schema--type">
              (<TimeRangeLabel timeRange={this.props.timeRange} />)
            </span>
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
    const {type, db, timeRange, source, notify, categoryTree} = this.props

    switch (type) {
      case CategoryType.Measurements:
        return (
          <MeasurementList
            db={db}
            source={source}
            notify={notify}
            measurements={categoryTree.measurements}
            loading={categoryTree.measurementsLoading}
            onAddFilter={this.handleAddFilter}
          />
        )

      case CategoryType.Fields:
        return (
          <FieldList
            db={db}
            source={source}
            notify={notify}
            fields={categoryTree.fields}
            loading={categoryTree.fieldsLoading}
            onAddFilter={this.handleAddFilter}
          />
        )

      case CategoryType.Tags:
        return (
          <TagKeyList
            db={db}
            source={source}
            timeRange={timeRange}
            notify={notify}
            tagKeys={categoryTree.tagKeys}
            loading={categoryTree.tagsLoading}
            onAddFilter={this.handleAddFilter}
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

  private handleAddFilter = (filter: {[key: string]: string}) => {
    this.props.onAddFilter(this.props.db, filter)
  }
}

const ConnectedSchemaItemCategory = (props: PassedProps) => {
  return (
    <TimeMachineContextConsumer>
      {(container: TimeMachineContainer) => {
        return (
          <SchemaItemCategory
            {...props}
            onAddFilter={container.handleAddFilter}
          />
        )
      }}
    </TimeMachineContextConsumer>
  )
}

export default ConnectedSchemaItemCategory
