// Components
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'

// Libraries
import _ from 'lodash'
import uuid from 'uuid'
import {Link} from 'react-router'

// Components
import AlertsTableRow from 'src/alerts/components/AlertsTableRow'
import InfiniteScroll from 'src/shared/components/InfiniteScroll'
import SearchBar from 'src/alerts/components/SearchBar'

// Constants
import {ALERTS_TABLE} from 'src/alerts/constants/tableSizing'

// Types
import {Alert} from 'src/types/alerts'
import {Source, TimeZones} from 'src/types'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

enum Direction {
  ASC = 'asc',
  DESC = 'desc',
  NONE = 'none',
}

interface OwnProps {
  alerts: Alert[]
  source: Source
  shouldNotBeFilterable: boolean
  limit: number
  isAlertsMaxedOut: boolean
  alertsCount: number
  onGetMoreAlerts: () => void
}

interface StateProps {
  timeZone: TimeZones
}

interface State {
  searchTerm: string
  filteredAlerts: Alert[]
  sortDirection: Direction
  sortKey: string
}

type Props = OwnProps & StateProps

@ErrorHandling
class AlertsTable extends PureComponent<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      searchTerm: '',
      filteredAlerts: this.props.alerts,
      sortDirection: Direction.NONE,
      sortKey: '',
    }
  }

  public componentWillReceiveProps(newProps) {
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
      <div className="panel">
        <div className="panel-heading">
          <h2 className="panel-title">{this.props.alerts.length} Alerts</h2>
          {this.props.alerts.length ? (
            <SearchBar onSearch={this.filterAlerts} />
          ) : null}
        </div>
        <div className="panel-body">{this.renderTable()}</div>
      </div>
    )
  }

  private filterAlerts = (searchTerm: string, newAlerts?: Alert[]): void => {
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

  private changeSort = (key: string): (() => void) => (): void => {
    // if we're using the key, reverse order; otherwise, set it with ascending
    if (this.state.sortKey === key) {
      const reverseDirection: Direction =
        this.state.sortDirection === Direction.ASC
          ? Direction.DESC
          : Direction.ASC
      this.setState({sortDirection: reverseDirection})
    } else {
      this.setState({sortKey: key, sortDirection: Direction.ASC})
    }
  }

  private sortableClasses = (key: string): string => {
    if (this.state.sortKey === key) {
      if (this.state.sortDirection === Direction.ASC) {
        return 'alert-history-table--th sortable-header sorting-ascending'
      }
      return 'alert-history-table--th sortable-header sorting-descending'
    }
    return 'alert-history-table--th sortable-header'
  }

  private sort = (
    alerts: Alert[],
    key: string,
    direction: Direction
  ): Alert[] => {
    switch (direction) {
      case Direction.ASC:
        return _.sortBy<Alert>(alerts, e => e[key])
      case Direction.DESC:
        return _.sortBy<Alert>(alerts, e => e[key]).reverse()
      default:
        return alerts
    }
  }

  private renderTable(): JSX.Element {
    const {
      source: {id},
      timeZone,
    } = this.props
    const alerts = this.sort(
      this.state.filteredAlerts,
      this.state.sortKey,
      this.state.sortDirection
    )
    const {colName, colLevel, colTime, colHost, colValue} = ALERTS_TABLE
    return this.props.alerts.length ? (
      <div className="alert-history-table">
        <div className="alert-history-table--thead">
          <div
            onClick={this.changeSort('name')}
            className={this.sortableClasses('name')}
            style={{width: colName}}
          >
            Name <span className="icon caret-up" />
          </div>
          <div
            onClick={this.changeSort('level')}
            className={this.sortableClasses('level')}
            style={{width: colLevel}}
          >
            Level <span className="icon caret-up" />
          </div>
          <div
            onClick={this.changeSort('time')}
            className={this.sortableClasses('time')}
            style={{width: colTime}}
          >
            Time ({timeZone})<span className="icon caret-up" />
          </div>
          <div
            onClick={this.changeSort('host')}
            className={this.sortableClasses('host')}
            style={{width: colHost}}
          >
            Host <span className="icon caret-up" />
          </div>
          <div
            onClick={this.changeSort('value')}
            className={this.sortableClasses('value')}
            style={{width: colValue}}
          >
            Value <span className="icon caret-up" />
          </div>
        </div>
        <InfiniteScroll
          className="alert-history-table--tbody"
          itemHeight={25}
          items={alerts.map(alert => (
            <div className="alert-history-table--tr" key={uuid.v4()}>
              <AlertsTableRow sourceID={id} {...alert} timeZone={timeZone} />
            </div>
          ))}
        />
      </div>
    ) : (
      this.renderTableEmpty()
    )
  }

  private renderTableEmpty(): JSX.Element {
    const {
      source: {id},
      shouldNotBeFilterable,
    } = this.props

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
}

const mstp = ({app}) => ({
  timeZone: app.persisted.timeZone,
})

export default connect(mstp, null)(AlertsTable)
