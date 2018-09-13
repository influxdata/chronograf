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
import {buildRawText} from 'src/utils/influxql'

// Constants
import {timeRanges} from 'src/shared/data/timeRanges'

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
  updateSourceLink as updateSourceLinkAction,
} from 'src/data_explorer/actions/queries'
import {
  queryConfigActions as queryConfigModifiers,
  updateQueryDrafts as updateQueryDraftsAction,
  updateQueryStatus as editQueryStatusAction,
  updateScript as updateScriptAction,
  addQueryAsync,
  deleteQueryAsync,
  updateEditorTimeRange,
  QueryUpdateState,
} from 'src/shared/actions/queries'
import {fetchAllFluxServicesAsync} from 'src/shared/actions/services'
import {notify as notifyAction} from 'src/shared/actions/notifications'

// Constants
import {
  TEMPLATES,
  TEMP_VAR_DASHBOARD_TIME,
  TEMP_VAR_UPPER_DASHBOARD_TIME,
} from 'src/shared/constants'

// Types
import {
  Source,
  Service,
  TimeRange,
  Dashboard,
  CellQuery,
  QueryConfig,
  QueryStatus,
  Template,
  TemplateType,
  TemplateValueType,
  CellType,
  Axes,
} from 'src/types'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {Links} from 'src/types/flux'
import {ColorNumber, ColorString} from 'src/types/colors'
import {
  DecimalPlaces,
  FieldOption,
  ThresholdType,
  TableOptions,
  NoteVisibility,
} from 'src/types/dashboards'
import {VisualizationOptions} from 'src/types/dataExplorer'

interface Props {
  source: Source
  sources: Source[]
  services: Service[]
  queryConfigs: QueryConfig[]
  updateSourceLink: typeof updateSourceLinkAction
  queryConfigActions: typeof queryConfigModifiers
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
  editQueryStatus: typeof editQueryStatusAction
  queryStatus: QueryStatus
  fluxLinks: Links
  script: string
  updateScript: typeof updateScriptAction
  fetchServicesAsync: typeof fetchAllFluxServicesAsync
  notify: typeof notifyAction
  sourceLink: string
  thresholdsListType: ThresholdType
  thresholdsListColors: ColorNumber[]
  gaugeColors: ColorNumber[]
  lineColors: ColorString[]
  visType: CellType
  axes: Axes
  tableOptions: TableOptions
  timeFormat: string
  decimalPlaces: DecimalPlaces
  fieldOptions: FieldOption[]
  note: string
  noteVisibility: NoteVisibility
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
      loadDE,
      timeRange,
      autoRefresh,
      queryDrafts,
      handleGetDashboards,
    } = this.props
    const {query, script} = this.queryString

    GlobalAutoRefresher.poll(autoRefresh)

    if (script) {
      loadDE([], timeRange)
    } else if (_.isEmpty(query)) {
      let drafts = []
      if (!_.isEmpty(queryDrafts)) {
        drafts = queryDrafts
      }
      loadDE(drafts, timeRange)
    } else if (!_.isEmpty(queryDrafts)) {
      const matchingQueryDraft = queryDrafts.find(q => q.query === query)

      if (matchingQueryDraft) {
        loadDE(queryDrafts, timeRange)
      } else {
        await this.createNewQueryDraft()
      }
    } else {
      await this.createNewQueryDraft()
    }

    await handleGetDashboards()

    this.fetchFluxServices()
  }

  public componentDidUpdate(prevProps: Props) {
    const {autoRefresh} = this.props
    if (autoRefresh !== prevProps.autoRefresh) {
      GlobalAutoRefresher.poll(autoRefresh)
    }

    this.updateQueryStringQuery()
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
      manualRefresh,
      onManualRefresh,
      editQueryStatus,
      updateQueryDrafts,
      queryDrafts,
      addQuery,
      deleteQuery,
      queryStatus,
      fluxLinks,
      notify,
      updateSourceLink,
    } = this.props
    const {isStaticLegend} = this.state

    return (
      <>
        {this.writeDataForm}
        {this.sendToDashboardOverlay}
        <div className="deceo--page">
          <TimeMachine
            service={this.service}
            updateSourceLink={updateSourceLink}
            queryDrafts={queryDrafts}
            editQueryStatus={editQueryStatus}
            templates={this.templates}
            timeRange={timeRange}
            source={source}
            onResetFocus={this.handleResetFocus}
            isInCEO={false}
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
            queryStatus={queryStatus}
            script={this.activeScript}
            updateScript={this.handleUpdateScript}
            fluxLinks={fluxLinks}
            notify={notify}
            visualizationOptions={this.visualizationOptions}
          >
            {(activeEditorTab, onSetActiveEditorTab) => (
              <DEHeader
                timeRange={timeRange}
                activeEditorTab={activeEditorTab}
                onManualRefresh={onManualRefresh}
                onOpenWriteData={this.handleOpenWriteData}
                toggleSendToDashboard={this.toggleSendToDashboard}
                onSetActiveEditorTab={onSetActiveEditorTab}
              />
            )}
          </TimeMachine>
        </div>
      </>
    )
  }

  private get shouldUpdateQueryString(): boolean {
    const {queryDrafts} = this.props
    const query = _.get(queryDrafts, '0.query', '')
    const {query: existing} = this.queryString
    const isFlux = !!this.service

    return !_.isEmpty(query) && query !== existing && !isFlux
  }

  private handleUpdateScript = (
    script: string,
    stateToUpdate: QueryUpdateState
  ) => {
    const {router} = this.props
    const pathname = stripPrefix(location.pathname)
    const qsNew = qs.stringify({script})

    router.push(`${pathname}?${qsNew}`)
    this.props.updateScript(script, stateToUpdate)
  }

  private updateQueryStringQuery() {
    if (!this.shouldUpdateQueryString) {
      return
    }

    const {queryDrafts, router} = this.props
    const query = _.get(queryDrafts, '0.query', '')
    const qsNew = qs.stringify({query})
    const pathname = stripPrefix(location.pathname)

    router.push(`${pathname}?${qsNew}`)
  }

  private get queryString(): {query?: string; script?: string} {
    return qs.parse(location.search, {ignoreQueryPrefix: true})
  }

  private get service(): Service {
    const {services, sourceLink} = this.props
    let service: Service = null

    if (sourceLink.includes('services')) {
      service = services.find(s => {
        return s.links.self === sourceLink
      })
    }

    return service
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
    const {source, dashboards, addDashboardCell, script} = this.props

    const {isSendToDashboardVisible, isStaticLegend} = this.state
    return (
      <Authorized requiredRole={EDITOR_ROLE}>
        <OverlayTechnology visible={isSendToDashboardVisible}>
          <SendToDashboardOverlay
            onCancel={this.toggleSendToDashboard}
            queryConfig={this.activeQueryConfig}
            script={script}
            source={source}
            service={this.service}
            rawText={this.rawText}
            dashboards={dashboards}
            addDashboardCell={addDashboardCell}
            visualizationOptions={this.visualizationOptions}
            isStaticLegend={isStaticLegend}
          />
        </OverlayTechnology>
      </Authorized>
    )
  }

  private get templates(): Template[] {
    const {lower, upper} = timeRanges.find(tr => tr.lower === 'now() - 1h')

    const timeRange = this.props.timeRange || {lower, upper}

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

  private async fetchFluxServices() {
    const {fetchServicesAsync, sources} = this.props
    if (!sources.length) {
      return
    }

    await fetchServicesAsync(sources)
  }

  private get selectedDatabase(): string {
    return _.get(this.props.queryConfigs, ['0', 'database'], null)
  }

  private get activeQueryConfig(): QueryConfig {
    const {queryDrafts} = this.props
    return _.get(queryDrafts, '0.queryConfig')
  }

  private get rawText(): string {
    const {timeRange} = this.props
    if (this.activeQueryConfig) {
      return buildRawText(this.activeQueryConfig, timeRange)
    }
    return ''
  }

  private get visualizationOptions(): VisualizationOptions {
    const {
      visType,
      tableOptions,
      fieldOptions,
      timeFormat,
      decimalPlaces,
      note,
      noteVisibility,
      axes,
      thresholdsListColors,
      thresholdsListType,
      gaugeColors,
      lineColors,
    } = this.props

    return {
      type: visType,
      axes,
      tableOptions,
      fieldOptions,
      timeFormat,
      decimalPlaces,
      note,
      noteVisibility,
      thresholdsListColors,
      gaugeColors,
      lineColors,
      thresholdsListType,
    }
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

  private async createNewQueryDraft() {
    const {source, loadDE, timeRange} = this.props

    const {query} = this.queryString
    const queryConfig = await getConfig(
      source.links.queries,
      uuid.v4(),
      query,
      this.templates
    )
    const queryDraft = {query, queryConfig, source: source.links.self}
    loadDE([queryDraft], timeRange)
  }

  private get activeScript(): string {
    const {script} = this.queryString
    if (script) {
      return script
    }

    return this.props.script
  }
}

const mstp = state => {
  const {
    app: {
      persisted: {autoRefresh},
    },
    dataExplorer: {
      queryDrafts,
      timeRange,
      queryStatus,
      script,
      sourceLink,
      visType,
      thresholdsListType,
      thresholdsListColors,
      gaugeColors,
      lineColors,
      axes,
      tableOptions,
      timeFormat,
      decimalPlaces,
      fieldOptions,
      note,
      noteVisibility,
    },
    dashboardUI: {dashboards},
    sources,
    services,
    links,
  } = state

  return {
    fluxLinks: links.flux,
    autoRefresh,
    queryDrafts,
    timeRange,
    dashboards,
    sources,
    services,
    queryStatus,
    script,
    sourceLink,
    visType,
    thresholdsListType,
    thresholdsListColors,
    gaugeColors,
    lineColors,
    axes,
    tableOptions,
    timeFormat,
    decimalPlaces,
    fieldOptions,
    note,
    noteVisibility,
  }
}

const mdtp = dispatch => {
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
    editQueryStatus: bindActionCreators(editQueryStatusAction, dispatch),
    updateScript: bindActionCreators(updateScriptAction, dispatch),
    fetchServicesAsync: bindActionCreators(fetchAllFluxServicesAsync, dispatch),
    notify: bindActionCreators(notifyAction, dispatch),
    updateSourceLink: bindActionCreators(updateSourceLinkAction, dispatch),
  }
}

export default connect(mstp, mdtp)(withRouter(ManualRefresh(DataExplorer)))
