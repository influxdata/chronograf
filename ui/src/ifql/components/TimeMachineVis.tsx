import React, {SFC} from 'react'
import uuid from 'uuid'

interface Props {
  tabs: string[]
}
const TimeMachineVis: SFC<Props> = ({tabs}) => (
  <div className="time-machine-visualization">
    <div className="time-machine--graph-header">
      <div className="time-machine--graph-title">Visualize</div>
      <ul className="time-machine--tabs">
        {tabs.map(tab => (
          <li key={uuid.v4()} className="time-machine--tab">
            {tab}
          </li>
        ))}
      </ul>
    </div>
    <div className="time-machine--graph" />
  </div>
)

export default TimeMachineVis
