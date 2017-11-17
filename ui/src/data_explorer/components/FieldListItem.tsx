import * as React from 'react'
import * as classnames from 'classnames'
import * as _ from 'lodash'

import FunctionSelector from 'shared/components/FunctionSelector'
import {firstFieldName} from 'shared/reducers/helpers/fields'
import {QueryConfigField} from 'src/types'

export interface Field {
  value: string
  type: string
}

export interface FieldListItemProps {
  fieldFuncs: QueryConfigField[]
  onToggleField: (field: Field) => void
  onApplyFuncsToField: ({field, funcs}: {field: Field; funcs: string[]}) => void
  isSelected: boolean
  isKapacitorRule: boolean
  funcs: string[]
}

export interface FieldListItemState {
  isOpen: boolean
}

class FieldListItem extends React.Component<
  FieldListItemProps,
  FieldListItemState
> {
  public state = {
    isOpen: false,
  }

  private toggleFunctionsMenu = e => {
    if (e) {
      e.stopPropagation()
    }
    this.setState({isOpen: !this.state.isOpen})
  }

  private close = () => {
    this.setState({isOpen: false})
  }

  private handleToggleField = () => {
    const {onToggleField} = this.props
    const value = this._getFieldName()

    onToggleField({value, type: 'field'})
    this.close()
  }

  private handleApplyFunctions = selectedFuncs => {
    const {onApplyFuncsToField} = this.props
    const fieldName = this._getFieldName()
    const field = {value: fieldName, type: 'field'}

    onApplyFuncsToField({
      field,
      funcs: selectedFuncs.map(this._makeFunc),
    })
    this.close()
  }

  private _makeFunc = value => ({
    value,
    type: 'func',
  })

  private _getFieldName = () => {
    const {fieldFuncs} = this.props
    const fieldFunc = _.head(fieldFuncs)

    return _.get(fieldFunc, 'type') === 'field'
      ? _.get(fieldFunc, 'value')
      : firstFieldName(_.get(fieldFunc, 'args'))
  }

  public render() {
    const {isKapacitorRule, isSelected, funcs} = this.props
    const {isOpen} = this.state
    const fieldName = this._getFieldName()

    let fieldFuncsLabel
    const num = funcs.length
    switch (num) {
      case 0:
        fieldFuncsLabel = '0 Functions'
        break
      case 1:
        fieldFuncsLabel = `${num} Function`
        break
      default:
        fieldFuncsLabel = `${num} Functions`
        break
    }
    return (
      <div>
        <div
          className={classnames('query-builder--list-item', {
            active: isSelected,
          })}
          onClick={this.handleToggleField}
          data-test={`query-builder-list-item-field-${fieldName}`}
        >
          <span>
            <div className="query-builder--checkbox" />
            {fieldName}
          </span>
          {isSelected && (
            <div
              className={classnames('btn btn-xs', {
                active: isOpen,
                'btn-default': !num,
                'btn-primary': num,
              })}
              onClick={this.toggleFunctionsMenu}
              data-test={`query-builder-list-item-function-${fieldName}`}
            >
              {fieldFuncsLabel}
            </div>
          )}
        </div>
        {isSelected &&
          isOpen && (
            <FunctionSelector
              onApply={this.handleApplyFunctions}
              selectedItems={funcs}
              singleSelect={isKapacitorRule}
            />
          )}
      </div>
    )
  }
}

export default FieldListItem
