import React, {Component, ChangeEvent} from 'react'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'
import {InjectedRouter} from 'react-router'

import {Page} from 'src/reusable_ui'
import NameSection from 'src/kapacitor/components/NameSection'
import ValuesSection from 'src/kapacitor/components/ValuesSection'
import RuleHandlers from 'src/kapacitor/components/RuleHandlers'
import RuleHeaderSave from 'src/kapacitor/components/alert_rules/RuleHeaderSave'
import RuleMessage from 'src/kapacitor/components/alert_rules/RuleMessage'
import isValidMessage from 'src/kapacitor/utils/alertMessageValidation'

import {createRule, editRule} from 'src/kapacitor/apis'
import buildInfluxQLQuery from 'src/utils/influxql'
import {timeRanges} from 'src/shared/data/timeRanges'
import {DEFAULT_RULE_ID} from 'src/kapacitor/constants'
import {notify as notifyAction} from 'src/shared/actions/notifications'

import {
  notifyAlertRuleCreated,
  notifyAlertRuleCreateFailed,
  notifyAlertRuleUpdated,
  notifyAlertRuleUpdateFailed,
  notifyAlertRuleRequiresQuery,
  notifyAlertRuleRequiresConditionValue,
  notifyAlertRuleDeadmanInvalid,
  notifyTestAlertSent,
  notifyTestAlertFailed,
} from 'src/shared/copy/notifications'
import {ErrorHandling} from 'src/shared/decorators/errors'

import {
  Source,
  AlertRule,
  Notification,
  Kapacitor,
  QueryConfig,
  TimeRange,
} from 'src/types'
import {Handler} from 'src/types/kapacitor'
import {
  KapacitorQueryConfigActions,
  KapacitorRuleActions,
} from 'src/types/actions'
import {testAlertOutput} from 'src/shared/apis'

interface Props {
  source: Source
  rule: AlertRule
  query: QueryConfig
  queryConfigs: QueryConfig[]
  queryConfigActions: KapacitorQueryConfigActions
  ruleActions: KapacitorRuleActions
  notify: (message: Notification) => void
  ruleID: string
  handlersFromConfig: Handler[]
  router: InjectedRouter
  kapacitor: Kapacitor
  configLink: string
}

interface Item {
  text: string
}

interface TypeItem extends Item {
  type: string
}

interface State {
  timeRange: TimeRange
}

@ErrorHandling
class KapacitorRule extends Component<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      timeRange: timeRanges.find(tr => tr.lower === 'now() - 15m'),
    }
  }

  public render() {
    const {
      rule,
      source,
      ruleActions,
      queryConfigs,
      handlersFromConfig,
      queryConfigActions,
    } = this.props
    const {chooseTrigger, updateRuleValues} = ruleActions
    const {timeRange} = this.state

    return (
      <Page>
        <Page.Header>
          <Page.Header.Left>
            <Page.Title title="Alert Rule Builder" />
          </Page.Header.Left>
          <Page.Header.Right showSourceIndicator={true}>
            <RuleHeaderSave
              onSave={this.handleSave}
              validationError={this.validationError}
            />
          </Page.Header.Right>
        </Page.Header>
        <Page.Contents>
          <div className="rule-builder">
            <NameSection
              rule={rule}
              defaultName={rule.name}
              onRuleRename={ruleActions.updateRuleName}
            />
            <ValuesSection
              rule={rule}
              source={source}
              timeRange={timeRange}
              onChooseTrigger={chooseTrigger}
              onAddEvery={this.handleAddEvery}
              onUpdateValues={updateRuleValues}
              query={queryConfigs[rule.queryID]}
              onRemoveEvery={this.handleRemoveEvery}
              queryConfigActions={queryConfigActions}
              onDeadmanChange={this.handleDeadmanChange}
              onRuleTypeInputChange={this.handleRuleTypeInputChange}
              onRuleTypeDropdownChange={this.handleRuleTypeDropdownChange}
              onChooseTimeRange={this.handleChooseTimeRange}
            />
            <RuleHandlers
              rule={rule}
              ruleActions={ruleActions}
              handlersFromConfig={handlersFromConfig}
              onGoToConfig={this.handleSaveToConfig}
              onTestHandler={this.handleTestHandler}
              validationError={this.validationError}
            />
            <RuleMessage rule={rule} ruleActions={ruleActions} />
          </div>
        </Page.Contents>
      </Page>
    )
  }

  private handleChooseTimeRange = ({lower}: TimeRange) => {
    const timeRange = timeRanges.find(range => range.lower === lower)
    this.setState({timeRange})
  }

  private applyRuleWorkarounds(updatedRule: any): void {
    // defect #5768 - naming issue
    if (updatedRule.alertNodes?.teams?.length) {
      const teams = (updatedRule.alertNodes.teams[0] as unknown) as Record<
        string,
        unknown
      >
      if (teams['channel-url']) {
        teams.channel_url = teams['channel-url']
      }
    }
  }

  private handleCreate = (pathname?: string) => {
    const {notify, queryConfigs, rule, kapacitor} = this.props

    const newRule = Object.assign({}, rule, {
      query: queryConfigs[rule.queryID],
    })
    delete newRule.queryID
    this.applyRuleWorkarounds(newRule)

    createRule(kapacitor, newRule)
      .then(() => {
        this.exitPage(pathname)
        notify(notifyAlertRuleCreated(newRule.name))
      })
      .catch(e => {
        notify(notifyAlertRuleCreateFailed(newRule.name, e.data.message))
      })
  }

  private handleEdit = (pathname?: string) => {
    const {notify, queryConfigs, rule} = this.props
    const updatedRule = Object.assign({}, rule, {
      query: queryConfigs[rule.queryID],
    })
    this.applyRuleWorkarounds(updatedRule)
    editRule(updatedRule)
      .then(() => {
        this.exitPage(pathname)
        notify(notifyAlertRuleUpdated(rule.name))
      })
      .catch(e => {
        notify(
          notifyAlertRuleUpdateFailed(rule.name, e?.data?.message || String(e))
        )
      })
  }

  private exitPage(pathname?: string) {
    const {source, router} = this.props
    if (pathname) {
      return router.push(pathname)
    }
    const location = (router as any).location
    if (location?.query?.l === 't') {
      return router.push(
        `/sources/${source.id}/tickscripts${location?.search || ''}`
      )
    }
    router.push(`/sources/${source.id}/alert-rules`)
  }

  private handleSave = () => {
    const {rule} = this.props
    if (rule.id === DEFAULT_RULE_ID) {
      this.handleCreate()
    } else {
      this.handleEdit()
    }
  }

  private handleSaveToConfig = (configName: string) => () => {
    const {rule, configLink, router} = this.props
    const pathname = `${configLink}#${configName}`

    if (this.validationError) {
      router.push({
        pathname,
      })
      return
    }

    if (rule.id === DEFAULT_RULE_ID) {
      this.handleCreate(pathname)
    } else {
      this.handleEdit(pathname)
    }
  }
  private handleTestHandler = (configName: string) => async (
    handler: Record<string, unknown>,
    toTestProperty: Record<string, string> = {}
  ) => {
    const testData = Object.keys(handler).reduce<Record<string, unknown>>(
      (acc, key) => {
        // ignore: 'type' is created by UI, 'enabled' is not used by testing
        if (key === 'enabled' || key === 'type') {
          return acc
        }
        if (key === '_type') {
          acc.type = handler._type
          return acc
        }
        if (toTestProperty[key]) {
          acc[toTestProperty[key]] = handler[key]
          return acc
        }
        // common property
        acc[key] = handler[key]
        // there are naming problems in kapacitor, - and _ are used inconsistently in tickscript and testing options
        acc[key.replace('-', '_')] = acc[key]
        acc[key.replace('_', '-')] = acc[key]
        return acc
      },
      {}
    )
    try {
      const {data} = await testAlertOutput(
        this.props.kapacitor,
        configName,
        testData,
        testData
      )
      if (data.success) {
        this.props.notify(notifyTestAlertSent(configName))
      } else {
        this.props.notify(notifyTestAlertFailed(configName, data.message))
      }
    } catch (error) {
      this.props.notify(notifyTestAlertFailed(configName))
    }
  }

  private handleAddEvery = (frequency: string) => {
    const {
      rule: {id: ruleID},
      ruleActions: {addEvery},
    } = this.props
    addEvery(ruleID, frequency)
  }

  private handleRemoveEvery = () => {
    const {
      rule: {id: ruleID},
      ruleActions: {removeEvery},
    } = this.props
    removeEvery(ruleID)
  }

  private get validationError(): string {
    const {rule, query} = this.props
    if (rule.trigger === 'deadman') {
      return this.deadmanValidation()
    }

    if (!buildInfluxQLQuery({lower: ''}, query)) {
      return notifyAlertRuleRequiresQuery()
    }

    if (!rule.values.value) {
      return notifyAlertRuleRequiresConditionValue()
    }

    if (rule.message && !isValidMessage(rule.message)) {
      return 'Please correct template values in the alert message.'
    }

    return ''
  }

  private deadmanValidation = () => {
    const {query} = this.props
    if (query && (!query.database || !query.measurement)) {
      return notifyAlertRuleDeadmanInvalid()
    }

    return ''
  }

  private handleRuleTypeDropdownChange = ({type, text}: TypeItem) => {
    const {ruleActions, rule} = this.props
    ruleActions.updateRuleValues(rule.id, rule.trigger, {
      ...this.props.rule.values,
      [type]: text,
    })
  }

  private handleRuleTypeInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const {ruleActions, rule} = this.props
    const {lower, upper} = e.target.form

    ruleActions.updateRuleValues(rule.id, rule.trigger, {
      ...this.props.rule.values,
      value: lower.value,
      rangeValue: upper ? upper.value : '',
    })
  }

  private handleDeadmanChange = ({text}: Item) => {
    const {ruleActions, rule} = this.props
    ruleActions.updateRuleValues(rule.id, rule.trigger, {period: text})
  }
}

const mapDispatchToProps = dispatch => ({
  notify: bindActionCreators(notifyAction, dispatch),
})

export default connect(null, mapDispatchToProps)(KapacitorRule)
