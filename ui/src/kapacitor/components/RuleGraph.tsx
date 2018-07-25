// Libraries
import React, {PureComponent, CSSProperties} from 'react'
import {connect} from 'react-redux'
import TimeSeries from 'src/shared/components/time_series/TimeSeries'

// Components
import Dygraph from 'src/shared/components/Dygraph'
import TimeRangeDropdown from 'src/shared/components/TimeRangeDropdown'

// Utils
import buildInfluxQLQuery from 'src/utils/influxql'
import buildQueries from 'src/utils/buildQueriesForGraphs'
import underlayCallback from 'src/kapacitor/helpers/ruleGraphUnderlay'
import {timeSeriesToDygraph} from 'src/utils/timeSeriesTransformers'

// Constants
import {LINE_COLORS_RULE_GRAPH} from 'src/shared/constants/graphColorPalettes'

// Types
import {
  Source,
  AlertRule,
  QueryConfig,
  Query,
  TimeRange,
  CellType,
} from 'src/types'

import {ErrorHandling} from 'src/shared/decorators/errors'
import {setHoverTime as setHoverTimeAction} from 'src/dashboards/actions'

interface Props {
  source: Source
  query: QueryConfig
  rule: AlertRule
  timeRange: TimeRange
  onChooseTimeRange: (tR: TimeRange) => void
  setHoverTime: (time: number) => void
}

@ErrorHandling
class RuleGraph extends PureComponent<Props> {
  public render() {
    const {source, onChooseTimeRange, timeRange, rule} = this.props

    if (!this.queryText) {
      return (
        <div className="rule-builder--graph-empty">
          <p>
            Select a <strong>Time-Series</strong> to preview on a graph
          </p>
        </div>
      )
    }

    return (
      <div className="rule-builder--graph">
        <div className="rule-builder--graph-options">
          <p>Preview Data from</p>
          <TimeRangeDropdown
            onChooseTimeRange={onChooseTimeRange}
            selected={timeRange}
            preventCustomTimeRange={true}
          />
        </div>
        <div className="dygraph graph--hasYLabel" style={this.style}>
          <TimeSeries source={source} queries={this.queries}>
            {data => {
              const {labels, timeSeries, dygraphSeries} = timeSeriesToDygraph(
                data.timeSeries,
                'rule-builder'
              )
              return (
                <Dygraph
                  type={CellType.Line}
                  queries={this.queries}
                  timeSeries={timeSeries}
                  labels={labels}
                  options={this.options}
                  containerStyle={this.containerStyle}
                  dygraphSeries={dygraphSeries}
                  timeRange={timeRange}
                  colors={LINE_COLORS_RULE_GRAPH}
                  ruleValues={rule.values}
                  staticLegend={false}
                  isGraphFilled={false}
                  underlayCallback={underlayCallback(rule)}
                  handleSetHoverTime={this.props.setHoverTime}
                />
              )
            }}
          </TimeSeries>
        </div>
      </div>
    )
  }

  private get options() {
    return {
      rightGap: 0,
      yRangePad: 10,
      labelsKMB: true,
      fillGraph: true,
      axisLabelWidth: 60,
      animatedZooms: true,
      drawAxesAtZero: true,
      axisLineColor: '#383846',
      gridLineColor: '#383846',
      connectSeparatedPoints: true,
    }
  }

  private get containerStyle(): CSSProperties {
    return {
      width: 'calc(100% - 32px)',
      height: 'calc(100% - 16px)',
      position: 'absolute',
      top: '8px',
    }
  }

  private get style(): CSSProperties {
    return {height: '100%'}
  }

  private get queryText(): string {
    const {timeRange, query} = this.props
    const lower = timeRange.lower
    return buildInfluxQLQuery({lower}, query)
  }

  private get queries(): Query[] {
    const {query, timeRange} = this.props
    return buildQueries([query], timeRange)
  }
}

const mdtp = {
  setHoverTime: setHoverTimeAction,
}

export default connect(null, mdtp)(RuleGraph)
