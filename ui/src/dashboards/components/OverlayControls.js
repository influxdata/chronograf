import React from 'react'

import ConfirmButtons from 'src/admin/components/ConfirmButtons'

const OverlayControls = () => (
  <div className="overlay-controls">
    <h3 className="overlay--graph-name">Graph Editor</h3>
    <div className="overlay-controls--right">
      <p>Visualization Type:</p>
      <ul className="toggle toggle-sm">
        <li className="toggle-btn active">Line</li>
        <li className="toggle-btn">Stacked</li>
        <li className="toggle-btn">Step-plot</li>
        <li className="toggle-btn">SingleStat</li>
      </ul>
      <ConfirmButtons />
    </div>
  </div>
)

export default OverlayControls
