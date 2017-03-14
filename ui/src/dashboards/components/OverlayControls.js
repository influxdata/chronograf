import React from 'react'

import ConfirmButtons from 'src/admin/components/ConfirmButtons'

const OverlayControls = () => (
  <div className="overlay-controls">
    <h3>Graph</h3>
    <div>
      <h4>Type:</h4>
      <ul>
        <li>Line</li>
        <li>Stacked</li>
        <li>Step-plot</li>
        <li>SingleStat</li>
      </ul>
    </div>
    <ConfirmButtons />
  </div>
)

export default OverlayControls
