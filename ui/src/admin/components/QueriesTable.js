import React from 'react'
import PropTypes from 'prop-types'

import {Panel, PanelType} from 'src/reusable_ui'
import QueryRow from 'src/admin/components/QueryRow'
import {QUERIES_TABLE} from 'src/admin/constants/tableSizing'

const QueriesTable = ({queries, onKillQuery}) => (
  <Panel type={PanelType.Solid}>
    <Panel.Body>
      <table className="table v-center admin-table table-highlight">
        <thead>
          <tr>
            <th style={{width: `${QUERIES_TABLE.colDatabase}px`}}>Database</th>
            <th>Query</th>
            <th style={{width: `${QUERIES_TABLE.colRunning}px`}}>Running</th>
            <th style={{width: `${QUERIES_TABLE.colKillQuery}px`}} />
          </tr>
        </thead>
        <tbody>
          {queries.map(q => (
            <QueryRow key={q.id} query={q} onKill={onKillQuery} />
          ))}
        </tbody>
      </table>
    </Panel.Body>
  </Panel>
)

const {arrayOf, func, shape} = PropTypes

QueriesTable.propTypes = {
  queries: arrayOf(shape()),
  onConfirm: func,
  onKillQuery: func,
}

export default QueriesTable
