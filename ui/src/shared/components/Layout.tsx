import * as React from 'react'
import * as PropTypes from 'prop-types'
import WidgetCell from 'shared/components/WidgetCell'
import LayoutCell from 'shared/components/LayoutCell'
import RefreshingGraph from 'shared/components/RefreshingGraph'
import {buildQueriesForLayouts} from 'utils/influxql'

import * as _ from 'lodash'

const getSource = (cell, source, sources, defaultSource) => {
  const s = _.get(cell, ['queries', '0', 'source'], null)
  if (!s) {
    return source
  }

  return sources.find(src => src.links.self === s) || defaultSource
}

class LayoutState extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      celldata: [],
    }
  }

  grabDataForDownload = celldata => {
    this.setState({celldata})
  }

  render() {
    const {celldata} = this.state
    return (
      <Layout
        {...this.props}
        celldata={celldata}
        grabDataForDownload={this.grabDataForDownload}
      />
    )
  }
}

const Layout = (
  {
    host,
    cell,
    cell: {h, axes, type},
    source,
    sources,
    onZoom,
    templates,
    timeRange,
    isEditable,
    onEditCell,
    autoRefresh,
    manualRefresh,
    onDeleteCell,
    synchronizer,
    resizeCoords,
    onCancelEditCell,
    onSummonOverlayTechnologies,
    grabDataForDownload,
    celldata,
  },
  {source: defaultSource}
) =>
  <LayoutCell
    cell={cell}
    isEditable={isEditable}
    onEditCell={onEditCell}
    celldata={celldata}
    onDeleteCell={onDeleteCell}
    onCancelEditCell={onCancelEditCell}
    onSummonOverlayTechnologies={onSummonOverlayTechnologies}
  >
    {cell.isWidget
      ? <WidgetCell cell={cell} timeRange={timeRange} source={source} />
      : <RefreshingGraph
          axes={axes}
          type={type}
          cellHeight={h}
          onZoom={onZoom}
          sources={sources}
          timeRange={timeRange}
          templates={templates}
          autoRefresh={autoRefresh}
          manualRefresh={manualRefresh}
          synchronizer={synchronizer}
          grabDataForDownload={grabDataForDownload}
          resizeCoords={resizeCoords}
          queries={buildQueriesForLayouts(
            cell,
            getSource(cell, source, sources, defaultSource),
            timeRange,
            host
          )}
        />}
  </LayoutCell>

const {arrayOf, bool, func, number, shape, string} = PropTypes

Layout.contextTypes = {
  source: shape(),
}

const propTypes = {
  autoRefresh: number.isRequired,
  manualRefresh: number,
  timeRange: shape({
    lower: string.isRequired,
  }),
  cell: shape({
    // isWidget cells will not have queries
    isWidget: bool,
    queries: arrayOf(
      shape({
        label: string,
        text: string,
        query: string,
      }).isRequired
    ),
    x: number.isRequired,
    y: number.isRequired,
    w: number.isRequired,
    h: number.isRequired,
    i: string.isRequired,
    name: string.isRequired,
    type: string.isRequired,
  }).isRequired,
  templates: arrayOf(shape()),
  host: string,
  source: shape({
    links: shape({
      proxy: string.isRequired,
    }).isRequired,
  }).isRequired,
  onPositionChange: func,
  onEditCell: func,
  onDeleteCell: func,
  onSummonOverlayTechnologies: func,
  synchronizer: func,
  isStatusPage: bool,
  isEditable: bool,
  onCancelEditCell: func,
  resizeCoords: shape(),
  onZoom: func,
  sources: arrayOf(shape()),
}

LayoutState.propTypes = {...propTypes}
Layout.propTypes = {
  ...propTypes,
  grabDataForDownload: func,
  celldata: arrayOf(shape()),
}

export default LayoutState
