import React from 'react'
import PropTypes from 'prop-types'

import LogsTableRow from 'src/kapacitor/components/LogsTableRow'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'

const numLogsToRender = 200

const LogsTable = ({logs}) => (
  <div className="logs-table">
    <div className="logs-table--header">
      {`${numLogsToRender} Most Recent Logs`}
    </div>
    <FancyScrollbar
      autoHide={false}
      className="logs-table--container fancy-scroll--kapacitor"
    >
      {logs
        .slice(0, numLogsToRender)
        .map(log => <LogsTableRow key={log.key} logItem={log} />)}
    </FancyScrollbar>
  </div>
)

const {arrayOf, shape, string} = PropTypes

LogsTable.propTypes = {
  logs: arrayOf(
    shape({
      key: string.isRequired,
      ts: string.isRequired,
      lvl: string.isRequired,
      msg: string.isRequired,
    })
  ).isRequired,
}

export default LogsTable
