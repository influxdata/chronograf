import React from 'react'
import ReactTooltip from 'react-tooltip'

const GraphTips = React.createClass({
  render() {
    const graphTipsText = `<p><b>Graph Tips:</b><br/><br/><code>Click + Drag</code> Zoom in (X or Y)</p><p><code>Shift + Click</code> Pan Graph Window</p><p><code>Double Click</code> Reset Graph Window</p>`
    return (
      <div className="graph-tips" data-for="graph-tips-tooltip" data-tip={graphTipsText}>
        <span>?</span>
        <ReactTooltip id="graph-tips-tooltip" effect="solid" html={true} offset={{top: 2}} place="bottom" class="influx-tooltip place-bottom" />
      </div>
    )
  },
})

export default GraphTips