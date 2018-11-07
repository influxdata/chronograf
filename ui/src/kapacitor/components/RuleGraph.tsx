// Libraries
import React, {PureComponent, CSSProperties} from 'react'
import {connect} from 'react-redux'
import TimeSeries from 'src/shared/components/time_series/TimeSeries'
import uuid from 'uuid'

// Components
import TimeRangeDropdown from 'src/shared/components/TimeRangeDropdown'
import RuleGraphDygraph from 'src/kapacitor/components/RuleGraphDygraph'
import {ErrorHandling} from 'src/shared/decorators/errors'

// Utils
import buildInfluxQLQuery from 'src/utils/influxql'
import buildQueries from 'src/utils/buildQueriesForGraphs'
import {setHoverTime as setHoverTimeAction} from 'src/dashboards/actions'

// Constants
import {TEMP_VAR_DASHBOARD_TIME} from 'src/shared/constants'

// Types
import {
  Source,
  AlertRule,
  QueryConfig,
  Query,
  TimeRange,
  Template,
  TemplateType,
  TemplateValueType,
} from 'src/types'

interface Props {
  source: Source
  query: QueryConfig
  rule: AlertRule
  timeRange: TimeRange
  onChooseTimeRange: (tR: TimeRange) => void
  setHoverTime: typeof setHoverTimeAction
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
          <TimeSeries
            timeRange={timeRange}
            source={source}
            queries={this.queries}
            templates={this.templates}
            uuid={uuid.v1()}
          >
            {data => {
              return (
                <RuleGraphDygraph
                  loading={data.loading}
                  query={this.props.query}
                  rule={rule}
                  timeRange={timeRange}
                  timeSeries={data.timeSeriesInfluxQL}
                  setHoverTime={this.props.setHoverTime}
                />
              )
            }}
          </TimeSeries>
        </div>
      </div>
    )
  }

  private get style(): CSSProperties {
    return {height: '100%'}
  }

  private get queryText(): string {
    const {timeRange, query} = this.props
    const lower = timeRange.lower
    return buildInfluxQLQuery({lower}, query)
  }

  private get templates(): Template[] {
    const {timeRange} = this.props

    const dashboardTime = {
      id: TEMP_VAR_DASHBOARD_TIME,
      tempVar: TEMP_VAR_DASHBOARD_TIME,
      type: TemplateType.Constant,
      label: '',
      values: [
        {
          value: timeRange.lower,
          type: TemplateValueType.Constant,
          selected: true,
          localSelected: true,
        },
      ],
    }

    return [dashboardTime]
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
