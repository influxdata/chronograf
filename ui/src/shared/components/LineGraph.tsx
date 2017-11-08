import * as React from 'react'
import Dygraph from 'shared/components/Dygraph'

import SingleStat from 'shared/components/SingleStat'
import timeSeriesToDygraph from 'utils/timeSeriesToDygraph'

import {SINGLE_STAT_LINE_COLORS} from 'shared/graphs/helpers'

import {Axes, Cell, Color, ResizeCoords, RuleValues, TimeRange} from 'src/types'
import {Result} from 'src/types/timeSeries'
import * as FuncTypes from 'src/types/funcs'

export interface LineGraphProps {
  axes: Axes
  overrideLineColors: Color[]
  ruleValues: RuleValues
  timeRange: TimeRange
  cell: Cell
  resizeCoords: ResizeCoords
  title: string
  isFetchingInitially: boolean
  isRefreshing: boolean
  isGraphFilled: boolean
  showSingleStat: boolean
  displayOptions: {
    stepPlot: boolean
    stackedGraph: boolean
  }
  isInDataExplorer: boolean
  isBarGraph: boolean
  activeQueryIndex: number
  cellHeight: number
  synchronizer: FuncTypes.synchronizer
  queries: {}
  data: Result[]
  setResolution: () => void
  underlayCallback: () => void
  onZoom: FuncTypes.onZoom
}

class LineGraph extends React.PureComponent<LineGraphProps> {
  public static defaultProps = {
    underlayCallback: () => ({}),
    isGraphFilled: true,
    overrideLineColors: null,
  }

  private _timeSeries

  public componentWillMount() {
    const {data, isInDataExplorer} = this.props
    this._timeSeries = timeSeriesToDygraph(data, isInDataExplorer)
  }

  public componentWillUpdate(nextProps: LineGraphProps) {
    const {data, activeQueryIndex} = this.props
    if (
      data !== nextProps.data ||
      activeQueryIndex !== nextProps.activeQueryIndex
    ) {
      this._timeSeries = timeSeriesToDygraph(
        nextProps.data,
        nextProps.isInDataExplorer
      )
    }
  }

  public render() {
    const {
      data,
      axes,
      cell,
      title,
      onZoom,
      queries,
      timeRange,
      cellHeight,
      ruleValues,
      isBarGraph,
      resizeCoords,
      synchronizer,
      isRefreshing,
      isGraphFilled,
      showSingleStat,
      displayOptions,
      underlayCallback,
      overrideLineColors,
      isFetchingInitially,
    } = this.props

    const {labels, timeSeries, dygraphSeries} = this._timeSeries

    // If data for this graph is being fetched for the first time, show a graph-wide spinner.
    if (isFetchingInitially) {
      return <GraphSpinner />
    }

    const options = {
      ...displayOptions,
      title,
      labels,
      rightGap: 0,
      yRangePad: 10,
      labelsKMB: true,
      underlayCallback,
      axisLabelWidth: 60,
      drawAxesAtZero: true,
      axisLineColor: '#383846',
      gridLineColor: '#383846',
      connectSeparatedPoints: true,
    }

    const lineColors = showSingleStat
      ? SINGLE_STAT_LINE_COLORS
      : overrideLineColors

    return (
      <div className="dygraph graph--hasYLabel" style={{height: '100%'}}>
        {isRefreshing ? <GraphLoadingDots /> : null}
        <Dygraph
          cell={cell}
          axes={axes}
          onZoom={onZoom}
          labels={labels}
          queries={queries}
          timeRange={timeRange}
          isBarGraph={isBarGraph}
          timeSeries={timeSeries}
          ruleValues={ruleValues}
          synchronizer={synchronizer}
          resizeCoords={resizeCoords}
          overrideLineColors={lineColors}
          dygraphSeries={dygraphSeries}
          setResolution={this.props.setResolution}
          containerStyle={{width: '100%', height: '100%'}}
          isGraphFilled={showSingleStat ? false : isGraphFilled}
          options={options}
        />
        {showSingleStat ? (
          <SingleStat data={data} cellHeight={cellHeight} />
        ) : null}
      </div>
    )
  }
}

const GraphLoadingDots = () => (
  <div className="graph-panel__refreshing">
    <div />
    <div />
    <div />
  </div>
)

const GraphSpinner = () => (
  <div className="graph-fetching">
    <div className="graph-spinner" />
  </div>
)

export default LineGraph
