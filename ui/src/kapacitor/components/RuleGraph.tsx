import * as React from 'react'
import buildInfluxQLQuery from 'utils/influxql'
import AutoRefresh from 'shared/components/AutoRefresh'
import LineGraph from 'shared/components/LineGraph'
import TimeRangeDropdown from 'shared/components/TimeRangeDropdown'
import underlayCallback from 'kapacitor/helpers/ruleGraphUnderlay'

import {
  AutoRefresh as AutoRefreshType,
  Color,
  Rule,
  Source,
  TextQuery,
  TimeRange,
} from 'src/types'

export interface RefreshingRuleGraphProps {
  queries: TextQuery[]
  isGraphFilled: boolean
  ruleValues: RuleValues
  autoRefresh: AutoRefreshType
  overrideLineColors: Color[]
  underlayCallback: () => void
}

const RefreshingLineGraph = AutoRefresh<RefreshingRuleGraphProps>(LineGraph)

export interface RuleGraphProps {
  source: Source
  query: TextQuery
  rule: Rule
  timeRange: TimeRange
  onChooseTimeRange: () => void
}

const RuleGraph: React.SFC<RuleGraphProps> = ({
  query,
  source,
  timeRange: {lower},
  timeRange,
  rule,
  onChooseTimeRange,
}) => {
  const autoRefreshMs = 30000
  const queryText = buildInfluxQLQuery({lower}, query)
  const queries = [{host: source.links.proxy, text: queryText}]
  const kapacitorLineColors = ['#4ED8A0']

  if (!queryText) {
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
      <RefreshingLineGraph
        queries={queries}
        isGraphFilled={false}
        ruleValues={rule.values}
        autoRefresh={autoRefreshMs}
        overrideLineColors={kapacitorLineColors}
        underlayCallback={underlayCallback(rule)}
      />
    </div>
  )
}

export default RuleGraph
