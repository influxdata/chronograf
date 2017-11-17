import * as React from 'react'
import {bindActionCreators, compose} from 'redux'
import {connect} from 'react-redux'
import {withRouter} from 'react-router-dom'
import * as _ from 'lodash'
import * as classnames from 'classnames'
import * as qs from 'query-string'

import Dygraph from 'external/dygraph'

import LayoutRenderer from 'shared/components/LayoutRenderer'
import DashboardHeader from 'dashboards/components/DashboardHeader'
import FancyScrollbar from 'shared/components/FancyScrollbar'
import ManualRefresh from 'shared/components/ManualRefresh'

import timeRanges from 'shared/data/timeRanges'
import {
  getMappings,
  getAppsForHosts,
  getMeasurementsForHost,
  getAllHosts,
} from 'hosts/apis'
import {fetchLayouts} from 'shared/apis'

import {setAutoRefresh} from 'shared/actions/app'
import {presentationButtonDispatcher} from 'shared/dispatchers'
import {
  Source,
  Location,
  AutoRefresh,
  ManualRefresh as ManualRefreshType,
  RouterHostID,
} from 'src/types'
import {func} from 'src/types/funcs'

export interface HostPageProps {
  source: Source
  location: Location
  inPresentationMode: boolean
  autoRefresh: AutoRefresh
  manualRefresh: ManualRefreshType
  onManualRefresh: func
  handleChooseAutoRefresh: () => void
  handleClickPresentationButton: () => void
}

class HostPage extends React.Component<HostPageProps & RouterHostID> {
  public state = {
    layouts: [],
    hosts: {},
    timeRange: timeRanges.find(tr => tr.lower === 'now() - 1h'),
    dygraphs: [],
  }

  private handleChooseTimeRange = ({lower, upper}) => {
    if (upper) {
      this.setState({timeRange: {lower, upper}})
    } else {
      const timeRange = timeRanges.find(range => range.lower === lower)
      this.setState({timeRange})
    }
  }

  private synchronizer = dygraph => {
    const dygraphs = [...this.state.dygraphs, dygraph].filter(d => d.graphDiv)
    const numGraphs = this.state.layouts.reduce((acc, {cells}) => {
      return acc + cells.length
    }, 0)

    if (dygraphs.length === numGraphs) {
      Dygraph.synchronize(dygraphs, {
        selection: true,
        zoom: false,
        range: false,
      })
    }
    this.setState({dygraphs})
  }

  private renderLayouts = layouts => {
    const {timeRange} = this.state
    const {source, autoRefresh, manualRefresh, match} = this.props

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
          return {
            ...cell,
            w: cellWidth,
            h: cellHeight,
            x,
            y,
          }
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
          q.database = source.telegraf
        })
      })
      translateY = maxY

      return allCells.concat(layout.cells)
    }, [])

    return (
      <LayoutRenderer
        source={source}
        isEditable={false}
        cells={layoutCells}
        timeRange={timeRange}
        autoRefresh={autoRefresh}
        manualRefresh={manualRefresh}
        host={match.params.hostID}
        synchronizer={this.synchronizer}
      />
    )
  }

  public async componentDidMount() {
    const {source, match, location} = this.props

    // fetching layouts and mappings can be done at the same time
    const {data: {layouts}} = await fetchLayouts()
    const {data: {mappings}} = await getMappings()
    const hosts = await getAllHosts(source.links.proxy, source.telegraf)
    const newHosts = await getAppsForHosts(
      source.links.proxy,
      hosts,
      mappings,
      source.telegraf
    )

    const measurements = await getMeasurementsForHost(
      source,
      match.params.hostID
    )

    const host = newHosts[this.props.match.params.hostID]
    const focusedApp = qs.parse(location.search).app

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

    // only display hosts in the list if they match the current app
    let filteredHosts = hosts
    if (focusedApp) {
      filteredHosts = _.pickBy(hosts, val => {
        return val.apps.includes(focusedApp)
      })
    }

    this.setState({layouts: filteredLayouts, hosts: filteredHosts}) // eslint-disable-line react/no-did-mount-set-state
  }

  public render() {
    const {
      source,
      autoRefresh,
      onManualRefresh,
      match: {params: {hostID, sourceID}},
      inPresentationMode,
      handleChooseAutoRefresh,
      handleClickPresentationButton,
    } = this.props
    const {layouts, timeRange, hosts} = this.state
    const names = _.map(hosts, ({name}) => ({
      name,
      link: `/sources/${sourceID}/hosts/${name}`,
    }))

    return (
      <div className="page">
        <DashboardHeader
          names={names}
          source={source}
          timeRange={timeRange}
          activeDashboard={hostID}
          autoRefresh={autoRefresh}
          isHidden={inPresentationMode}
          onManualRefresh={onManualRefresh}
          handleChooseAutoRefresh={handleChooseAutoRefresh}
          handleChooseTimeRange={this.handleChooseTimeRange}
          handleClickPresentationButton={handleClickPresentationButton}
        />
        <FancyScrollbar
          className={classnames({
            'page-contents': true,
            'presentation-mode': inPresentationMode,
          })}
        >
          <div className="container-fluid full-width dashboard">
            {layouts.length > 0 ? this.renderLayouts(layouts) : ''}
          </div>
        </FancyScrollbar>
      </div>
    )
  }
}

const mapStateToProps = ({
  app: {ephemeral: {inPresentationMode}, persisted: {autoRefresh}},
}) => ({
  inPresentationMode,
  autoRefresh,
})

const mapDispatchToProps = dispatch => ({
  handleChooseAutoRefresh: bindActionCreators(setAutoRefresh, dispatch),
  handleClickPresentationButton: presentationButtonDispatcher(dispatch),
})

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(ManualRefresh(HostPage))
