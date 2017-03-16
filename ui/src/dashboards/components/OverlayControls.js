import React, {PropTypes} from 'react'
import classnames from 'classnames'

import ConfirmButtons from 'src/admin/components/ConfirmButtons'

const OverlayControls = (props) => {
  const {graphTypes, selectedGraphType, onSelectGraphType} = props
  return (
    <div className="overlay-controls">
      <h3>Graph</h3>
      <div>
        <h4>Type:</h4>
        <ul>
          {graphTypes.map(type =>
            <li
              key={type}
              className={classnames('radioItem', {selected: type === selectedGraphType})}
              onClick={() => onSelectGraphType(type)}>{type}
            </li>
          )}
        </ul>
      </div>
      <ConfirmButtons />
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
