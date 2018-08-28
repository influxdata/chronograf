// Libraries
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'
import {withRouter, InjectedRouter} from 'react-router'
import {Location} from 'history'
import qs from 'qs'
import uuid from 'uuid'
import _ from 'lodash'

// Utils
import {stripPrefix} from 'src/utils/basepath'
import {GlobalAutoRefresher} from 'src/utils/AutoRefresher'
import {getConfig} from 'src/dashboards/utils/cellGetters'

// Components
import WriteDataForm from 'src/data_explorer/components/WriteDataForm'
import OverlayTechnology from 'src/reusable_ui/components/overlays/OverlayTechnology'
import ManualRefresh from 'src/shared/components/ManualRefresh'
import SendToDashboardOverlay from 'src/data_explorer/components/SendToDashboardOverlay'
import Authorized, {EDITOR_ROLE} from 'src/auth/Authorized'
import TimeMachine from 'src/shared/components/TimeMachine/TimeMachine'
import DEHeader from 'src/data_explorer/components/DEHeader'

// Actions
import {errorThrown} from 'src/shared/actions/errors'
import {setAutoRefresh} from 'src/shared/actions/app'
import {getDashboardsAsync, addDashboardCellAsync} from 'src/dashboards/actions'
import {writeLineProtocolAsync} from 'src/data_explorer/actions/view/write'
import {
  loadDE as loadDEAction,
  queryConfigActions as queryConfigModifiers,
  updateQueryDrafts as updateQueryDraftsAction,
  addQueryAsync,
  deleteQueryAsync,
  updateEditorTimeRange,
} from 'src/data_explorer/actions/queries'

// Constants
import {
  TEMPLATES,
  TEMP_VAR_DASHBOARD_TIME,
  TEMP_VAR_UPPER_DASHBOARD_TIME,
} from 'src/shared/constants'
import {buildRawText} from 'src/utils/influxql'

// Types
import {
  Source,
  Service,
  TimeRange,
  Dashboard,
  CellQuery,
  QueryConfig,
  Template,
  TemplateType,
  TemplateValueType,
} from 'src/types'
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  source: Source
  sources: Source[]
  services: Service[]
  queryConfigs: QueryConfig[]
  queryConfigActions: any
  autoRefresh: number
  handleChooseAutoRefresh: () => void
  router?: InjectedRouter
  location?: Location
  setTimeRange: (range: TimeRange) => void
  timeRange: TimeRange
  manualRefresh: number
  dashboards: Dashboard[]
  onManualRefresh: () => void
  errorThrownAction: () => void
  writeLineProtocol: () => void
  handleGetDashboards: () => Dashboard[]
  addDashboardCell: typeof addDashboardCellAsync
  updateQueryDrafts: typeof updateQueryDraftsAction
  loadDE: typeof loadDEAction
  addQuery: typeof addQueryAsync
  deleteQuery: typeof deleteQueryAsync
  queryDrafts: CellQuery[]
}

interface State {
  isWriteFormVisible: boolean
  isSendToDashboardVisible: boolean
  isStaticLegend: boolean
}

@ErrorHandling
export class DataExplorer extends PureComponent<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      isWriteFormVisible: false,
      isSendToDashboardVisible: false,
      isStaticLegend: false,
    }
  }

  public async componentDidMount() {
    const {
      source,
      loadDE,
      timeRange,
      dashboards,
      autoRefresh,
      queryDrafts,
      handleGetDashboards,
    } = this.props
    const {query} = qs.parse(location.search, {ignoreQueryPrefix: true})

    GlobalAutoRefresher.poll(autoRefresh)

    if (query && query.length) {
      if (!_.isEmpty(queryDrafts)) {
        const matchingQueryDraft = queryDrafts.find(q => q.query === query)
        if (matchingQueryDraft) {
          loadDE(queryDrafts, timeRange)
        } else {
          const queryConfig = await getConfig(
            source.links.queries,
            uuid.v4(),
            query,
            this.templates
          )
          const queryDraft = {query, queryConfig, source: source.links.self}
          loadDE([queryDraft], timeRange)
        }
      } else {
        const queryConfig = await getConfig(
          source.links.queries,
          uuid.v4(),
          query,
          this.templates
        )
        const queryDraft = {query, queryConfig, source: source.links.self}
        loadDE([queryDraft], timeRange)
      }
    } else {
      if (!_.isEmpty(queryDrafts)) {
        loadDE(queryDrafts, timeRange)
      } else {
        loadDE([], timeRange)
      }
    }

    if (!dashboards.length) {
      await handleGetDashboards()
    }
  }

  public componentDidUpdate(prevProps: Props) {
    const {autoRefresh} = this.props
    if (autoRefresh !== prevProps.autoRefresh) {
      GlobalAutoRefresher.poll(autoRefresh)
    }
  }

  public componentWillReceiveProps(nextProps: Props) {
    const {router} = this.props
    const {queryDrafts} = nextProps

    const query = _.get(queryDrafts, '0.query', '')
    const qsCurrent = qs.parse(location.search, {ignoreQueryPrefix: true})
    if (query && query.length && qsCurrent.query !== query) {
      const qsNew = qs.stringify({query})
      const pathname = stripPrefix(location.pathname)
      router.push(`${pathname}?${qsNew}`)
    }
  }

  public componentWillUnmount() {
    GlobalAutoRefresher.stopPolling()
  }

  public render() {
    const {
      source,
      sources,
      services,
      timeRange,
      autoRefresh,
      manualRefresh,
      onManualRefresh,
      queryConfigActions,
      handleChooseAutoRefresh,
      updateQueryDrafts,
      queryDrafts,
      addQuery,
      deleteQuery,
    } = this.props
    const {isStaticLegend} = this.state

    return (
      <>
        {this.writeDataForm}
        {this.sendToDashboardOverlay}
        <div className="deceo--page">
          <TimeMachine
            queryDrafts={queryDrafts}
            editQueryStatus={queryConfigActions.editQueryStatus}
            templates={this.templates}
            timeRange={timeRange}
            autoRefresh={autoRefresh}
            source={source}
            onResetFocus={this.handleResetFocus}
            isInCEO={true}
            sources={sources}
            services={services}
            updateQueryDrafts={updateQueryDrafts}
            onToggleStaticLegend={this.handleToggleStaticLegend}
            isStaticLegend={isStaticLegend}
            queryConfigActions={this.props.queryConfigActions}
            addQuery={addQuery}
            deleteQuery={deleteQuery}
            updateEditorTimeRange={this.handleChooseTimeRange}
            manualRefresh={manualRefresh}
          >
            {(activeEditorTab, onSetActiveEditorTab) => (
              <DEHeader
                timeRange={timeRange}
                autoRefresh={autoRefresh}
                activeEditorTab={activeEditorTab}
                onManualRefresh={onManualRefresh}
                onOpenWriteData={this.handleOpenWriteData}
                toggleSendToDashboard={this.toggleSendToDashboard}
                onChooseAutoRefresh={handleChooseAutoRefresh}
                onSetActiveEditorTab={onSetActiveEditorTab}
              />
            )}
          </TimeMachine>
        </div>
      </>
    )
  }

  private get writeDataForm(): JSX.Element {
    const {source, errorThrownAction, writeLineProtocol} = this.props

    const {isWriteFormVisible} = this.state
    return (
      <OverlayTechnology visible={isWriteFormVisible}>
        <WriteDataForm
          source={source}
          errorThrown={errorThrownAction}
          selectedDatabase={this.selectedDatabase}
          onClose={this.handleCloseWriteData}
          writeLineProtocol={writeLineProtocol}
        />
      </OverlayTechnology>
    )
  }

  private get sendToDashboardOverlay(): JSX.Element {
    const {source, dashboards, addDashboardCell} = this.props

    const {isSendToDashboardVisible} = this.state
    return (
      <Authorized requiredRole={EDITOR_ROLE}>
        <OverlayTechnology visible={isSendToDashboardVisible}>
          <SendToDashboardOverlay
            onCancel={this.toggleSendToDashboard}
            queryConfig={this.activeQueryConfig}
            source={source}
            rawText={this.rawText}
            dashboards={dashboards}
            addDashboardCell={addDashboardCell}
          />
        </OverlayTechnology>
      </Authorized>
    )
  }

  private get templates(): Template[] {
    const {timeRange} = this.props

    const low = timeRange.lower
    const up = timeRange.upper
    const lowerTemplateType =
      low && low.includes(':') ? TemplateType.TimeStamp : TemplateType.Constant
    const upperTemplateType =
      up && up.includes(':') ? TemplateType.TimeStamp : TemplateType.Constant
    const lowerTemplateValueType =
      low && low.includes(':')
        ? TemplateValueType.TimeStamp
        : TemplateValueType.Constant
    const upperTemplateValueType =
      up && up.includes(':')
        ? TemplateValueType.TimeStamp
        : TemplateValueType.Constant

    const dashboardTime: Template = {
      id: 'dashtime',
      tempVar: TEMP_VAR_DASHBOARD_TIME,
      type: lowerTemplateType,
      label: 'minimum bound on dashboard time',
      values: [
        {
          value: low,
          type: lowerTemplateValueType,
          selected: true,
          localSelected: true,
        },
      ],
    }

    const upperDashboardTime: Template = {
      id: 'upperdashtime',
      tempVar: TEMP_VAR_UPPER_DASHBOARD_TIME,
      type: upperTemplateType,
      label: 'upper bound on dashboard time',
      values: [
        {
          value: up || 'now()',
          type: upperTemplateValueType,
          selected: true,
          localSelected: true,
        },
      ],
    }

    return [...TEMPLATES, dashboardTime, upperDashboardTime]
  }

  private handleCloseWriteData = (): void => {
    this.setState({isWriteFormVisible: false})
  }

  private handleOpenWriteData = (): void => {
    this.setState({isWriteFormVisible: true})
  }

  private handleChooseTimeRange = (timeRange: TimeRange): void => {
    this.props.setTimeRange(timeRange)
  }

  private get selectedDatabase(): string {
    return _.get(this.props.queryConfigs, ['0', 'database'], null)
  }

  private get activeQueryConfig(): QueryConfig {
    const {queryDrafts} = this.props
    return _.get(queryDrafts, 'queryConfig.0')
  }

  get rawText(): string {
    const {timeRange} = this.props
    if (this.activeQueryConfig) {
      return buildRawText(this.activeQueryConfig, timeRange)
    }
    return ''
  }

  private toggleSendToDashboard = () => {
    this.setState({
      isSendToDashboardVisible: !this.state.isSendToDashboardVisible,
    })
  }

  private handleToggleStaticLegend = (isStaticLegend: boolean): void => {
    this.setState({isStaticLegend})
  }

  private handleResetFocus = () => {
    return
  }
}

const mapStateToProps = state => {
  const {
    app: {
      persisted: {autoRefresh},
    },
    dataExplorer: {queryDrafts, timeRange},
    dashboardUI: {dashboards},
    sources,
    services,
  } = state

  return {
    autoRefresh,
    queryDrafts,
    timeRange,
    dashboards,
    sources,
    services,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    handleChooseAutoRefresh: bindActionCreators(setAutoRefresh, dispatch),
    errorThrownAction: bindActionCreators(errorThrown, dispatch),
    setTimeRange: bindActionCreators(updateEditorTimeRange, dispatch),
    writeLineProtocol: bindActionCreators(writeLineProtocolAsync, dispatch),
    queryConfigActions: bindActionCreators(queryConfigModifiers, dispatch),
    handleGetDashboards: bindActionCreators(getDashboardsAsync, dispatch),
    addDashboardCell: bindActionCreators(addDashboardCellAsync, dispatch),
    loadDE: bindActionCreators(loadDEAction, dispatch),
    updateQueryDrafts: bindActionCreators(updateQueryDraftsAction, dispatch),
    addQuery: bindActionCreators(addQueryAsync, dispatch),
    deleteQuery: bindActionCreators(deleteQueryAsync, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(
  withRouter(ManualRefresh(DataExplorer))
)
