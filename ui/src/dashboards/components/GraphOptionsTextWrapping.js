import React from 'react'
import PropTypes from 'prop-types'

import {
  TABLE_TEXT_SINGLE_LINE,
  TABLE_TEXT_WRAP,
  TABLE_TEXT_TRUNCATE,
} from 'shared/constants/tableGraph'

// TODO: Needs major refactoring to make thresholds a much more general component to be shared between single stat, gauge, and table.
const GraphOptionsTextWrapping = ({wrapping, onToggleTextWrapping}) => {
  return (
    <div className="form-group col-xs-12">
      <label>Text Wrapping</label>
      <ul className="nav nav-tablist nav-tablist-sm">
        <li
          className={`${wrapping === TABLE_TEXT_TRUNCATE ? 'active' : ''}`}
          onClick={onToggleTextWrapping(TABLE_TEXT_TRUNCATE)}
        >
          Truncate
        </li>
        <li
          className={`${wrapping === TABLE_TEXT_WRAP ? 'active' : ''}`}
          onClick={onToggleTextWrapping(TABLE_TEXT_WRAP)}
        >
          Wrap
        </li>
        <li
          className={`${wrapping === TABLE_TEXT_SINGLE_LINE ? 'active' : ''}`}
          onClick={onToggleTextWrapping(TABLE_TEXT_SINGLE_LINE)}
        >
          Single Line
        </li>
      </ul>
    </div>
  )
}
const {func, string} = PropTypes

GraphOptionsTextWrapping.propTypes = {
  wrapping: string,
  onToggleTextWrapping: func,
}

export default GraphOptionsTextWrapping
