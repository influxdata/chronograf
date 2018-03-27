import React, {PureComponent, CSSProperties} from 'react'
import Dygraph from 'src/shared/components/Dygraph'
import _ from 'lodash'

import {
  // timeSeriesToDygraph,
  TimeSeriesToDyGraphReturnType,
} from 'src/utils/timeSeriesTransformers'

import {timeSeriesToDygraph, errorBars} from 'src/loudml/utils/timeSeriesToDygraph'
import { numberValueFormatter } from 'src/utils/formatting';

import {ErrorHandlingWith} from 'src/shared/decorators/errors'
import InvalidData from 'src/shared/components/InvalidData'
import {Query, Axes, RuleValues, TimeRange} from 'src/types'
import {DecimalPlaces} from 'src/types/dashboards'
import {ColorString} from 'src/types/colors'
import {Data} from 'src/types/dygraphs'

// @ts-ignore
const validateTimeSeries = ts => {
  return true
  /*
  return _.every(ts, r =>
    _.every(
      r,
      (v, i: number) =>
        (i === 0 && Date.parse(v)) || _.isNumber(v) || _.isNull(v)
    )
  )
  */
}

interface Props {
  axes: Axes
  title: string
  cellID: string
  cellHeight: number
  isFetchingInitially: boolean
  isRefreshing: boolean
  staticLegend: boolean
  displayOptions: {
    stepPlot: boolean
    stackedGraph: boolean
    animatedZooms: boolean
  }
  activeQueryIndex: number
  ruleValues: RuleValues
  timeRange: TimeRange
  isInDataExplorer: boolean
  onZoom: () => void
  data: Data
  queries: Query[]
  colors: ColorString[]
  decimalPlaces: DecimalPlaces
  underlayCallback?: () => void
  setResolution: () => void
  handleSetHoverTime: () => void
}

@ErrorHandlingWith(InvalidData)
class ErrorGraph extends PureComponent<Props> {
  public static defaultProps: Partial<Props> = {
    underlayCallback: () => {},
    staticLegend: false,
  }

  private isValidData: boolean = true
  private timeSeries: TimeSeriesToDyGraphReturnType

  public componentWillMount() {
    const {data, isInDataExplorer} = this.props
    this.parseTimeSeries(data, isInDataExplorer)
  }

  public parseTimeSeries(data, isInDataExplorer) {
    this.timeSeries = errorBars(timeSeriesToDygraph(data, isInDataExplorer))
    this.isValidData = validateTimeSeries(
      _.get(this.timeSeries, 'timeSeries', [])
    )
  }

  public componentWillUpdate(nextProps) {
    const {data, activeQueryIndex} = this.props
    if (
      data !== nextProps.data ||
      activeQueryIndex !== nextProps.activeQueryIndex
    ) {
      this.parseTimeSeries(nextProps.data, nextProps.isInDataExplorer)
    }
  }

  public render() {
    if (!this.isValidData) {
      return <InvalidData />
    }

    const {
      axes,
      title,
      colors,
      cellID,
      onZoom,
      queries,
      timeRange,
      ruleValues,
      isRefreshing,
      setResolution,
      displayOptions,
      staticLegend,
      underlayCallback,
      isFetchingInitially,
      handleSetHoverTime,
    } = this.props

    const {labels, timeSeries, dygraphSeries} = this.timeSeries

    // If data for this graph is being fetched for the first time, show a graph-wide spinner.
    if (isFetchingInitially) {
      return <GraphSpinner />
    }

    // @ts-ignore
    const valueFormatter = (value, opts, seriesName, dygraph, row, col) => {
      const rowData = dygraph.getValue(row, col)
      if (Array.isArray(rowData)) {
          const [lower, mid, upper] = rowData
              .map(v => (
                  v
                  ?numberValueFormatter(v, opts, '', '')
                  :''
              ))
          if (!lower&&!upper) {
              return `${mid} [-]`
          }
          return `${mid} [${lower}, ${upper}]`
      }
      return numberValueFormatter(value, opts, '', '')
    }

    /*
     * need to make line graph if bad data
     */
    const customBars = (timeSeries
      && timeSeries.length !== 0
      && timeSeries[0].length>1
      && Array.isArray(timeSeries[0][1])
      // @ts-ignore
      && timeSeries[0][1].length === 3)
    const fillGraph = !customBars

    const options = {
      ...displayOptions,
      title,
      labels,
      rightGap: 0,
      yRangePad: 10,
      labelsKMB: true,
      fillGraph,
      underlayCallback,
      axisLabelWidth: 60,
      drawAxesAtZero: true,
      axisLineColor: '#383846',
      gridLineColor: '#383846',
      connectSeparatedPoints: true,
      customBars,
      axes: {
        y: {
            valueFormatter,
        },
        y2: {
            valueFormatter,
        },
      },
      fillAlpha: 0.35,  // 0.15
    }

    return (
      <div className="dygraph graph--hasYLabel" style={this.style}>
        {isRefreshing && <GraphLoadingDots />}
        <Dygraph
          axes={axes}
          cellID={cellID}
          colors={colors}
          onZoom={onZoom}
          labels={labels}
          queries={queries}
          options={options}
          timeRange={timeRange}
          isBarGraph={false}
          timeSeries={timeSeries}
          ruleValues={ruleValues}
          staticLegend={staticLegend}
          dygraphSeries={dygraphSeries}
          setResolution={setResolution}
          containerStyle={this.containerStyle}
          handleSetHoverTime={handleSetHoverTime}
          isGraphFilled={false}
        />
      </div>
    )
  }

  private get style(): CSSProperties {
    return {height: '100%'}
  }

  /*
  private get prefix(): string {
    const {axes} = this.props

    if (!axes) {
      return ''
    }

    return axes.y.prefix
  }

  private get suffix(): string {
    const {axes} = this.props

    if (!axes) {
      return ''
    }

    return axes.y.suffix
  }
  */

  private get containerStyle(): CSSProperties {
    return {
      width: 'calc(100% - 32px)',
      height: 'calc(100% - 16px)',
      position: 'absolute',
      top: '8px',
    }
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

export default ErrorGraph
