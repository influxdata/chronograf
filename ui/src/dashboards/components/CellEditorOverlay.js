import React, {Component, PropTypes} from 'react'

import _ from 'lodash'
import uuid from 'node-uuid'

import ResizeContainer, {ResizeBottom} from 'src/shared/components/ResizeContainer'
import QueryBuilder from 'src/data_explorer/components/QueryBuilder'
import Visualization from 'src/data_explorer/components/Visualization'
import OverlayControls from 'src/dashboards/components/OverlayControls'
import * as queryModifiers from 'src/utils/queryTransitions'

import defaultQueryConfig from 'src/utils/defaultQueryConfig'

class CellEditorOverlay extends Component {
  constructor(props) {
    super(props)

    this.queryStateReducer = ::this.queryStateReducer

    this.addQuery = ::this.addQuery
    this.deleteQuery = ::this.deleteQuery

    this.handleSelectGraphType = ::this.handleSelectGraphType
    this.handleSetActiveQuery = ::this.handleSetActiveQuery

    const {cell: {name, type, queries}} = props
    const queriesWorkingDraft = _.cloneDeep(queries.map(({queryConfig}) => queryConfig))
    const activeQueryID = queries.length ?
      queries.map(({queryConfig}) => queryConfig.id)[0] :
      null

    this.state = {
      cellWorkingName: name,
      cellWorkingType: type,
      queriesWorkingDraft,
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

  handleSelectGraphType(graphType) {
    this.setState({cellWorkingType: graphType})
  }

  handleSetActiveQuery(activeQueryID) {
    this.setState({activeQueryID})
  }

  render() {
    const {autoRefresh, timeRange} = this.props
    const {activeQueryID, cellWorkingType, queriesWorkingDraft} = this.state
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
              selectedGraphType={cellWorkingType}
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
  number,
  shape,
  string,
} = PropTypes

CellEditorOverlay.propTypes = {
  cell: shape({}).isRequired,
  timeRange: shape({
    upper: string,
    lower: string,
  }).isRequired,
  autoRefresh: number.isRequired,
}

export default CellEditorOverlay
