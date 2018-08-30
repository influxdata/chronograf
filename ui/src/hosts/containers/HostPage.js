import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import classnames from 'classnames'

import LayoutRenderer from 'shared/components/LayoutRenderer'
import DashboardHeader from 'src/dashboards/components/DashboardHeader'
import FancyScrollbar from 'shared/components/FancyScrollbar'
import ManualRefresh from 'src/shared/components/ManualRefresh'
import {generateForHosts} from 'src/utils/tempVars'

import {timeRanges} from 'shared/data/timeRanges'
import {
  getLayouts,
  getAppsForHost,
  getMeasurementsForHost,
  loadHostsLinks,
} from 'src/hosts/apis'
import {EMPTY_LINKS} from 'src/dashboards/constants/dashboardHeader'

import {setAutoRefresh, delayEnablePresentationMode} from 'shared/actions/app'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {GlobalAutoRefresh} from 'src/utils/AutoRefresh'

@ErrorHandling
class HostPage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      layouts: [],
      hostLinks: EMPTY_LINKS,
      timeRange: timeRanges.find(tr => tr.lower === 'now() - 1h'),
      dygraphs: [],
    }
  }

  async fetchHostsAndMeasurements(layouts) {
    const {source, params} = this.props

    const host = await getAppsForHost(
      source.links.proxy,
      params.hostID,
      layouts,
      source.telegraf
    )

    const measurements = await getMeasurementsForHost(source, params.hostID)

    return {host, measurements}
  }

  async componentDidMount() {
    const {
      data: {layouts},
    } = await getLayouts()
    const {location, autoRefresh} = this.props

    GlobalAutoRefresh.poll(autoRefresh)

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
  }

  componentDidUpdate(prevProps) {
    const {autoRefresh} = this.props
    if (prevProps.autoRefresh !== autoRefresh) {
      GlobalAutoRefresh.poll(autoRefresh)
    }
  }

  componentWillUnmount() {
    GlobalAutoRefresh.stopPolling()
  }

  handleChooseTimeRange = ({lower, upper}) => {
    if (upper) {
      this.setState({timeRange: {lower, upper}})
    } else {
      const timeRange = timeRanges.find(range => range.lower === lower)
      this.setState({timeRange})
    }
  }

  get layouts() {
    const {timeRange, layouts} = this.state

    if (layouts.length === 0) {
      return ''
    }

    const {source, manualRefresh} = this.props

    const autoflowLayouts = layouts.filter(layout => !!layout.autoflow)

    const cellWidth = 4
    const cellHeight = 4
    const pageWidth = 12

    let cellCount = 0
    const autoflowCells = autoflowLayouts.reduce((allCells, layout) => {
      return allCells.concat(
        layout.cells.map(cell => {
          const x = (cellCount * cellWidth) % pageWidth
          const y = Math.floor(cellCount * cellWidth / pageWidth) * cellHeight
          cellCount += 1
          return Object.assign(cell, {
            w: cellWidth,
            h: cellHeight,
            x,
            y,
          })
        })
      )
    }, [])

    const staticLayouts = layouts.filter(layout => !layout.autoflow)
    staticLayouts.unshift({cells: autoflowCells})

    let translateY = 0
    const layoutCells = staticLayouts.reduce((allCells, layout) => {
      let maxY = 0
      layout.cells.forEach(cell => {
        cell.y += translateY
        if (cell.y > translateY) {
          maxY = cell.y
        }
        cell.queries.forEach(q => {
          q.text = q.query
          q.db = source.telegraf
          q.rp = source.defaultRP
        })
      })
      translateY = maxY

      return allCells.concat(layout.cells)
    }, [])

    const tempVars = generateForHosts(source)

    return (
      <LayoutRenderer
        source={source}
        isEditable={false}
        cells={layoutCells}
        templates={tempVars}
        timeRange={timeRange}
        manualRefresh={manualRefresh}
        host={this.props.params.hostID}
      />
    )
  }

  render() {
    const {
      autoRefresh,
      onManualRefresh,
      params: {hostID},
      inPresentationMode,
      handleChooseAutoRefresh,
      handleClickPresentationButton,
    } = this.props
    const {timeRange, hostLinks} = this.state

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
            {this.layouts}
          </div>
        </FancyScrollbar>
      </div>
    )
  }

  getHostLinks = async () => {
    const {
      source,
      params: {hostID},
    } = this.props

    const activeHost = {name: hostID}
    const links = await loadHostsLinks(source, {activeHost})

    return links
  }
}

const {shape, string, bool, func, number} = PropTypes

HostPage.propTypes = {
  source: shape({
    links: shape({
      proxy: string.isRequired,
    }).isRequired,
    telegraf: string.isRequired,
    id: string.isRequired,
  }),
  params: shape({
    hostID: string.isRequired,
  }).isRequired,
  location: shape({
    query: shape({
      app: string,
    }),
  }),
  inPresentationMode: bool,
  autoRefresh: number.isRequired,
  manualRefresh: number.isRequired,
  onManualRefresh: func.isRequired,
  handleChooseAutoRefresh: func.isRequired,
  handleClickPresentationButton: func,
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

export default connect(mstp, mdtp)(ManualRefresh(HostPage))
