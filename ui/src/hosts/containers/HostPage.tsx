import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import classnames from 'classnames'

import LayoutRenderer from 'src/shared/components/LayoutRenderer'
import DashboardHeader from 'src/dashboards/components/DashboardHeader'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import ManualRefresh from 'src/shared/components/ManualRefresh'
import {generateForHosts} from 'src/utils/tempVars'

import {timeRanges} from 'src/shared/data/timeRanges'
import {
  getLayouts,
  getAppsForHost,
  getMeasurementsForHost,
  loadHostsLinks,
} from 'src/hosts/apis'
import {EMPTY_LINKS} from 'src/dashboards/constants/dashboardHeader'

import {
  setAutoRefresh,
  delayEnablePresentationMode,
} from 'src/shared/actions/app'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {GlobalAutoRefresher} from 'src/utils/AutoRefresher'
import {getCells} from 'src/hosts/utils/getCells'

import {Source, Layout, TimeRange} from 'src/types'
import {Location} from 'history'
import {DashboardSwitcherLinks} from 'src/types/dashboards'

interface Props {
  source: Source
  params: {
    hostID: string
  }
  location: Location
  inPresentationMode: boolean
  autoRefresh: number
  manualRefresh: number
  onManualRefresh: () => void
  handleChooseAutoRefresh: typeof setAutoRefresh
  handleClickPresentationButton: typeof delayEnablePresentationMode
}

interface State {
  layouts: Layout[]
  hostLinks: DashboardSwitcherLinks
  timeRange: TimeRange
}

class HostPage extends PureComponent<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      layouts: [],
      hostLinks: EMPTY_LINKS,
      timeRange: timeRanges.find(tr => tr.lower === 'now() - 1h'),
    }
  }

  public async componentDidMount() {
    const {location, autoRefresh} = this.props

    const {
      data: {layouts},
    } = await getLayouts()

    // fetching layouts and mappings can be done at the same time
    const {host, measurements} = await this.fetchHostsAndMeasurements(layouts)

    const focusedApp = location.query.app

    const filteredLayouts = layouts.filter(layout => {
      if (focusedApp) {
        return layout.app === focusedApp
      }

      return (
        host.apps &&
        host.apps.includes(layout.app) &&
        measurements.includes(layout.measurement)
      )
    })

    const hostLinks = await this.getHostLinks()

    this.setState({layouts: filteredLayouts, hostLinks}) // eslint-disable-line react/no-did-mount-set-state

    GlobalAutoRefresher.poll(autoRefresh)
  }

  public componentDidUpdate(prevProps) {
    const {autoRefresh} = this.props

    if (prevProps.autoRefresh !== autoRefresh) {
      GlobalAutoRefresher.poll(autoRefresh)
    }
  }

  public componentWillUnmount() {
    GlobalAutoRefresher.stopPolling()
  }

  public render() {
    const {
      autoRefresh,
      manualRefresh,
      onManualRefresh,
      params: {hostID},
      inPresentationMode,
      handleChooseAutoRefresh,
      handleClickPresentationButton,
      source,
    } = this.props
    const {timeRange, hostLinks, layouts} = this.state

    const layoutCells = getCells(layouts, source)
    const tempVars = generateForHosts(source)

    return (
      <div className="page">
        <DashboardHeader
          timeRange={timeRange}
          activeDashboard={hostID}
          autoRefresh={autoRefresh}
          isHidden={inPresentationMode}
          onManualRefresh={onManualRefresh}
          handleChooseAutoRefresh={handleChooseAutoRefresh}
          handleChooseTimeRange={this.handleChooseTimeRange}
          handleClickPresentationButton={handleClickPresentationButton}
          dashboardLinks={hostLinks}
        />
        <FancyScrollbar
          className={classnames({
            'page-contents': true,
            'presentation-mode': inPresentationMode,
          })}
        >
          <div className="container-fluid full-width dashboard">
            <LayoutRenderer
              source={source}
              sources={[source]}
              isStatusPage={false}
              isEditable={false}
              cells={layoutCells}
              templates={tempVars}
              timeRange={timeRange}
              manualRefresh={manualRefresh}
              host={this.props.params.hostID}
            />
          </div>
        </FancyScrollbar>
      </div>
    )
  }

  private handleChooseTimeRange = ({lower, upper}) => {
    if (upper) {
      this.setState({timeRange: {lower, upper}})
    } else {
      const timeRange = timeRanges.find(range => range.lower === lower)
      this.setState({timeRange})
    }
  }

  private async fetchHostsAndMeasurements(layouts) {
    const {source, params} = this.props

    const fetchMeasurements = getMeasurementsForHost(source, params.hostID)
    const fetchHosts = getAppsForHost(
      source.links.proxy,
      params.hostID,
      layouts,
      source.telegraf
    )

    const [host, measurements] = await Promise.all([
      fetchHosts,
      fetchMeasurements,
    ])

    return {host, measurements}
  }

  private getHostLinks = async () => {
    const {
      source,
      params: {hostID},
    } = this.props

    const activeHost = {name: hostID}
    const links = await loadHostsLinks(source, activeHost)

    return links
  }
}

const mstp = ({
  app: {
    ephemeral: {inPresentationMode},
    persisted: {autoRefresh},
  },
}) => ({
  inPresentationMode,
  autoRefresh,
})

const mdtp = {
  handleChooseAutoRefresh: setAutoRefresh,
  handleClickPresentationButton: delayEnablePresentationMode,
}

export default connect(mstp, mdtp)(ManualRefresh(ErrorHandling(HostPage)))
