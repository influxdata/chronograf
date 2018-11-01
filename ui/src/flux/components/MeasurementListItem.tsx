// Libraries
import React, {PureComponent, MouseEvent} from 'react'

// Components
import FieldList from 'src/flux/components/FieldList'
import {ErrorHandling} from 'src/shared/decorators/errors'

// Constants
import {OpenState} from 'src/flux/constants/explorer'

// types
import {Source, NotificationAction, RemoteDataState} from 'src/types'

interface Props {
  db: string
  source: Source
  searchTerm: string
  measurement: string
  fields: string[]
  notify: NotificationAction
  opened: OpenState
  loading: RemoteDataState
  onAddFilter?: (value: {[k: string]: string}) => void
}

interface State {
  opened: OpenState
}

@ErrorHandling
class MeasurementListItem extends PureComponent<Props, State> {
  public static getDerivedStateFromProps(props, state) {
    if (
      props.opened === OpenState.OPENED &&
      state.opened === OpenState.UNOPENED
    ) {
      return {...state, opened: props.opened}
    }
    return null
  }
  constructor(props: Props) {
    super(props)
    this.state = {
      opened: props.opened,
    }
  }

  public render() {
    const {db, source, measurement, fields, notify, loading} = this.props
    const {opened} = this.state
    const isOpen = opened === OpenState.OPENED
    const isUnopen = opened === OpenState.UNOPENED

    return (
      <div
        className={`flux-schema-tree flux-schema--child ${
          isOpen ? 'expanded' : ''
        }`}
        key={measurement}
        onClick={this.handleItemClick}
      >
        <div className="flux-schema--item">
          <div className="flex-schema-item-group flux-schema-item--expandable">
            <div className="flux-schema--expander" />
            {measurement}
            <span className="flux-schema--type">Measurement</span>
            <button
              className="button button-xs button-primary"
              onClick={this.handleAddFilter}
            >
              Add Filter
            </button>
          </div>
        </div>
        {!isUnopen && (
          <div className={`flux-schema--children ${isOpen ? '' : 'hidden'}`}>
            <FieldList
              db={db}
              source={source}
              notify={notify}
              fields={fields}
              measurement={measurement}
              loading={loading}
              onAddFilter={this.props.onAddFilter}
            />
          </div>
        )}
      </div>
    )
  }

  private handleAddFilter = (e: MouseEvent) => {
    e.stopPropagation()

    const {onAddFilter, measurement} = this.props

    if (!onAddFilter) {
      return
    }

    onAddFilter({_measurement: measurement})
  }

  private handleItemClick = (e): void => {
    e.stopPropagation()

    const opened = this.state.opened

    if (opened === OpenState.OPENED) {
      this.setState({opened: OpenState.ClOSED})
      return
    }
    this.setState({opened: OpenState.OPENED})
  }
}

export default MeasurementListItem
