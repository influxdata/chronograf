import * as React from 'react'
import ReactTooltip from 'react-tooltip'

const graphTipsText =
  '<h1>Graph Tips:</h1><p><code>Click + Drag</code> Zoom in (X or Y)<br/><code>Shift + Click</code> Pan Graph Window<br/><code>Double Click</code> Reset Graph Window</p>'

const GraphTips = ({graphTipsText}) =>
  <div
    className="graph-tips"
    data-for="graph-tips-tooltip"
    data-tip={graphTipsText}
  >
    <span>?</span>
    <ReactTooltip
      id="graph-tips-tooltip"
      effect="solid"
      html={true}
      place="bottom"
      class="influx-tooltip"
    />
  </div>

export default GraphTips
