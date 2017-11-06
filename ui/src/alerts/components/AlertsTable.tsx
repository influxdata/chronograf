import * as React from 'react'
import * as _ from 'lodash'
import classnames from 'classnames'
import {Link} from 'react-router-dom'
import uuidv4 from 'uuid/v4'

import FancyScrollbar from 'shared/components/FancyScrollbar'
import SearchBar from 'alerts/components/SearchBar'

import {ALERTS_TABLE} from 'alerts/constants/tableSizing'

import {Alert, Source} from 'src/types'

export enum SortDirection {
  asc = 'asc',
  desc = 'desc',
}

export interface AlertsTableProps {
  alerts: Alert[]
  source: Source
  shouldNotBeFilterable: boolean
  limit: number
  onGetMoreAlerts: (evt: {}) => void
  isAlertsMaxedOut: boolean
  alertsCount: number
}

export interface AlertsTableState {
  searchTerm: string
  filteredAlerts: Alert[]
  sortDirection: SortDirection
  sortKey: string
}

class AlertsTable extends React.Component<AlertsTableProps, AlertsTableState> {
  public constructor(props: AlertsTableProps) {
    super(props)
    this.state = {
      searchTerm: '',
      filteredAlerts: props.alerts,
      sortDirection: SortDirection.asc,
      sortKey: '',
    }
  }

  private filterAlerts = (searchTerm, newAlerts?) => {
    const alerts = newAlerts || this.props.alerts
    const filterText = searchTerm.toLowerCase()
    const filteredAlerts = alerts.filter(({name, host, level}) => {
      return (
        (name && name.toLowerCase().includes(filterText)) ||
        (host && host.toLowerCase().includes(filterText)) ||
        (level && level.toLowerCase().includes(filterText))
      )
    })
    this.setState({searchTerm, filteredAlerts})
  }

  private changeSort = key => () => {
    // if we're using the key, reverse order; otherwise, set it with ascending
    if (this.state.sortKey === key) {
      const reverseDirection =
        this.state.sortDirection === SortDirection.asc
          ? SortDirection.desc
          : SortDirection.asc
      this.setState({sortDirection: reverseDirection})
    } else {
      this.setState({sortKey: key, sortDirection: SortDirection.asc})
    }
  }

  private sortableClasses = key => {
    if (this.state.sortKey === key) {
      if (this.state.sortDirection === SortDirection.asc) {
        return 'alert-history-table--th sortable-header sorting-ascending'
      }
      return 'alert-history-table--th sortable-header sorting-descending'
    }
    return 'alert-history-table--th sortable-header'
  }

  private sort = (alerts, key, direction) => {
    switch (direction) {
      case SortDirection.asc:
        return _.sortBy(alerts, e => e[key])
      case SortDirection.desc:
        return _.sortBy(alerts, e => e[key]).reverse()
      default:
        return alerts
    }
  }

  private renderTable = () => {
    const {source: {id}} = this.props
    const {filteredAlerts, sortKey, sortDirection} = this.state
    const alerts = this.sort(filteredAlerts, sortKey, sortDirection)
    const {colName, colLevel, colTime, colHost, colValue} = ALERTS_TABLE
    return this.props.alerts.length ? (
      <div className="alert-history-table">
        <div className="alert-history-table--thead">
          <div
            onClick={this.changeSort('name')}
            className={this.sortableClasses('name')}
            style={{width: colName}}
          >
            Name
          </div>
          <div
            onClick={this.changeSort('level')}
            className={this.sortableClasses('level')}
            style={{width: colLevel}}
          >
            Level
          </div>
          <div
            onClick={this.changeSort('time')}
            className={this.sortableClasses('time')}
            style={{width: colTime}}
          >
            Time
          </div>
          <div
            onClick={this.changeSort('host')}
            className={this.sortableClasses('host')}
            style={{width: colHost}}
          >
            Host
          </div>
          <div
            onClick={this.changeSort('value')}
            className={this.sortableClasses('value')}
            style={{width: colValue}}
          >
            Value
          </div>
        </div>
        <FancyScrollbar className="alert-history-table--tbody" autoHide={false}>
          {alerts.map(({name, level, time, host, value}) => {
            return (
              <div className="alert-history-table--tr" key={uuidv4()}>
                <div
                  className="alert-history-table--td"
                  style={{width: colName}}
                >
                  {name}
                </div>
                <div
                  className={`alert-history-table--td alert-level-${level.toLowerCase()}`}
                  style={{width: colLevel}}
                >
                  <span
                    className={classnames(
                      'table-dot',
                      {'dot-critical': level === 'CRITICAL'},
                      {'dot-success': level === 'OK'}
                    )}
                  />
                </div>
                <div
                  className="alert-history-table--td"
                  style={{width: colTime}}
                >
                  {new Date(Number(time)).toISOString()}
                </div>
                <div
                  className="alert-history-table--td alert-history-table--host"
                  style={{width: colHost}}
                >
                  <Link to={`/sources/${id}/hosts/${host}`} title={host}>
                    {host}
                  </Link>
                </div>
                <div
                  className="alert-history-table--td"
                  style={{width: colValue}}
                >
                  {value}
                </div>
              </div>
            )
          })}
        </FancyScrollbar>
      </div>
    ) : (
      this.renderTableEmpty()
    )
  }

  private renderTableEmpty = () => {
    const {source: {id}, shouldNotBeFilterable} = this.props

    return shouldNotBeFilterable ? (
      <div className="graph-empty">
        <p>
          Learn how to configure your first <strong>Rule</strong> in<br />
          the <em>Getting Started</em> guide
        </p>
      </div>
    ) : (
      <div className="generic-empty-state">
        <h4 className="no-user-select">There are no Alerts to display</h4>
        <br />
        <h6 className="no-user-select">
          Try changing the Time Range or
          <Link
            style={{marginLeft: '10px'}}
            to={`/sources/${id}/alert-rules/new`}
            className="btn btn-primary btn-sm"
          >
            Create an Alert Rule
          </Link>
        </h6>
      </div>
    )
  }

  public componentWillReceiveProps(newProps: AlertsTableProps) {
    this.filterAlerts(this.state.searchTerm, newProps.alerts)
  }

  public render() {
    const {
      shouldNotBeFilterable,
      limit,
      onGetMoreAlerts,
      isAlertsMaxedOut,
      alertsCount,
    } = this.props

    return shouldNotBeFilterable ? (
      <div className="alerts-widget">
        {this.renderTable()}
        {limit && alertsCount ? (
          <button
            className="btn btn-sm btn-default btn-block"
            onClick={onGetMoreAlerts}
            disabled={isAlertsMaxedOut}
            style={{marginBottom: '20px'}}
          >
            {isAlertsMaxedOut
              ? `All ${alertsCount} Alerts displayed`
              : 'Load next 30 Alerts'}
          </button>
        ) : null}
      </div>
    ) : (
      <div className="panel panel-minimal">
        <div className="panel-heading u-flex u-ai-center u-jc-space-between">
          <h2 className="panel-title">{this.props.alerts.length} Alerts</h2>
          {this.props.alerts.length ? (
            <SearchBar onSearch={this.filterAlerts} />
          ) : null}
        </div>
        <div className="panel-body">{this.renderTable()}</div>
      </div>
    )
  }
}

export default AlertsTable
