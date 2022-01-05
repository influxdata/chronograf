import React from 'react'
import PropTypes from 'prop-types'

import ConfirmButton from 'shared/components/ConfirmButton'
import {QUERIES_TABLE} from 'src/admin/constants/tableSizing'

const QueryRow = ({query, onKill}) => {
  const {database, duration, status} = query
  const wrappedKill = () => {
    onKill(query)
  }

  return (
    <tr>
      <td
        style={{width: `${QUERIES_TABLE.colDatabase}px`}}
        className="monotype"
      >
        {database}
      </td>
      <td>
        <code>{query.query}</code>
      </td>
      <td
        style={{width: `${QUERIES_TABLE.colDuration}px`}}
        className="monotype"
      >
        {duration}
      </td>
      <td
        style={{width: `${QUERIES_TABLE.colKillQuery}px`}}
        className="text-left"
      >
        <div style={{width: '100%', position: 'relative'}}>
          {status === 'running' ? (
            <div
              style={{
                width: '100%',
                position: 'absolute',
                top: '-4px', // go over top td padding
              }}
            >
              <ConfirmButton
                text="Kill"
                confirmAction={wrappedKill}
                size="btn-xs"
                type="btn-danger"
                customClass="table--show-on-row-hover"
                style={{width: '100%'}}
              />
            </div>
          ) : undefined}
          {status}
        </div>
      </td>
    </tr>
  )
}

const {func, shape} = PropTypes

QueryRow.propTypes = {
  query: shape().isRequired,
  onKill: func.isRequired,
}

export default QueryRow
