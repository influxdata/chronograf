import * as React from 'react'
import * as PropTypes from 'prop-types'
import {PERIODS} from 'kapacitor/constants'
import Dropdown from 'shared/components/Dropdown'

const periods = PERIODS.map(text => {
  return {text}
})

const Deadman = ({rule, onChange}) =>
  <div className="rule-section--row rule-section--row-first rule-section--row-last">
    <p>Send Alert if Data is missing for</p>
    <Dropdown
      className="dropdown-80"
      menuClass="dropdown-malachite"
      items={periods}
      selected={rule.values.period}
      onChoose={onChange}
    />
  </div>

const {shape, string, func} = PropTypes

Deadman.propTypes = {
  rule: shape({
    values: shape({
      period: string,
    }),
  }),
  onChange: func.isRequired,
}

export default Deadman
