import * as React from 'react'

import QueryRow from 'admin/components/QueryRow'
import {QUERIES_TABLE} from 'admin/constants/tableSizing'

import {InfluxDBAdminQuery} from 'src/types/influxdbAdmin'

export interface QueriesTableProps {
  queries: InfluxDBAdminQuery[]
  onConfirm: () => void
  onKillQuery: () => void
}

const QueriesTable = ({queries, onKillQuery}) => (
  <div>
    <div className="panel panel-default">
      <div className="panel-body">
        <table className="table v-center admin-table table-highlight">
          <thead>
            <tr>
              <th style={{width: `${QUERIES_TABLE.colDatabase}px`}}>
                Database
              </th>
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
      </div>
    </div>
  </div>
)

export default QueriesTable
