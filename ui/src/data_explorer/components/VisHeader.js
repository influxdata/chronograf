import React, {PropTypes} from 'react'
import classnames from 'classnames'

const VisHeader = ({views, view, onToggleView, name}) => (
  <div className="graph-heading">
    {views.length
      ? <ul className="toggle toggle-sm">
          {views.map(v => (
            <li
              key={v}
              onClick={() => onToggleView(v)}
              className={classnames('toggle-btn ', {active: view === v})}
            >
              {v}
            </li>
          ))}
        </ul>
      : null}
    <div className="graph-title">{name}</div>
  </div>
)

const {arrayOf, func, string} = PropTypes

VisHeader.propTypes = {
  views: arrayOf(string).isRequired,
  view: string.isRequired,
  onToggleView: func.isRequired,
  name: string.isRequired,
}

export default VisHeader
