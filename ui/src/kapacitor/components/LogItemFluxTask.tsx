import React, {FunctionComponent} from 'react'

import {LogItem} from 'src/types/kapacitor'

interface Props {
  logItem: LogItem
}

const LogItemSession: FunctionComponent<Props> = ({logItem}) => (
  <div className="logs-table--row">
    <div className="logs-table--divider">
      <div className={`logs-table--level ${logItem.lvl}`} />
      <div className="logs-table--timestamp">
        {logItem.ts} /{' '}
        <i title={`friendly ID of a run name, full runID is: ${logItem.tags}`}>
          {logItem.cluster || logItem.tags}
        </i>
      </div>
    </div>
    <div className="logs-table--details">
      <div className="logs-table--session">{logItem.msg}</div>
    </div>
  </div>
)

export default LogItemSession
