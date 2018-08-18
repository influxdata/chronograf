import React, {Component, CSSProperties} from 'react'
import Dygraph from 'src/shared/components/Dygraph'

// Constants
import {LINE_COLORS_RULE_GRAPH} from 'src/shared/constants/graphColorPalettes'

// Utils
import buildQueries from 'src/utils/buildQueriesForGraphs'
import underlayCallback from 'src/kapacitor/helpers/ruleGraphUnderlay'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {setHoverTime as setHoverTimeAction} from 'src/dashboards/actions'
import {
  TimeSeriesToDyGraphReturnType,
  timeSeriesToDygraph,
} from 'src/utils/timeSeriesTransformers'

// Types
import {
  AlertRule,
  QueryConfig,
  Query,
  TimeRange,
  RemoteDataState,
} from 'src/types'
import {TimeSeriesServerResponse} from 'src/types/series'

interface Props {
  query: QueryConfig
  rule: AlertRule
  timeRange: TimeRange
  setHoverTime: typeof setHoverTimeAction
  loading: RemoteDataState
  timeSeries: TimeSeriesServerResponse[]
}

interface State {
  timeSeriesToDygraphResult?: TimeSeriesToDyGraphReturnType
}

@ErrorHandling
class RuleGraphDygraph extends Component<Props, State> {
  public async componentWillReceiveProps(nextProps: Props) {
    const {loading, timeSeries} = this.props
    if (
      loading !== nextProps.loading &&
      nextProps.loading === RemoteDataState.Done
    ) {
      const result = await timeSeriesToDygraph(timeSeries, 'rule-builder')
      this.setState({timeSeriesToDygraphResult: result})
    }
  }

  public render() {
    const {timeRange, rule} = this.props
    const {timeSeriesToDygraphResult} = this.state

    return (
      <Dygraph
        labels={timeSeriesToDygraphResult.labels}
        staticLegend={false}
        isGraphFilled={false}
        ruleValues={rule.values}
        options={this.options}
        timeRange={timeRange}
        queries={this.queries}
        timeSeries={timeSeriesToDygraphResult.timeSeries}
        dygraphSeries={timeSeriesToDygraphResult.dygraphSeries}
        colors={LINE_COLORS_RULE_GRAPH}
        containerStyle={this.containerStyle}
        underlayCallback={underlayCallback(rule)}
        handleSetHoverTime={this.props.setHoverTime}
      />
    )
  }

  private get containerStyle(): CSSProperties {
    return {
      width: 'calc(100% - 32px)',
      height: 'calc(100% - 16px)',
      position: 'absolute',
      top: '8px',
    }
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

  private get queries(): Query[] {
    const {query, timeRange} = this.props
    return buildQueries([query], timeRange)
  }
}

export default RuleGraphDygraph
