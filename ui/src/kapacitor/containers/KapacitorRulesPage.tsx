// Libraries
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'

// APIs
import {pingKapacitor} from 'src/shared/apis'

// Utils
import ActiveKapacitorFromSources from 'src/kapacitor/utils/ActiveKapacitorFromSources'
import {notifyKapacitorConnectionFailed} from 'src/shared/copy/notifications'

// Actions
import * as kapacitorActions from 'src/kapacitor/actions/view'
import * as sourcesActions from 'src/shared/actions/sources'
import {notify as notifyAction} from 'src/shared/actions/notifications'

// Components
import KapacitorRules from 'src/kapacitor/components/KapacitorRules'
import QuestionMarkTooltip from 'src/shared/components/QuestionMarkTooltip'
import {Page, Spinner} from 'src/reusable_ui'
import Dropdown from 'src/reusable_ui/components/dropdowns/Dropdown'

// Types
import {
  Source,
  Kapacitor,
  AlertRule,
  RemoteDataState,
  Notification,
  NotificationFunc,
} from 'src/types'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'
import NoKapacitorError from 'src/shared/components/NoKapacitorError'
import {getDeep} from 'src/utils/wrappers'

interface Props {
  source: Source
  sources: Source[]
  fetchRules: (kapacitor: Kapacitor) => void
  deleteRule: (rule: AlertRule) => void
  notify: (message: Notification | NotificationFunc) => void
  updateRuleStatus: (rule: AlertRule, status: string) => void
  updateRuleStatusSuccess: (id: string, status: string) => void
  fetchKapacitors: sourcesActions.FetchKapacitorsAsync
  setActiveKapacitor: sourcesActions.SetActiveKapacitorAsync
  rules: AlertRule[]
}

interface State {
  loading: RemoteDataState
}

@ErrorHandling
export class KapacitorRulesPage extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      loading: RemoteDataState.NotStarted,
    }
  }

  public async componentDidMount() {
    const {source, fetchKapacitors} = this.props
    this.setState({loading: RemoteDataState.Loading})

    await fetchKapacitors(source)

    const kapacitor = this.kapacitor
    if (kapacitor) {
      await this.pingAndFetchRules(kapacitor)
    }

    this.setState({loading: RemoteDataState.Done})
  }

  public render() {
    return (
      <Page className={this.className}>
        <Page.Header>
          <Page.Header.Left>
            <Page.Title title={this.headerTitle} />
            {this.kapacitorsDropdown}
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
    const kapacitor = this.kapacitor
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

  private get kapacitorsDropdown(): JSX.Element {
    const kapacitor = this.kapacitor
    const kapacitors = this.kapacitors

    if (!kapacitor) {
      return null
    }

    const dropDownItems = kapacitors.map(k => (
      <Dropdown.Item key={k.id} id={k.id} value={k.id}>
        {`${k.name} @ ${k.url}`}
      </Dropdown.Item>
    ))

    return (
      <Dropdown
        customClass="kapacitor-switcher"
        onChange={this.handleSetActiveKapacitor}
        widthPixels={330}
        selectedID={kapacitor.id}
      >
        {dropDownItems}
      </Dropdown>
    )
  }

  private get kapacitors(): Kapacitor[] {
    const {sources, source} = this.props
    const activeSource = sources.find(s => s.id === source.id)
    return getDeep<Kapacitor[]>(activeSource, 'kapacitors', [])
  }

  private get kapacitor(): Kapacitor {
    const {sources, source} = this.props
    return ActiveKapacitorFromSources(source, sources)
  }

  private handleSetActiveKapacitor = async (
    kapacitorID: string
  ): Promise<void> => {
    const {setActiveKapacitor} = this.props
    const kapacitors = this.kapacitors
    const toKapacitor = kapacitors.find(k => k.id === kapacitorID)
    await setActiveKapacitor(toKapacitor)
    await this.pingAndFetchRules(toKapacitor)
  }

  private pingAndFetchRules = async (kapacitor: Kapacitor): Promise<void> => {
    try {
      await this.props.fetchRules(kapacitor)
      await pingKapacitor(kapacitor)
    } catch (error) {
      console.error(error)
      this.props.notify(notifyKapacitorConnectionFailed())
    }
  }

  private get headerTitle(): string {
    const kapacitor = this.kapacitor

    if (!kapacitor) {
      return 'Manage Tasks'
    }

    return `Manage Tasks on`
  }

  private get className(): string {
    const kapacitor = this.kapacitor

    if (!kapacitor) {
      return 'empty-tasks-page'
    }

    return ''
  }

  private handleDeleteRule = (rule: AlertRule) => {
    const {deleteRule} = this.props
    deleteRule(rule)
  }

  private handleRuleStatus = (rule: AlertRule) => {
    const {updateRuleStatus, updateRuleStatusSuccess} = this.props
    const status = rule.status === 'enabled' ? 'disabled' : 'enabled'

    updateRuleStatus(rule, status)
    updateRuleStatusSuccess(rule.id, status)
  }
}

const mstp = ({rules, sources}) => ({
  rules: Object.values(rules),
  sources,
})

const mdtp = {
  fetchRules: kapacitorActions.fetchRules,
  deleteRule: kapacitorActions.deleteRule,
  updateRuleStatus: kapacitorActions.updateRuleStatus,
  updateRuleStatusSuccess: kapacitorActions.updateRuleStatusSuccess,
  fetchKapacitors: sourcesActions.fetchKapacitorsAsync,
  setActiveKapacitor: sourcesActions.setActiveKapacitorAsync,
  notify: notifyAction,
}

export default connect(mstp, mdtp)(KapacitorRulesPage)
