import React, {PropTypes} from 'react'
import classnames from 'classnames'

import ConfirmButtons from 'src/admin/components/ConfirmButtons'

const OverlayControls = (props) => {
  const {graphTypes, selectedGraphType, onSelectGraphType} = props
  return (
    <div className="overlay-controls">
      <h3 className="overlay--graph-name">Graph Editor</h3>
      <div className="overlay-controls--right">
        <p>Visualization Type:</p>
        <ul className="toggle toggle-sm">
          {graphTypes.map(type =>
            <li
              key={type}
              className={classnames('toggle-btn', {active: type === selectedGraphType})}
              onClick={() => onSelectGraphType(type)}>{type}
            </li>
          )}
        </ul>
        <ConfirmButtons />
      </div>
    </div>
  )
}

const {
  arrayOf,
  func,
  string,
} = PropTypes

OverlayControls.propTypes = {
  graphTypes: arrayOf(string).isRequired,
  selectedGraphType: string.isRequired,
  onSelectGraphType: func.isRequired,
}

export default OverlayControls
