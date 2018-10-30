// Libraries
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

// APIs
import {getActiveKapacitor} from 'src/shared/apis'

// Actions
import * as kapacitorActionCreators from '../actions/view'

// Components
import KapacitorRules from 'src/kapacitor/components/KapacitorRules'
import QuestionMarkTooltip from 'src/shared/components/QuestionMarkTooltip'
import {Page, Spinner} from 'src/reusable_ui'

// Types
import {Source, Kapacitor, AlertRule, RemoteDataState} from 'src/types'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'
import NoKapacitorError from 'src/shared/components/NoKapacitorError'

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
  kapacitor: Kapacitor
  loading: RemoteDataState
}

@ErrorHandling
export class KapacitorRulesPage extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      kapacitor: null,
      loading: RemoteDataState.NotStarted,
    }
  }

  public async componentDidMount() {
    const {source, actions} = this.props
    this.setState({loading: RemoteDataState.Loading})
    const kapacitor: Kapacitor = await getActiveKapacitor(source)

    if (!kapacitor) {
      return this.setState({loading: RemoteDataState.Done, kapacitor: null})
    }

    await actions.fetchRules(kapacitor)
    this.setState({loading: RemoteDataState.Done, kapacitor})
  }

  public render() {
    return (
      <Page className={this.className}>
        <Page.Header>
          <Page.Header.Left>
            <Page.Title title={this.headerTitle} />
          </Page.Header.Left>
          <Page.Header.Right showSourceIndicator={true}>
            <QuestionMarkTooltip
              tipID="manage-tasks--tooltip"
              tipContent="<b>Alert Rules</b> generate a TICKscript for<br/>you using our Builder UI.<br/><br/>Not all TICKscripts can be edited<br/>using the Builder."
            />
          </Page.Header.Right>
        </Page.Header>
        <Page.Contents>
          <Spinner loading={this.state.loading}>{this.rules}</Spinner>
        </Page.Contents>
      </Page>
    )
  }

  private get rules(): JSX.Element {
    const {kapacitor} = this.state
    const {source, rules} = this.props

    if (!kapacitor) {
      return <NoKapacitorError source={source} />
    }

    return (
      <KapacitorRules
        rules={rules}
        source={source}
        onDelete={this.handleDeleteRule}
        onChangeRuleStatus={this.handleRuleStatus}
      />
    )
  }

  private get headerTitle(): string {
    const {kapacitor} = this.state

    if (!kapacitor) {
      return 'Manage Tasks'
    }

    return `Manage Tasks on "${kapacitor.name}" @ ${kapacitor.url}`
  }

  private get className(): string {
    const {kapacitor} = this.state

    if (!kapacitor) {
      return 'empty-tasks-page'
    }

    return ''
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
