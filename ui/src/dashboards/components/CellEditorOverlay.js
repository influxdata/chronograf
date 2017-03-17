import React, {Component} from 'react'

import ResizeContainer, {ResizeBottom} from 'src/shared/components/ResizeContainer'
import QueryBuilder from 'src/data_explorer/components/QueryBuilder'
import Visualization from 'src/data_explorer/components/Visualization'
import OverlayControls from 'src/dashboards/components/OverlayControls'

const graphTypes = [
  'Line',
  'Stacked',
  'Step-Plot',
  'SingleStat',
]

const autoRefresh = 60000

const timeRange = {
  upper: 'now()',
  lower: '5m',
}

const queries = []
const activeQueryID = null

class CellEditorOverlay extends Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedGraphType: 'Line', // TODO inherit from props
    }

    this.handleSelectGraphType = ::this.handleSelectGraphType
  }

  handleSelectGraphType(type) {
    this.setState({selectedGraphType: type})
  }

  render() {
    return (
      <div className="data-explorer overlay-technology">
        <ResizeContainer>
          <Visualization
            autoRefresh={autoRefresh}
            timeRange={timeRange}
            queryConfigs={queries}
            activeQueryID={activeQueryID}
            activeQueryIndex={0}
          />
          <ResizeBottom>
            <OverlayControls
              graphTypes={graphTypes}
              selectedGraphType={this.state.selectedGraphType}
              onSelectGraphType={this.handleSelectGraphType}
            />
            <QueryBuilder
              queries={queries}
              autoRefresh={autoRefresh}
              timeRange={timeRange}
              setActiveQuery={() => {}}
              activeQueryID={activeQueryID}
            />
          </ResizeBottom>
        </ResizeContainer>
      </div>
    )
  }
}

export default CellEditorOverlay
