import * as React from 'react'
import * as PropTypes from 'prop-types'
import * as _ from 'lodash'

import WidgetCell from 'shared/components/WidgetCell'
import LayoutCell from 'shared/components/LayoutCell'
import RefreshingGraph from 'shared/components/RefreshingGraph'
import {buildQueriesForLayouts} from 'utils/influxql'
import {Cell, LayoutProps, ResizeCoords, Source} from 'src/types'
import {RawResponse} from 'src/types/timeSeries'
import * as FuncTypes from 'src/types/funcs'

const getSource = (
  cell: Cell,
  source: Source,
  sources: Source[],
  defaultSource: Source
) => {
  const s = _.get(cell, ['queries', '0', 'source'], null)
  if (!s) {
    return source || defaultSource
  }

  return sources.find(src => src.links.self === s) || defaultSource
}

export type LayoutStateProps = LayoutProps & {
  resizeCoords: ResizeCoords
}

export interface LayoutStateState {
  celldata: RawResponse[]
}

class LayoutState extends React.Component<LayoutStateProps, LayoutStateState> {
  public state = {
    celldata: [],
  }

  private grabDataForDownload = (celldata: RawResponse[]) => {
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

const Layout: React.SFC<
  LayoutStateProps & {
    grabDataForDownload: FuncTypes.grabDataForDownload
    celldata: RawResponse[]
  }
> = (
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
    autoRefresh,
    manualRefresh,
    onDeleteCell,
    synchronizer,
    resizeCoords,
    onSummonOverlayTechnologies,
    grabDataForDownload,
    celldata,
  },
  {source: defaultSource}
) => (
  <LayoutCell
    cell={cell}
    isEditable={isEditable}
    celldata={celldata}
    onDeleteCell={onDeleteCell}
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

Layout.contextTypes = {
  source: PropTypes.shape({}),
}

export default LayoutState
