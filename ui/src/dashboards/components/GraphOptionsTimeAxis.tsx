// Libraries
import React, {SFC} from 'react'

// Components
import {Radio, ButtonShape} from 'src/reusable_ui'

interface GraphOptionsTimeAxisProps {
  verticalTimeAxis: boolean
  onToggleVerticalTimeAxis: (vertical: boolean) => void
}

const GraphOptionsTimeAxis: SFC<GraphOptionsTimeAxisProps> = ({
  verticalTimeAxis,
  onToggleVerticalTimeAxis,
}) => (
  <div className="form-group col-xs-12 col-sm-6">
    <label>Time Axis</label>
    <Radio shape={ButtonShape.StretchToFit}>
      <Radio.Button
        id="graph-time-axis--vertical"
        value={true}
        active={verticalTimeAxis}
        onClick={onToggleVerticalTimeAxis}
        titleText="Position time on the vertical table axis"
      >
        Vertical
      </Radio.Button>
      <Radio.Button
        id="graph-time-axis--horizontal"
        value={false}
        active={!verticalTimeAxis}
        onClick={onToggleVerticalTimeAxis}
        titleText="Position time on the horizontal table axis"
      >
        Horizontal
      </Radio.Button>
    </Radio>
  </div>
)

export default GraphOptionsTimeAxis
