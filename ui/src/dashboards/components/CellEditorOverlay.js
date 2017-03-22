import React, {Component, PropTypes} from 'react'

import _ from 'lodash'
import uuid from 'node-uuid'

import ResizeContainer, {ResizeBottom} from 'src/shared/components/ResizeContainer'
import QueryBuilder from 'src/data_explorer/components/QueryBuilder'
import Visualization from 'src/data_explorer/components/Visualization'
import OverlayControls from 'src/dashboards/components/OverlayControls'
import * as queryModifiers from 'src/utils/queryTransitions'

import selectStatement from 'src/data_explorer/utils/influxql/select'

import defaultQueryConfig from 'src/utils/defaultQueryConfig'

class CellEditorOverlay extends Component {
  constructor(props) {
    super(props)

    this.queryStateReducer = ::this.queryStateReducer

    this.addQuery = ::this.addQuery
    this.deleteQuery = ::this.deleteQuery

    this.handleSaveCell = ::this.handleSaveCell

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

  handleSaveCell() {
    const {queriesWorkingDraft, cellWorkingType, cellWorkingName} = this.state
    const {cell, timeRange} = this.props

    const newCell = _.cloneDeep(cell)
    newCell.name = cellWorkingName
    newCell.type = cellWorkingType
    newCell.queries = queriesWorkingDraft.map((q) => {
      const queryString = q.rawText || selectStatement(timeRange, q)
      const label = `${q.measurement}.${q.fields[0].field}`

      return {
        queryConfig: q,
        query: queryString,
        label,
      }
    })

    this.props.onSave(newCell)
  }

  handleSelectGraphType(graphType) {
    this.setState({cellWorkingType: graphType})
  }

  handleSetActiveQuery(activeQueryID) {
    this.setState({activeQueryID})
  }

  render() {
    const {onCancel, autoRefresh, timeRange} = this.props
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
            cellType={cellWorkingType}
          />
          <ResizeBottom>
            <OverlayControls
              selectedGraphType={cellWorkingType}
              onSelectGraphType={this.handleSelectGraphType}
              onCancel={onCancel}
              onSave={this.handleSaveCell}
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
  func,
  number,
  shape,
  string,
} = PropTypes

CellEditorOverlay.propTypes = {
  onCancel: func.isRequired,
  onSave: func.isRequired,
  cell: shape({}).isRequired,
  timeRange: shape({
    upper: string,
    lower: string,
  }).isRequired,
  autoRefresh: number.isRequired,
}

export default CellEditorOverlay
