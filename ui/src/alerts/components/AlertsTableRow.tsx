import React, {PureComponent} from 'react'
import {Link} from 'react-router'

import classnames from 'classnames'

import {ALERTS_TABLE} from 'src/alerts/constants/tableSizing'

interface Props {
  sourceID: string
  name: string | null
  level: string | null
  time: string | null
  host: string | null
  value: string | null
}

const {colName, colLevel, colTime, colHost, colValue} = ALERTS_TABLE

class AlertsTableRow extends PureComponent<Props> {
  public render() {
    return (
      <>
        {this.nameCell}
        {this.levelCell}
        {this.timeCell}
        {this.hostCell}
        {this.valueCell}
      </>
    )
  }
  private get nameCell(): JSX.Element {
    const {name} = this.props

    return (
      <div className="alert-history-table--td" style={{width: colName}}>
        {name === null ? '–' : name}
      </div>
    )
  }

  private get levelCell(): JSX.Element {
    const {level} = this.props

    return (
      <div
        className={`alert-history-table--td alert-level-${
          level === null ? 'null' : level.toLowerCase()
        }`}
        style={{width: colLevel}}
      >
        {level === null ? (
          '–'
        ) : (
          <span
            className={classnames(
              'table-dot',
              {'dot-critical': level === 'CRITICAL'},
              {'dot-success': level === 'OK'}
            )}
          />
        )}
      </div>
    )
  }

  private get timeCell(): JSX.Element {
    const {time} = this.props

    return (
      <div className="alert-history-table--td" style={{width: colTime}}>
        {time === null ? '–' : new Date(Number(time)).toISOString()}
      </div>
    )
  }

  private get hostCell(): JSX.Element {
    const {sourceID, host} = this.props

    return (
      <div
        className="alert-history-table--td alert-history-table--host"
        style={{width: colHost}}
      >
        {host === null ? (
          '–'
        ) : (
          <Link to={`/sources/${sourceID}/hosts/${host}`} title={host}>
            {host}
          </Link>
        )}
      </div>
    )
  }

  private get valueCell(): JSX.Element {
    const {value} = this.props

    return (
      <div className="alert-history-table--td" style={{width: colValue}}>
        {value === null ? '–' : value}
      </div>
    )
  }
}

export default AlertsTableRow
