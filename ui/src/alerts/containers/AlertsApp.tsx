import * as React from 'react'

import SourceIndicator from 'shared/components/SourceIndicator'
import AlertsTable from 'alerts/components/AlertsTable'
import NoKapacitorError from 'shared/components/NoKapacitorError'
import CustomTimeRangeDropdown from 'shared/components/CustomTimeRangeDropdown'

import {getAlerts} from 'alerts/apis'
import AJAX from 'utils/ajax'

import * as _ from 'lodash'
import * as moment from 'moment'

import timeRanges from 'shared/data/timeRanges'
import {Alert, Source, TimeRange} from 'src/types'

export interface AlertsAppProps {
  source: Source
  timeRange: TimeRange
  isWidget: boolean
  limit: number
}

export interface AlertsAppState {
  loading: boolean
  hasKapacitor: boolean
  alerts: Alert[]
  timeRange: TimeRange
  limit: number
  limitMultiplier: number
  isAlertsMaxedOut: boolean
}

class AlertsApp extends React.Component<AlertsAppProps, AlertsAppState> {
  constructor(props: AlertsAppProps) {
    super(props)

    const lowerInSec = props.timeRange
      ? timeRanges.find(tr => tr.lower === props.timeRange.lower).seconds
      : undefined

    const oneDayInSec = 86400

    this.state = {
      loading: true,
      hasKapacitor: false,
      alerts: [],
      timeRange: {
        upper: moment().format(),
        lower: moment()
          .subtract(lowerInSec || oneDayInSec, 'seconds')
          .format(),
      },
      limit: props.limit || 0, // only used if AlertsApp receives a limit prop
      limitMultiplier: 1, // only used if AlertsApp receives a limit prop
      isAlertsMaxedOut: false, // only used if AlertsApp receives a limit prop
    }
  }

  private fetchAlerts = () => {
    getAlerts(
      this.props.source.links.proxy,
      this.state.timeRange,
      this.state.limit * this.state.limitMultiplier
    ).then(resp => {
      const results = []

      const alertSeries = _.get(resp, ['data', 'results', '0', 'series'], [])
      if (alertSeries.length === 0) {
        this.setState({loading: false, alerts: []})
        return
      }

      const timeIndex = alertSeries[0].columns.findIndex(col => col === 'time')
      const hostIndex = alertSeries[0].columns.findIndex(col => col === 'host')
      const valueIndex = alertSeries[0].columns.findIndex(
        col => col === 'value'
      )
      const levelIndex = alertSeries[0].columns.findIndex(
        col => col === 'level'
      )
      const nameIndex = alertSeries[0].columns.findIndex(
        col => col === 'alertName'
      )

      alertSeries[0].values.forEach(s => {
        results.push({
          time: `${s[timeIndex]}`,
          host: s[hostIndex],
          value: `${s[valueIndex]}`,
          level: s[levelIndex],
          name: `${s[nameIndex]}`,
        })
      })

      // TODO: factor these setStates out to make a pure function and implement true limit & offset
      this.setState({
        loading: false,
        alerts: results,
        // this.state.alerts.length === results.length ||
        isAlertsMaxedOut:
          results.length !== this.props.limit * this.state.limitMultiplier,
      })
    })
  }

  private handleGetMoreAlerts = () => {
    this.setState({limitMultiplier: this.state.limitMultiplier + 1}, () => {
      this.fetchAlerts()
    })
  }

  private renderSubComponents = () => {
    const {source, isWidget, limit} = this.props
    const {isAlertsMaxedOut, alerts} = this.state

    return this.state.hasKapacitor ? (
      <AlertsTable
        source={source}
        alerts={this.state.alerts}
        shouldNotBeFilterable={isWidget}
        limit={limit}
        onGetMoreAlerts={this.handleGetMoreAlerts}
        isAlertsMaxedOut={isAlertsMaxedOut}
        alertsCount={alerts.length}
      />
    ) : (
      <NoKapacitorError source={source} />
    )
  }

  private handleApplyTime = timeRange => {
    this.setState({timeRange})
  }

  // TODO: show a loading screen until we figure out if there is a kapacitor and fetch the alerts
  public componentDidMount() {
    const {source} = this.props
    AJAX({
      url: source.links.kapacitors,
      method: 'GET',
    }).then(({data}) => {
      if (data.kapacitors[0]) {
        this.setState({hasKapacitor: true})

        this.fetchAlerts()
      } else {
        this.setState({loading: false})
      }
    })
  }

  public componentDidUpdate(
    _prevProps: AlertsAppProps,
    prevState: AlertsAppState
  ) {
    if (!_.isEqual(prevState.timeRange, this.state.timeRange)) {
      this.fetchAlerts()
    }
  }

  public render() {
    const {isWidget, source} = this.props
    const {loading, timeRange} = this.state

    if (loading || !source) {
      return <div className="page-spinner" />
    }

    return isWidget ? (
      this.renderSubComponents()
    ) : (
      <div className="page alert-history-page">
        <div className="page-header">
          <div className="page-header__container">
            <div className="page-header__left">
              <h1 className="page-header__title">Alert History</h1>
            </div>
            <div className="page-header__right">
              <SourceIndicator source={source} />
              <CustomTimeRangeDropdown
                onApplyTimeRange={this.handleApplyTime}
                timeRange={timeRange}
              />
            </div>
          </div>
        </div>
        <div className="page-contents">
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-12">{this.renderSubComponents()}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default AlertsApp
