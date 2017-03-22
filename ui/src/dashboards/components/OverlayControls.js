import React, {PropTypes} from 'react'
import classnames from 'classnames'

import ConfirmButtons from 'src/admin/components/ConfirmButtons'

import graphTypes from 'hson!shared/data/graphTypes.hson'

const OverlayControls = (props) => {
  const {onCancel, onSave, selectedGraphType, onSelectGraphType} = props
  return (
    <div className="overlay-controls">
      <h3 className="overlay--graph-name">Graph Editor</h3>
      <div className="overlay-controls--right">
        <p>Visualization Type:</p>
        <ul className="toggle toggle-sm">
          {graphTypes.map(graphType =>
            <li
              key={graphType.type}
              className={classnames('toggle-btn', {active: graphType.type === selectedGraphType})}
              onClick={() => onSelectGraphType(graphType.type)}
            >
              {graphType.menuOption}
            </li>
          )}
        </ul>
        <ConfirmButtons onCancel={onCancel} onConfirm={onSave} />
      </div>
    </div>
  )
}

const {
  func,
  string,
} = PropTypes

OverlayControls.propTypes = {
  onCancel: func.isRequired,
  onSave: func.isRequired,
  selectedGraphType: string.isRequired,
  onSelectGraphType: func.isRequired,
}

export default OverlayControls
