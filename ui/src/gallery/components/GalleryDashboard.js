import React, {Component, PropTypes} from 'react'
import classnames from 'classnames'

import LayoutRenderer from 'shared/components/LayoutRenderer'
import DashboardHeader from 'src/dashboards/components/DashboardHeader'
import timeRanges from 'hson!../../shared/data/timeRanges.hson'

class GalleryDashboard extends Component {
  constructor(props) {
    super(props)
    const fifteenMinutesIndex = 1
    this.state = {
      timeRange: timeRanges[fifteenMinutesIndex],
    }
  }

  renderLayouts(layouts) {
    const {timeRange} = this.state
    const {source, autoRefresh} = this.props

    let layoutCells = []
    layouts.forEach((layout) => {
      layoutCells = layoutCells.concat(layout.cells)
    })

    layoutCells.forEach((cell, i) => {
      cell.queries.forEach((q) => {
        q.text = q.query
        q.database = source.telegraf
      })
      cell.x = (i * 4 % 12) // eslint-disable-line no-magic-numbers
      cell.y = 0
    })

    return (
      <LayoutRenderer
        timeRange={timeRange}
        cells={layoutCells}
        autoRefresh={autoRefresh}
        source={source.links.proxy}
      />
    )
  }

  handleChooseTimeRange({lower}) {
    const timeRange = timeRanges.find((range) => range.lower === lower)
    this.setState({timeRange})
  }

  render() {
    const {app, autoRefresh, handleChooseAutoRefresh, handleClickPresentationButton, layouts, inPresentationMode, source} = this.props
    const {timeRange} = this.state
    const emptyState = (
      <div className="generic-empty-state">
        <span className="icon alert-triangle"></span>
        <h4>No Layouts Found</h4>
      </div>
    )

    return (
      <div className="page">
        <DashboardHeader
          headerText={`${app} Dashboard`}
          autoRefresh={autoRefresh}
          handleChooseAutoRefresh={handleChooseAutoRefresh}
          timeRange={timeRange}
          handleChooseTimeRange={this.handleChooseTimeRange}
          isHidden={inPresentationMode}
          handleClickPresentationButton={handleClickPresentationButton}
          source={source}
        />
        <div className={classnames({
          'page-contents': true,
          'presentation-mode': inPresentationMode,
        })}>
          <div className="container-fluid full-width dashboard">
            {layouts.length ? this.renderLayouts(layouts) : emptyState}
          </div>
        </div>
      </div>
    )
  }
}

const {
  arrayOf,
  bool,
  func,
  number,
  shape,
  string,
} = PropTypes

GalleryDashboard.propTypes = {
  app: string.isRequired,
  source: shape({
    links: shape({
      proxy: string.isRequired,
    }).isRequired,
    telegraf: string.isRequired,
  }),
  layouts: arrayOf(shape().isRequired).isRequired,
  autoRefresh: number.isRequired,
  handleChooseAutoRefresh: func.isRequired,
  inPresentationMode: bool.isRequired,
  handleClickPresentationButton: func,
}

export default GalleryDashboard
