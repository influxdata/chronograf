import * as React from 'react'
import {Link} from 'react-router-dom'
import * as classnames from 'classnames'
import * as qs from 'query-string'

import {HOSTS_TABLE} from 'hosts/constants/tableSizing'

import {Host, Source} from 'src/types'

export interface HostRowProps {
  host: Host
  source: Source
}

class HostRow extends React.PureComponent<HostRowProps> {
  public render() {
    const {host, source} = this.props
    const {name, cpu, load, apps = []} = host
    const {colName, colStatus, colCPU, colLoad} = HOSTS_TABLE

    return (
      <tr>
        <td style={{width: colName}}>
          <Link to={`/sources/${source.id}/hosts/${name}`}>{name}</Link>
        </td>
        <td style={{width: colStatus}}>
          <div
            className={classnames(
              'table-dot',
              Math.max(host.deltaUptime || 0, host.winDeltaUptime || 0) > 0
                ? 'dot-success'
                : 'dot-critical'
            )}
          />
        </td>
        <td style={{width: colCPU}} className="monotype">
          {isNaN(cpu) ? 'N/A' : `${cpu.toFixed(2)}%`}
        </td>
        <td style={{width: colLoad}} className="monotype">
          {isNaN(load) ? 'N/A' : `${load.toFixed(2)}`}
        </td>
        <td>
          {apps.map((app, index) => {
            return (
              <span key={app}>
                <Link
                  style={{marginLeft: '2px'}}
                  to={{
                    pathname: `/sources/${source.id}/hosts/${name}`,
                    search: qs.stringify({app}),
                  }}
                >
                  {app}
                </Link>
                {index === apps.length - 1 ? null : ', '}
              </span>
            )
          })}
        </td>
      </tr>
    )
  }
}

export default HostRow
