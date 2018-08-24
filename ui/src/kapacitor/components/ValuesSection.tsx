import React, {Component, ChangeEvent} from 'react'

import {Radio, ComponentColor} from 'src/reusable_ui'
import Deadman from 'src/kapacitor/components/Deadman'
import Threshold from 'src/kapacitor/components/Threshold'
import Relative from 'src/kapacitor/components/Relative'
import DataSection from 'src/kapacitor/components/DataSection'
import RuleGraph from 'src/kapacitor/components/RuleGraph'

import {
  AlertRule,
  QueryConfig,
  Source,
  TimeRange,
  AlertRuleType,
} from 'src/types'
import {KapacitorQueryConfigActions} from 'src/types/actions'

interface Item {
  text: string
}

interface TypeItem extends Item {
  type: string
}

interface Props {
  rule: AlertRule
  onChooseTrigger: (ruleID: string, trigger: AlertRuleType) => void
  onUpdateValues: () => void
  query: QueryConfig
  onDeadmanChange: (item: Item) => void
  onRuleTypeDropdownChange: (item: TypeItem) => void
  onRuleTypeInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  onAddEvery: (frequency: string) => void
  onRemoveEvery: () => void
  timeRange: TimeRange
  queryConfigActions: KapacitorQueryConfigActions
  source: Source
  onChooseTimeRange: (timeRange: TimeRange) => void
}

class ValuesSection extends Component<Props> {
  public render() {
    return (
      <div className="rule-section">
        <h3 className="rule-section--heading">Alert Type</h3>
        <div className="rule-section--body">
          {this.triggerSelector}
          <h3 className="rule-section--sub-heading">Time Series</h3>
          {this.dataSection}
          <h3 className="rule-section--sub-heading">Conditions</h3>
          {this.thresholdRule}
          {this.relativeRule}
          {this.deadmanRule}
          {this.ruleGraph}
        </div>
      </div>
    )
  }

  private get triggerSelector(): JSX.Element {
    const {rule} = this.props

    return (
      <div className="rule-section--row rule-section--row-first rule-section--row-last">
        <p>Choose One:</p>
        <Radio color={ComponentColor.Success}>
          <Radio.Button
            id="rule-builder-trigger--threshold"
            value={AlertRuleType.Threshold}
            titleText="Use Threshold rule type"
            active={rule.trigger === AlertRuleType.Threshold}
            onClick={this.handleTriggerTabClick}
          >
            Threshold
          </Radio.Button>
          <Radio.Button
            id="rule-builder-trigger--relative"
            value={AlertRuleType.Relative}
            titleText="Use Relative rule type"
            active={rule.trigger === AlertRuleType.Relative}
            onClick={this.handleTriggerTabClick}
          >
            Relative
          </Radio.Button>
          <Radio.Button
            id="rule-builder-trigger--deadman"
            value={AlertRuleType.Deadman}
            titleText="Use Deadman rule type"
            active={rule.trigger === AlertRuleType.Deadman}
            onClick={this.handleTriggerTabClick}
          >
            Deadman
          </Radio.Button>
        </Radio>
      </div>
    )
  }

  private handleTriggerTabClick = (trigger: AlertRuleType): void => {
    const {rule, onChooseTrigger} = this.props

    onChooseTrigger(rule.id, trigger)
  }

  private get dataSection(): JSX.Element {
    const {rule, query, timeRange, onAddEvery, queryConfigActions} = this.props

    return (
      <DataSection
        query={query}
        timeRange={timeRange}
        isKapacitorRule={true}
        actions={queryConfigActions}
        onAddEvery={onAddEvery}
        isDeadman={this.isDeadman(rule)}
      />
    )
  }

  private get thresholdRule(): JSX.Element {
    const {
      rule,
      query,
      onRuleTypeInputChange,
      onRuleTypeDropdownChange,
    } = this.props

    if (rule.trigger === AlertRuleType.Threshold) {
      return (
        <Threshold
          rule={rule}
          query={query}
          onDropdownChange={onRuleTypeDropdownChange}
          onRuleTypeInputChange={onRuleTypeInputChange}
        />
      )
    }
  }

  private get relativeRule(): JSX.Element {
    const {rule, onRuleTypeInputChange, onRuleTypeDropdownChange} = this.props

    if (rule.trigger === AlertRuleType.Relative) {
      return (
        <Relative
          rule={rule}
          onDropdownChange={onRuleTypeDropdownChange}
          onRuleTypeInputChange={onRuleTypeInputChange}
        />
      )
    }
  }

  private get deadmanRule(): JSX.Element {
    const {rule, onDeadmanChange} = this.props

    if (rule.trigger === AlertRuleType.Deadman) {
      return <Deadman rule={rule} onChange={onDeadmanChange} />
    }
  }

  private get ruleGraph(): JSX.Element {
    const {rule, query, source, timeRange, onChooseTimeRange} = this.props

    if (
      rule.trigger === AlertRuleType.Threshold ||
      rule.trigger === AlertRuleType.Relative
    ) {
      return (
        <RuleGraph
          rule={rule}
          query={query}
          source={source}
          timeRange={timeRange}
          onChooseTimeRange={onChooseTimeRange}
        />
      )
    }
  }

  private isDeadman = (rule): boolean => {
    return rule.trigger === AlertRuleType.Deadman
  }
}

export default ValuesSection
