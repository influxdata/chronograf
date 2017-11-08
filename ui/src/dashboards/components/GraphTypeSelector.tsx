import * as React from 'react'
import * as classnames from 'classnames'

import {graphTypes} from 'dashboards/graphics/graph'
import {GraphType} from 'src/types'

export interface GraphTypeSelectorProps {
  selectedGraphType: GraphType
  onSelectGraphType: (type: GraphType) => () => void
}

const GraphTypeSelector: React.SFC<GraphTypeSelectorProps> = ({
  selectedGraphType,
  onSelectGraphType,
}) => (
  <div className="display-options--cell display-options--cellx2">
    <h5 className="display-options--header">Visualization Type</h5>
    <div className="viz-type-selector">
      {graphTypes.map(graphType => (
        <div
          key={graphType.type}
          className={classnames('viz-type-selector--option', {
            active: graphType.type === selectedGraphType,
          })}
        >
          <div onClick={onSelectGraphType(graphType.type)}>
            {graphType.graphic}
            <p>{graphType.menuOption}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default GraphTypeSelector
