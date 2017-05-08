import React, {PropTypes} from 'react'
import classnames from 'classnames'

import graphTypes from 'hson!shared/data/graphTypes.hson'

const OverlayControls = props => {
  const {selectedGraphType, onSelectGraphType} = props
  return (
    <div className="overlay-controls">
      <div className="overlay-control-group full-width">
        <h2>Visualization Type</h2>
        <ul className="toggle toggle-sm cell-editor--viz-type">
          {graphTypes.map(graphType => (
            <li
              key={graphType.type}
              className={classnames('toggle-btn', {
                active: graphType.type === selectedGraphType,
              })}
              onClick={() => onSelectGraphType(graphType.type)}
            >
              {graphType.menuOption}
            </li>
          ))}
          <li className="toggle-btn">Gauge</li>
        </ul>
      </div>
      <div className="overlay-control-group half-width">
        <h2>Left Y Axis</h2>
        <form>
          <div className="form-group col-xs-12">
            <label htmlFor="left-y-label">Axis Label</label>
            <input className="form-control input-sm" type="text" id="left-y-label"/>
          </div>
          <div className="form-group col-xs-6">
            <label htmlFor="left-y-min">Minimum</label>
            <input className="form-control input-sm" type="text" id="left-y-min"/>
          </div>
          <div className="form-group col-xs-6">
            <label htmlFor="left-y-max">Maximum</label>
            <input className="form-control input-sm" type="text" id="left-y-max"/>
          </div>
          <div className="form-group col-xs-6">
            <label htmlFor="left-y-units">Units</label>
            <select className="form-control input-sm"id="left-y-units">
              <option>None</option>
              <option>Bytes (B)</option>
              <option>Herz (Hz)</option>
              <option>Degrees</option>
            </select>
          </div>
          <div className="form-group col-xs-6">
            <label htmlFor="left-y-scale">Scale</label>
            <select className="form-control input-sm"id="left-y-scale">
              <option>Linear</option>
              <option>Logarithmic</option>
            </select>
          </div>
        </form>
      </div>
      <div className="overlay-control-group half-width">
        <h2>Right Y Axis</h2>
        <form>
          <div className="form-group col-xs-12">
            <label htmlFor="right-y-label">Axis Label</label>
            <input className="form-control input-sm" type="text" id="right-y-label"/>
          </div>
          <div className="form-group col-xs-6">
            <label htmlFor="right-y-min">Minimum</label>
            <input className="form-control input-sm" type="text" id="right-y-min"/>
          </div>
          <div className="form-group col-xs-6">
            <label htmlFor="right-y-max">Maximum</label>
            <input className="form-control input-sm" type="text" id="right-y-max"/>
          </div>
          <div className="form-group col-xs-6">
            <label htmlFor="right-y-units">Units</label>
            <select className="form-control input-sm"id="right-y-units">
              <option>None</option>
              <option>Bytes (B)</option>
              <option>Herz (Hz)</option>
              <option>Degrees</option>
            </select>
          </div>
          <div className="form-group col-xs-6">
            <label htmlFor="right-y-scale">Scale</label>
            <select className="form-control input-sm"id="right-y-scale">
              <option>Linear</option>
              <option>Logarithmic</option>
            </select>
          </div>
        </form>
      </div>
    </div>
  )
}

const {func, string} = PropTypes

OverlayControls.propTypes = {
  selectedGraphType: string.isRequired,
  onSelectGraphType: func.isRequired,
}

export default OverlayControls
