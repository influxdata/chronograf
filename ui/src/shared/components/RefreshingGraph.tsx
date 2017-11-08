import * as React from 'react'

import {emptyGraphCopy} from 'shared/copy/cell'

import AutoRefresh from 'shared/components/AutoRefresh'
import LineGraph from 'shared/components/LineGraph'
import SingleStat from 'shared/components/SingleStat'

import {
  AutoRefresh as AutoRefreshType,
  Axes,
  GraphType,
  ManualRefresh,
  ResizeCoords,
  Template,
  TextQuery,
  TimeRange,
} from 'src/types'
import * as FuncTypes from 'src/types/funcs'

const RefreshingLineGraph = AutoRefresh(LineGraph)
const RefreshingSingleStat = AutoRefresh(SingleStat)

export interface RefreshingGraphProps {
  timeRange: TimeRange
  autoRefresh: AutoRefreshType
  manualRefresh: ManualRefresh
  axes: Axes
  type: GraphType
  queries: TextQuery[]
  templates: Template[]
  resizeCoords: ResizeCoords
  onZoom: FuncTypes.onZoom
  synchronizer: FuncTypes.synchronizer
  editQueryStatus?: FuncTypes.editQueryStatus
  grabDataForDownload: FuncTypes.grabDataForDownload
  cellHeight: number
}

const RefreshingGraph: React.SFC<RefreshingGraphProps> = ({
  axes,
  type,
  onZoom,
  queries,
  templates,
  timeRange,
  cellHeight,
  autoRefresh,
  manualRefresh, // when changed, re-mounts the component
  synchronizer,
  resizeCoords,
  editQueryStatus,
  grabDataForDownload,
}) => {
  if (!queries.length) {
    return (
      <div className="graph-empty">
        <p data-test="data-explorer-no-results">{emptyGraphCopy}</p>
      </div>
    )
  }

  if (type === GraphType.SingleStat) {
    return (
      <RefreshingSingleStat
        key={manualRefresh}
        queries={[queries[0]]}
        templates={templates}
        autoRefresh={autoRefresh}
        cellHeight={cellHeight}
      />
    )
  }

  const displayOptions = {
    stepPlot: type === GraphType.LineStepplot,
    stackedGraph: type === GraphType.LineStacked,
  }

  return (
    <RefreshingLineGraph
      axes={axes}
      onZoom={onZoom}
      queries={queries}
      key={manualRefresh}
      templates={templates}
      timeRange={timeRange}
      autoRefresh={autoRefresh}
      isBarGraph={type === GraphType.Bar}
      synchronizer={synchronizer}
      resizeCoords={resizeCoords}
      displayOptions={displayOptions}
      editQueryStatus={editQueryStatus}
      grabDataForDownload={grabDataForDownload}
      showSingleStat={type === GraphType.LinePlusSingleStat}
    />
  )
}

RefreshingGraph.defaultProps = {
  manualRefresh: 0,
}

export default RefreshingGraph
