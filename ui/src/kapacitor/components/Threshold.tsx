import * as React from 'react'
import * as PropTypes from 'prop-types'
import {OPERATORS} from 'kapacitor/constants'
import Dropdown from 'shared/components/Dropdown'
import * as _ from 'lodash'

const mapToItems = (arr, type) => arr.map(text => ({text, type}))
const operators = mapToItems(OPERATORS, 'operator')
const noopSubmit = e => e.preventDefault()
const getField = ({fields}) => {
  const alias = _.get(fields, ['0', 'alias'], false)
  if (!alias) {
    return _.get(fields, ['0', 'value'], 'Select a Time-Series')
  }

  return alias
}

const Threshold = ({
  rule: {values: {operator, value, rangeValue}},
  query,
  onDropdownChange,
  onRuleTypeInputChange,
}) =>
  <div className="rule-section--row rule-section--row-first rule-section--border-bottom">
    <p>Send Alert where</p>
    <span className="rule-builder--metric">
      {getField(query)}
    </span>
    <p>is</p>
    <Dropdown
      className="dropdown-180"
      menuClass="dropdown-malachite"
      items={operators}
      selected={operator}
      onChoose={onDropdownChange}
    />
    <form style={{display: 'flex'}} onSubmit={noopSubmit}>
      <input
        className="form-control input-sm form-malachite monotype"
        style={{width: '160px', marginLeft: '6px'}}
        type="text"
        name="lower"
        spellCheck="false"
        value={value}
        onChange={onRuleTypeInputChange}
        placeholder={
          operator === 'inside range' || operator === 'outside range'
            ? 'Lower'
            : null
        }
      />
      {(operator === 'inside range' || operator === 'outside range') &&
        <input
          className="form-control input-sm form-malachite monotype"
          name="upper"
          style={{width: '160px'}}
          placeholder="Upper"
          type="text"
          spellCheck="false"
          value={rangeValue}
          onChange={onRuleTypeInputChange}
        />}
    </form>
  </div>

const {shape, string, func} = PropTypes

Threshold.propTypes = {
  rule: shape({
    values: shape({
      operator: string,
      rangeOperator: string,
      value: string,
      rangeValue: string,
    }),
  }),
  onDropdownChange: func.isRequired,
  onRuleTypeInputChange: func.isRequired,
  query: shape({}).isRequired,
}

export default Threshold
