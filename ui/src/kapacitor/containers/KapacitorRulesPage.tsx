import React, {PureComponent} from 'react'

import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import {getActiveKapacitor} from 'src/shared/apis'
import * as kapacitorActionCreators from '../actions/view'

import KapacitorRules from 'src/kapacitor/components/KapacitorRules'
import QuestionMarkTooltip from 'src/shared/components/QuestionMarkTooltip'
import {Page} from 'src/reusable_ui'

import {Source, Kapacitor, AlertRule} from 'src/types'
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  source: Source
  actions: {
    fetchRules: (kapacitor: Kapacitor) => void
    deleteRule: (rule: AlertRule) => void
    updateRuleStatus: (rule: AlertRule, status: string) => void
    updateRuleStatusSuccess: (id: string, status: string) => void
  }
  rules: AlertRule[]
}

interface State {
  hasKapacitor: boolean
  loading: boolean
}

@ErrorHandling
export class KapacitorRulesPage extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      hasKapacitor: false,
      loading: true,
    }
  }

  public async componentDidMount() {
    const {source, actions} = this.props
    const kapacitor: Kapacitor = await getActiveKapacitor(source)
    if (!kapacitor) {
      return
    }

    await actions.fetchRules(kapacitor)
    this.setState({loading: false, hasKapacitor: !!kapacitor})
  }

  public render() {
    const {source, rules} = this.props
    const {hasKapacitor, loading} = this.state
    return (
      <Page>
        <Page.Header>
          <Page.Header.Left>
            <Page.Title title="Manage Tasks" />
          </Page.Header.Left>
          <Page.Header.Right showSourceIndicator={true}>
            <QuestionMarkTooltip
              tipID="manage-tasks--tooltip"
              tipContent="<b>Alert Rules</b> generate a TICKscript for<br/>you using our Builder UI.<br/><br/>Not all TICKscripts can be edited<br/>using the Builder."
            />
          </Page.Header.Right>
        </Page.Header>
        <Page.Contents>
          <KapacitorRules
            source={source}
            rules={rules}
            hasKapacitor={hasKapacitor}
            loading={loading}
            onDelete={this.handleDeleteRule}
            onChangeRuleStatus={this.handleRuleStatus}
          />
        </Page.Contents>
      </Page>
    )
  }

  private handleDeleteRule = (rule: AlertRule) => {
    const {actions} = this.props

    actions.deleteRule(rule)
  }

  private handleRuleStatus = (rule: AlertRule) => {
    const {actions} = this.props
    const status = rule.status === 'enabled' ? 'disabled' : 'enabled'

    actions.updateRuleStatus(rule, status)
    actions.updateRuleStatusSuccess(rule.id, status)
  }
}

const mapStateToProps = state => {
  return {
    rules: Object.values(state.rules),
  }
}

const mapDispatchToProps = dispatch => {
  return {
    actions: bindActionCreators(kapacitorActionCreators, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(KapacitorRulesPage)
