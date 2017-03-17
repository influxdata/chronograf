import React, {Component, PropTypes} from 'react'

import ResizeContainer, {ResizeBottom} from 'src/shared/components/ResizeContainer'
import QueryBuilder from 'src/data_explorer/components/QueryBuilder'
import Visualization from 'src/data_explorer/components/Visualization'
import OverlayControls from 'src/dashboards/components/OverlayControls'
import graphTypes from 'hson!shared/data/graphTypes.hson'

const autoRefresh = 60000

const timeRange = {
  upper: 'now()',
  lower: '5m',
}

class CellEditorOverlay extends Component {
  constructor(props) {
    super(props)

    this.handleSelectGraphType = ::this.handleSelectGraphType
    this.handleSetActiveQuery = ::this.handleSetActiveQuery
    this.findGraphType = ::this.findGraphType

    const {cell: {queries, type}} = props
    const selectedGraphType = this.findGraphType(type)
    const activeQueryID = queries.length ?
      queries.map(({queryConfig}) => queryConfig.id)[0] :
      null

    this.state = {
      selectedGraphType,
      activeQueryID,
    }
  }

  findGraphType(type) {
    return graphTypes.find((graphType) => graphType.type === type)
  }

  handleSelectGraphType(graphType) {
    this.setState({selectedGraphType: graphType})
  }

  handleSetActiveQuery(activeQueryID) {
    this.setState({activeQueryID})
  }

  render() {
    const {cell: {queries}} = this.props
    const {selectedGraphType, activeQueryID} = this.state
    const queryConfigs = queries.map(({queryConfig}) => queryConfig)

    return (
      <div className="data-explorer overlay-technology">
        <ResizeContainer>
          <Visualization
            autoRefresh={autoRefresh}
            timeRange={timeRange}
            queryConfigs={queryConfigs}
            activeQueryID={activeQueryID}
            activeQueryIndex={0}
          />
          <ResizeBottom>
            <OverlayControls
              graphTypes={graphTypes}
              selectedGraphType={selectedGraphType}
              onSelectGraphType={this.handleSelectGraphType}
            />
            <QueryBuilder
              queries={queryConfigs}
              autoRefresh={autoRefresh}
              timeRange={timeRange}
              setActiveQuery={this.handleSetActiveQuery}
              activeQueryID={activeQueryID}
            />
          </ResizeBottom>
        </ResizeContainer>
      </div>
    )
  }
}

const {
  shape,
} = PropTypes

CellEditorOverlay.propTypes = {
  cell: shape({}).isRequired,
}

export default CellEditorOverlay
