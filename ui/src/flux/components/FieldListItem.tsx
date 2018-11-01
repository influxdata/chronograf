import React, {PureComponent, MouseEvent} from 'react'

interface Props {
  field: string
  measurement?: string
  onAddFilter?: (value: {[k: string]: string}) => void
}

export default class extends PureComponent<Props> {
  public render() {
    const {field} = this.props
    return (
      <div
        className="flux-schema-tree flux-schema--child"
        key={field}
        onClick={this.handleClick}
      >
        <div className="flux-schema--item">
          <div className="flex-schema-item-group">
            {field}
            <span className="flux-schema--type">Field</span>
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
    const {onAddFilter, measurement, field} = this.props

    e.stopPropagation()

    if (!onAddFilter) {
      return
    }

    if (measurement) {
      onAddFilter({_measurement: measurement, _field: field})
    } else {
      onAddFilter({_field: field})
    }
  }

  private handleClick = (e: MouseEvent) => {
    e.stopPropagation()
  }
}
