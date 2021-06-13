import React, {FunctionComponent, ReactNode} from 'react'

import {LogItem} from 'src/types/kapacitor'

interface Props {
  logItem: LogItem
}

const LogItemSession: FunctionComponent<Props> = ({logItem}) => {
  let taskRun: string | ReactNode = ''
  if (logItem.cluster) {
    taskRun = (
      <>
        {' / '}
        <i title={`friendly task run name, runID: ${logItem.tags}`}>
          {logItem.cluster || logItem.tags}
        </i>
      </>
    )
  }

  return (
    <div className="logs-table--row">
      <div className="logs-table--divider">
        <div className={`logs-table--level ${logItem.lvl}`} />
        <div className="logs-table--timestamp">
          {logItem.ts} {taskRun}
        </div>
      </div>
      <div className="logs-table--details">
        <div className="logs-table--session">{logItem.msg}</div>
      </div>
    </div>
  )
}

export default LogItemSession
