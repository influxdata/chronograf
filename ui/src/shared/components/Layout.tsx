import * as React from 'react'
import * as PropTypes from 'prop-types'
import * as _ from 'lodash'

import WidgetCell from 'shared/components/WidgetCell'
import LayoutCell from 'shared/components/LayoutCell'
import RefreshingGraph from 'shared/components/RefreshingGraph'
import {buildQueriesForLayouts} from 'utils/influxql'
import {Cell, LayoutProps, ResizeCoords} from 'src/types'

const getSource = (cell, source, sources, defaultSource) => {
  const s = _.get(cell, ['queries', '0', 'source'], null)
  if (!s) {
    return source
  }

  return sources.find(src => src.links.self === s) || defaultSource
}

export type LayoutStateProps = LayoutProps & {
  resizeCoords: ResizeCoords
}

export interface LayoutStateState {
  celldata: Cell[]
}

class LayoutState extends React.Component<LayoutStateProps, LayoutStateState> {
  public state = {
    celldata: [],
  }

  private grabDataForDownload = celldata => {
    this.setState({celldata})
  }

  public render() {
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
) => (
  <LayoutCell
    cell={cell}
    isEditable={isEditable}
    onEditCell={onEditCell}
    celldata={celldata}
    onDeleteCell={onDeleteCell}
    onCancelEditCell={onCancelEditCell}
    onSummonOverlayTechnologies={onSummonOverlayTechnologies}
  >
    {cell.isWidget ? (
      <WidgetCell cell={cell} timeRange={timeRange} source={source} />
    ) : (
      <RefreshingGraph
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
      />
    )}
  </LayoutCell>
)

const {arrayOf, bool, func, number, shape, string} = PropTypes

Layout.contextTypes = {
  source: shape(),
}

const propTypes = {}

LayoutState.propTypes = {...propTypes}
Layout.propTypes = {
  ...propTypes,
  grabDataForDownload: func,
  celldata: arrayOf(shape()),
}

export default LayoutState
