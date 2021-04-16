import React from 'react'
import PropTypes, {string} from 'prop-types'

import QueryRow from 'src/admin/components/QueryRow'
import {QUERIES_TABLE} from 'src/admin/constants/tableSizing'

const QueriesTable = ({queries, queriesSort, changeSort, onKillQuery}) => {
  let timeSortClass = 'col--sort-next-desc'
  let dbSortClass = 'col--sort-next-asc'
  let newTimeSort = '-time'
  let newDBSort = '+database'
  switch (queriesSort) {
    case '-time':
      timeSortClass = 'col--sort-desc'
      newTimeSort = '+time'
      break
    case '+time':
      timeSortClass = 'col--sort-asc'
      newTimeSort = '-time'
      break
    case '-database':
      dbSortClass = 'col--sort-desc'
      newDBSort = '+database'
      break
    case '+database':
      dbSortClass = 'col--sort-asc'
      newDBSort = '-database'
      break
  }
  return (
    <div>
      <div className="panel panel-solid">
        <div className="panel-body">
          <table className="table v-center admin-table table-highlight">
            <thead>
              <tr>
                <th
                  style={{width: `${QUERIES_TABLE.colDatabase}px`}}
                  className={`col--sortable ${dbSortClass}`}
                  onClick={() => changeSort(newDBSort)}
                >
                  <div>Database</div>
                </th>
                <th>Query</th>
                <th
                  style={{width: `${QUERIES_TABLE.colRunning}px`}}
                  className={`col--sortable ${timeSortClass}`}
                  onClick={() => changeSort(newTimeSort)}
                >
                  Running
                </th>
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
}

const {arrayOf, func, shape} = PropTypes

QueriesTable.propTypes = {
  queries: arrayOf(shape()),
  queriesSort: string,
  changeSort: func,
  onConfirm: func,
  onKillQuery: func,
}

export default QueriesTable
