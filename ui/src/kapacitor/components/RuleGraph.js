import React, {Component} from 'react'
import {connect} from 'react-redux'
import PropTypes from 'prop-types'
import buildInfluxQLQuery from 'utils/influxql'
import AutoRefresh from 'src/shared/components/AutoRefresh'
import LineGraph from 'src/shared/components/LineGraph'
import TimeRangeDropdown from 'src/shared/components/TimeRangeDropdown'
import underlayCallback from 'src/kapacitor/helpers/ruleGraphUnderlay'
import {ErrorHandling} from 'src/shared/decorators/errors'

import {setHoverTime as setHoverTimeAction} from 'src/dashboards/actions'

import {LINE_COLORS_RULE_GRAPH} from 'src/shared/constants/graphColorPalettes'

const RefreshingLineGraph = AutoRefresh(LineGraph)

@ErrorHandling
class RuleGraph extends Component {
  render() {
    const {
      query,
      source,
      timeRange: {lower},
      timeRange,
      rule,
      onChooseTimeRange,
      handleSetHoverTime,
    } = this.props
    const autoRefreshMs = 30000
    const queryText = buildInfluxQLQuery({lower}, query)
    const queries = [{host: source.links.proxy, text: queryText}]

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
          source={source}
          queries={queries}
          isGraphFilled={false}
          ruleValues={rule.values}
          autoRefresh={autoRefreshMs}
          colors={LINE_COLORS_RULE_GRAPH}
          underlayCallback={underlayCallback(rule)}
          handleSetHoverTime={handleSetHoverTime}
        />
      </div>
    )
  }
}

const {shape, string, func} = PropTypes

RuleGraph.propTypes = {
  source: shape({
    links: shape({
      proxy: string.isRequired,
    }).isRequired,
  }).isRequired,
  query: shape({}).isRequired,
  rule: shape({}).isRequired,
  timeRange: shape({}).isRequired,
  onChooseTimeRange: func.isRequired,
  handleSetHoverTime: func.isRequired,
}

const mdtp = {
  handleSetHoverTime: setHoverTimeAction,
}

export default connect(null, mdtp)(RuleGraph)
