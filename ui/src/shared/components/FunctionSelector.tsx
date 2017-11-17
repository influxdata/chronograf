import * as React from 'react'
import * as classnames from 'classnames'
import * as _ from 'lodash'
import {INFLUXQL_FUNCTIONS} from 'data_explorer/constants'

export interface FunctionSelectorProps {
  onApply: (items: string[]) => void
  selectedItems: string[]
  singleSelect?: boolean
}

export interface FunctionSelectorState {
  localSelectedItems: string[]
}

class FunctionSelector extends React.Component<
  FunctionSelectorProps,
  FunctionSelectorState
> {
  constructor(props: FunctionSelectorProps) {
    super(props)

    this.state = {
      localSelectedItems: this.props.selectedItems,
    }
  }

  private onSelect = (item, e) => {
    e.stopPropagation()

    const {localSelectedItems} = this.state

    let nextItems
    if (this.isSelected(item)) {
      nextItems = localSelectedItems.filter(i => i !== item)
    } else {
      nextItems = [...localSelectedItems, item]
    }

    this.setState({localSelectedItems: nextItems})
  }

  private onSingleSelect = item => {
    if (item === this.state.localSelectedItems[0]) {
      this.props.onApply([])
      this.setState({localSelectedItems: []})
    } else {
      this.props.onApply([item])
      this.setState({localSelectedItems: [item]})
    }
  }

  private isSelected = item => {
    return !!this.state.localSelectedItems.find(text => text === item)
  }

  private handleApplyFunctions = e => {
    e.stopPropagation()

    this.props.onApply(this.state.localSelectedItems)
  }

  public componentWillUpdate(nextProps: FunctionSelectorProps) {
    if (!_.isEqual(this.props.selectedItems, nextProps.selectedItems)) {
      this.setState({localSelectedItems: nextProps.selectedItems})
    }
  }

  public render() {
    const {localSelectedItems} = this.state
    const {singleSelect} = this.props

    return (
      <div className="function-selector">
        {!singleSelect && (
          <div className="function-selector--header">
            <span>
              {localSelectedItems.length > 0
                ? `${localSelectedItems.length} Selected`
                : 'Select functions below'}
            </span>
            <div
              className="btn btn-xs btn-success"
              onClick={this.handleApplyFunctions}
              data-test="function-selector-apply"
            >
              Apply
            </div>
          </div>
        )}
        <div className="function-selector--grid">
          {INFLUXQL_FUNCTIONS.map((f, i) => {
            return (
              <div
                key={i}
                className={classnames('function-selector--item', {
                  active: this.isSelected(f),
                })}
                onClick={_.wrap(
                  f,
                  singleSelect ? this.onSingleSelect : this.onSelect
                )}
                data-test={`function-selector-item-${f}`}
              >
                {f}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}

export default FunctionSelector
