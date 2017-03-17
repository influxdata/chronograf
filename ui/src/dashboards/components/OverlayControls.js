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
          {graphTypes.map(graphType =>
            <li
              key={graphType.type}
              className={classnames('toggle-btn', {active: graphType.type === selectedGraphType.type})}
              onClick={() => onSelectGraphType(graphType)}
            >
              {graphType.menuOption}
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
  shape,
  string,
} = PropTypes

OverlayControls.propTypes = {
  graphTypes: arrayOf(shape({
    type: string.isRequired,
    menuOption: string.isRequired,
  })).isRequired,
  selectedGraphType: string.isRequired,
  onSelectGraphType: func.isRequired,
}

export default OverlayControls
