import React, {SFC} from 'react'
import {Link} from 'react-router'
import classnames from 'classnames'

import {HOSTS_TABLE_SIZING} from 'src/hosts/constants/tableSizing'
import {Host} from 'src/types'

interface Props {
  sourceID: string
  host: Host
}

const HostRow: SFC<Props> = ({host, sourceID}) => {
  const {name, cpu, load, apps = []} = host
  const {NameWidth, StatusWidth, CPUWidth, LoadWidth} = HOSTS_TABLE_SIZING

  const CPUValue = isNaN(cpu) ? 'N/A' : `${cpu.toFixed(2)}%`
  const loadValue = isNaN(load) ? 'N/A' : `${load.toFixed(2)}`
  const dotClassName = classnames(
    'table-dot',
    Math.max(host.deltaUptime || 0, host.winDeltaUptime || 0) > 0
      ? 'dot-success'
      : 'dot-critical'
  )

  return (
    <div className="hosts-table--tr">
      <div className="hosts-table--td" style={{width: NameWidth}}>
        <Link to={`/sources/${sourceID}/hosts/${name}`}>{name}</Link>
      </div>
      <div className="hosts-table--td" style={{width: StatusWidth}}>
        <div className={dotClassName} />
      </div>
      <div style={{width: CPUWidth}} className="monotype hosts-table--td">
        {CPUValue}
      </div>
      <div style={{width: LoadWidth}} className="monotype hosts-table--td">
        {loadValue}
      </div>
      <div className="hosts-table--td">
        {apps.map((app, index) => {
          return (
            <span key={app}>
              <Link
                style={{marginLeft: '2px'}}
                to={{
                  pathname: `/sources/${sourceID}/hosts/${name}`,
                  query: {app},
                }}
              >
                {app}
              </Link>
              {index === apps.length - 1 ? null : ', '}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default HostRow
