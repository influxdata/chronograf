import React, {SFC} from 'react'
import {connect} from 'react-redux'

import {emptyGraphCopy} from 'src/shared/copy/cell'
import {bindActionCreators} from 'redux'

import AutoRefresh, {
  IndividualRefreshingGraphProps,
} from 'src/shared/components/AutoRefresh'
import LineGraph from 'src/shared/components/LineGraph'
import SingleStat from 'src/shared/components/SingleStat'
import GaugeChart from 'src/shared/components/GaugeChart'
import TableGraph from 'src/shared/components/TableGraph'

import {setHoverTime} from 'src/dashboards/actions'
import {
  DEFAULT_TIME_FORMAT,
  DEFAULT_DECIMAL_PLACES,
} from 'src/dashboards/constants'

import {TimeRange, Template, Axes, Query} from 'src/types'
import {ColorString} from 'src/types/colors'
import {TableOptions, FieldName, DecimalPlaces} from 'src/types/dashboard'
import {TimeSeriesServerResponse} from 'src/types/series'

interface Props {
  timeRange: TimeRange
  autoRefresh: number
  manualRefresh: number
  templates: Template[]
  type: string
  cellHeight: number
  resizerTopHeight: number
  axes: Axes
  queries: Query[]
  editQueryStatus: () => void
  staticLegend: boolean
  onZoom: () => void
  grabDataForDownload: (timeSeries: TimeSeriesServerResponse[]) => void
  colors: ColorString[]
  cellID: string
  inView: boolean
  tableOptions: TableOptions
  fieldOptions: FieldName[]
  timeFormat: string
  decimalPlaces: DecimalPlaces
  hoverTime: string
  handleSetHoverTime: (hovertime: string) => void
  isInCEO: boolean
  onSetResolution: (resolution: number) => void
}

export interface DisplayOptions {
  stepPlot: boolean
  stackedGraph: boolean
}

const RefreshingLineGraph: IndividualRefreshingGraphProps = AutoRefresh(
  LineGraph
)
const RefreshingSingleStat: IndividualRefreshingGraphProps = AutoRefresh(
  SingleStat
)
const RefreshingGaugeChart: IndividualRefreshingGraphProps = AutoRefresh(
  GaugeChart
)
const RefreshingTableGraph: IndividualRefreshingGraphProps = AutoRefresh(
  TableGraph
)

const RefreshingGraph: SFC<Props> = ({
  axes,
  inView,
  type,
  colors,
  onZoom,
  cellID,
  queries,
  hoverTime,
  tableOptions,
  templates,
  timeRange,
  cellHeight,
  autoRefresh,
  fieldOptions,
  timeFormat,
  decimalPlaces,
  onSetResolution,
  resizerTopHeight,
  staticLegend,
  manualRefresh, // when changed, re-mounts the component
  editQueryStatus,
  handleSetHoverTime,
  grabDataForDownload,
  isInCEO,
}) => {
  const prefix = (axes && axes.y.prefix) || ''
  const suffix = (axes && axes.y.suffix) || ''
  if (!queries.length) {
    return (
      <div className="graph-empty">
        <p data-test="data-explorer-no-results">{emptyGraphCopy}</p>
      </div>
    )
  }

  if (type === 'single-stat') {
    return (
      <RefreshingSingleStat
        type={type}
        colors={colors}
        key={manualRefresh}
        queries={[queries[0]]}
        templates={templates}
        autoRefresh={autoRefresh}
        cellHeight={cellHeight}
        editQueryStatus={editQueryStatus}
        prefix={prefix}
        suffix={suffix}
        inView={inView}
        onSetResolution={onSetResolution}
        lineGraph={false}
        staticLegendHeight={null}
      />
    )
  }

  if (type === 'gauge') {
    return (
      <RefreshingGaugeChart
        type={type}
        colors={colors}
        key={manualRefresh}
        queries={[queries[0]]}
        templates={templates}
        autoRefresh={autoRefresh}
        cellHeight={cellHeight}
        resizerTopHeight={resizerTopHeight}
        editQueryStatus={editQueryStatus}
        cellID={cellID}
        prefix={prefix}
        suffix={suffix}
        inView={inView}
        onSetResolution={onSetResolution}
      />
    )
  }

  if (type === 'table') {
    return (
      <RefreshingTableGraph
        type={type}
        cellID={cellID}
        colors={colors}
        inView={inView}
        hoverTime={hoverTime}
        key={manualRefresh}
        queries={queries}
        templates={templates}
        autoRefresh={autoRefresh}
        cellHeight={cellHeight}
        tableOptions={tableOptions}
        fieldOptions={fieldOptions}
        timeFormat={timeFormat}
        decimalPlaces={decimalPlaces}
        editQueryStatus={editQueryStatus}
        resizerTopHeight={resizerTopHeight}
        grabDataForDownload={grabDataForDownload}
        handleSetHoverTime={handleSetHoverTime}
        isInCEO={isInCEO}
        onSetResolution={onSetResolution}
      />
    )
  }

  const displayOptions: DisplayOptions = {
    stepPlot: type === 'line-stepplot',
    stackedGraph: type === 'line-stacked',
  }

  return (
    <RefreshingLineGraph
      type={type}
      axes={axes}
      cellID={cellID}
      colors={colors}
      onZoom={onZoom}
      queries={queries}
      inView={inView}
      key={manualRefresh}
      templates={templates}
      timeRange={timeRange}
      autoRefresh={autoRefresh}
      isBarGraph={type === 'bar'}
      staticLegend={staticLegend}
      displayOptions={displayOptions}
      editQueryStatus={editQueryStatus}
      grabDataForDownload={grabDataForDownload}
      handleSetHoverTime={handleSetHoverTime}
      showSingleStat={type === 'line-plus-single-stat'}
      onSetResolution={onSetResolution}
    />
  )
}

RefreshingGraph.defaultProps = {
  manualRefresh: 0,
  staticLegend: false,
  inView: true,
  timeFormat: DEFAULT_TIME_FORMAT,
  decimalPlaces: DEFAULT_DECIMAL_PLACES,
}

const mapStateToProps = ({dashboardUI, annotations: {mode}}) => ({
  mode,
  hoverTime: dashboardUI.hoverTime,
})

const mapDispatchToProps = dispatch => ({
  handleSetHoverTime: bindActionCreators(setHoverTime, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(RefreshingGraph)
