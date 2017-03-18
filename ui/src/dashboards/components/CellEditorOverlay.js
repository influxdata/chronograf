import React, {Component, PropTypes} from 'react'

import _ from 'lodash'
import uuid from 'node-uuid'

import ResizeContainer, {ResizeBottom} from 'src/shared/components/ResizeContainer'
import QueryBuilder from 'src/data_explorer/components/QueryBuilder'
import Visualization from 'src/data_explorer/components/Visualization'
import OverlayControls from 'src/dashboards/components/OverlayControls'
import graphTypes from 'hson!shared/data/graphTypes.hson'
import * as queryModifiers from 'src/utils/queryTransitions'

import defaultQueryConfig from 'src/utils/defaultQueryConfig'

const autoRefresh = 60000

const timeRange = {
  upper: 'now()',
  lower: '5m',
}

class CellEditorOverlay extends Component {
  constructor(props) {
    super(props)

    this.queryStateReducer = ::this.queryStateReducer

    this.addQuery = ::this.addQuery
    this.deleteQuery = ::this.deleteQuery

    this.handleSelectGraphType = ::this.handleSelectGraphType
    this.handleSetActiveQuery = ::this.handleSetActiveQuery
    this.findGraphType = ::this.findGraphType

    const {cell: {queries, type}} = props
    const queriesWorkingDraft = _.cloneDeep(queries.map(({queryConfig}) => queryConfig))
    const selectedGraphType = this.findGraphType(type)
    const activeQueryID = queries.length ?
      queries.map(({queryConfig}) => queryConfig.id)[0] :
      null

    this.state = {
      queriesWorkingDraft,
      selectedGraphType,
      activeQueryID,
    }
  }

  queryStateReducer(queryModifier) {
    return (queryID, payload) => {
      const {queriesWorkingDraft} = this.state
      const query = queriesWorkingDraft.find((q) => q.id === queryID)

      const nextQuery = queryModifier(query, payload)

      const nextQueries = queriesWorkingDraft.map((q) => q.id === query.id ? nextQuery : q)
      this.setState({queriesWorkingDraft: nextQueries})
    }
  }

  addQuery(options) {
    const newQuery = Object.assign({}, defaultQueryConfig(uuid.v4()), options)
    const nextQueries = this.state.queriesWorkingDraft.concat(newQuery)
    this.setState({queriesWorkingDraft: nextQueries})
  }

  deleteQuery(queryID) {
    const nextQueries = this.state.queriesWorkingDraft.filter((q) => q.id !== queryID)
    this.setState({queriesWorkingDraft: nextQueries})
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
    const {selectedGraphType, activeQueryID, queriesWorkingDraft} = this.state
    const {addQuery, deleteQuery} = this
    const queryActions = {
      addQuery,
      deleteQuery,
      ..._.mapValues(queryModifiers, (qm) => this.queryStateReducer(qm)),
    }

    return (
      <div className="data-explorer overlay-technology">
        <ResizeContainer>
          <Visualization
            autoRefresh={autoRefresh}
            timeRange={timeRange}
            queryConfigs={queriesWorkingDraft}
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
              queries={queriesWorkingDraft}
              actions={queryActions}
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
