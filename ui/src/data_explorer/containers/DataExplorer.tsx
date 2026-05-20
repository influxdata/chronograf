// Libraries
import React, {PureComponent} from 'react'
import {connect, ResolveThunks} from 'react-redux'

// Utils
import {GlobalAutoRefresher} from 'src/utils/AutoRefresher'
import {
  TimeMachineContainer,
  TimeMachineContextConsumer,
} from 'src/shared/utils/TimeMachineContext'

// Components
import WriteDataForm from 'src/data_explorer/components/WriteDataForm'
import OverlayTechnology from 'src/reusable_ui/components/overlays/OverlayTechnology'
import SendToDashboardOverlay from 'src/data_explorer/components/SendToDashboardOverlay'
import Authorized, {EDITOR_ROLE} from 'src/auth/Authorized'
import TimeMachine from 'src/shared/components/TimeMachine/TimeMachine'
import DEHeader from 'src/data_explorer/components/DEHeader'
import PageSpinner from 'src/shared/components/PageSpinner'

// Actions
import {errorThrown} from 'src/shared/actions/errors'
import {setAutoRefresh} from 'src/shared/actions/app'
import {
  getDashboardsAsync,
  sendDashboardCellAsync,
} from 'src/dashboards/actions'
import {writeLineProtocolAsync} from 'src/data_explorer/actions/view/write'
import {updateSourceLink as updateSourceLinkAction} from 'src/data_explorer/actions/queries'
import {
  editQueryStatus as editQueryStatusAction,
  resetQueryStatuses as resetQueryStatusesAction,
} from 'src/data_explorer/actions/queries'
import {setTimeZone as setTimeZoneAction} from 'src/shared/actions/app'

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
  Dashboard,
  QueryStatuses,
  Template,
  TemplateType,
  TemplateValueType,
  QueryType,
  CellQuery,
  TimeRange,
  TimeZones,
} from 'src/types'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {Links} from 'src/types/flux'

interface PassedProps {
  source: Source
}

interface ConnectedProps {
  queryType: QueryType
  queryDrafts: CellQuery[]
  draftScript: string
  script: string
  onUpdateQueryDrafts: (queryDrafts: CellQuery[]) => void
  onResetTimeMachine: TimeMachineContainer['reset']
  onInitFluxScript: TimeMachineContainer['handleInitFluxScript']
}

interface ReduxStateProps {
  timeZone: TimeZones
  fluxLinks: Links
  autoRefresh: number
  timeRange: TimeRange
  dashboards: Dashboard[]
  sources: Source[]
  sourceLink: string
  queryStatuses: QueryStatuses
}

type ReduxDispatchProps = ResolveThunks<{
  handleChooseAutoRefresh: typeof setAutoRefresh
  errorThrownAction: typeof errorThrown
  writeLineProtocol: typeof writeLineProtocolAsync
  handleGetDashboards: typeof getDashboardsAsync
  sendDashboardCell: typeof sendDashboardCellAsync
  editQueryStatus: typeof editQueryStatusAction
  resetQueryStatuses: typeof resetQueryStatusesAction
  notify: typeof notifyAction
  updateSourceLink: typeof updateSourceLinkAction
  onSetTimeZone: typeof setTimeZoneAction
}>

type Props = PassedProps & ConnectedProps & ReduxStateProps & ReduxDispatchProps

interface State {
  isWriteFormVisible: boolean
  isSendToDashboardVisible: boolean
  isStaticLegend: boolean
  isComponentMounted: boolean
  activeQueryIndex: number
}

class DataExplorer extends PureComponent<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      isWriteFormVisible: false,
      isSendToDashboardVisible: false,
      isStaticLegend: false,
      isComponentMounted: false,
      activeQueryIndex: 0,
    }
    props.resetQueryStatuses()

    props.onResetTimeMachine()
  }

  public async componentDidMount() {
    const {autoRefresh} = this.props

    GlobalAutoRefresher.poll(autoRefresh)

    this.setState({isComponentMounted: true})
  }

  public componentDidUpdate(prevProps: Props) {
    const {autoRefresh} = this.props

    if (autoRefresh !== prevProps.autoRefresh) {
      GlobalAutoRefresher.poll(autoRefresh)
    }
  }

  public componentWillUnmount() {
    GlobalAutoRefresher.stopPolling()
  }

  public render() {
    const {
      source,
      notify,
      sources,
      timeZone,
      timeRange,
      fluxLinks,
      queryStatuses,
      editQueryStatus,
      updateSourceLink,
      onSetTimeZone,
      autoRefresh,
    } = this.props

    const {isStaticLegend, isComponentMounted} = this.state

    if (!isComponentMounted) {
      return <PageSpinner />
    }

    return (
      <>
        {this.writeDataForm}
        {this.sendToDashboardOverlay}
        <div className="deceo--page">
          <TimeMachine
            notify={notify}
            source={source}
            isInCEO={false}
            sources={sources}
            fluxLinks={fluxLinks}
            templates={this.templates}
            queryStatuses={queryStatuses}
            isStaticLegend={isStaticLegend}
            editQueryStatus={editQueryStatus}
            updateSourceLink={updateSourceLink}
            onResetFocus={this.handleResetFocus}
            onToggleStaticLegend={this.handleToggleStaticLegend}
            onActiveQueryIndexChange={this.onActiveQueryIndexChange}
            refresh={autoRefresh}
          >
            {(activeEditorTab, onSetActiveEditorTab) => (
              <DEHeader
                timeZone={timeZone}
                timeRange={timeRange}
                onSetTimeZone={onSetTimeZone}
                activeEditorTab={activeEditorTab}
                onOpenWriteData={this.handleOpenWriteData}
                onSetActiveEditorTab={onSetActiveEditorTab}
                toggleSendToDashboard={this.toggleSendToDashboard}
              />
            )}
          </TimeMachine>
        </div>
      </>
    )
  }

  private get writeDataForm(): JSX.Element {
    const {source, errorThrownAction, writeLineProtocol, queryType} = this.props

    const {isWriteFormVisible} = this.state
    return (
      <OverlayTechnology visible={isWriteFormVisible}>
        <WriteDataForm
          source={source}
          errorThrown={errorThrownAction}
          selectedDatabase={this.selectedDatabase}
          onClose={this.handleCloseWriteData}
          writeLineProtocol={writeLineProtocol}
          useV2={queryType === 'flux'}
        />
      </OverlayTechnology>
    )
  }

  private get sendToDashboardOverlay(): JSX.Element {
    const {
      source,
      dashboards,
      sendDashboardCell,
      handleGetDashboards,
      notify,
    } = this.props

    const {
      isSendToDashboardVisible,
      isStaticLegend,
      activeQueryIndex,
    } = this.state
    return (
      <Authorized requiredRole={EDITOR_ROLE}>
        <OverlayTechnology visible={isSendToDashboardVisible}>
          <SendToDashboardOverlay
            notify={notify}
            onCancel={this.toggleSendToDashboard}
            source={source}
            dashboards={dashboards}
            activeQueryIndex={activeQueryIndex}
            handleGetDashboards={handleGetDashboards}
            sendDashboardCell={sendDashboardCell}
            isStaticLegend={isStaticLegend}
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

  private get selectedDatabase(): string {
    return null
  }

  private toggleSendToDashboard = () => {
    this.setState({
      isSendToDashboardVisible: !this.state.isSendToDashboardVisible,
    })
  }

  private handleToggleStaticLegend = (isStaticLegend: boolean): void => {
    this.setState({isStaticLegend})
  }

  private onActiveQueryIndexChange = (activeQueryIndex: number): void => {
    this.setState({activeQueryIndex})
  }

  private handleResetFocus = () => {
    return
  }
}
const DataExplorer2 = ErrorHandling(DataExplorer)

const ConnectedDataExplorer = (
  props: PassedProps & ReduxStateProps & ReduxDispatchProps
) => {
  return (
    <TimeMachineContextConsumer>
      {(container: TimeMachineContainer) => {
        const {state} = container
        return (
          <DataExplorer2
            {...props}
            queryDrafts={state.queryDrafts}
            queryType={state.queryType}
            draftScript={state.draftScript}
            timeRange={state.timeRange}
            script={state.script}
            onInitFluxScript={container.handleInitFluxScript}
            onUpdateQueryDrafts={container.handleUpdateQueryDrafts}
            onResetTimeMachine={container.reset}
          />
        )
      }}
    </TimeMachineContextConsumer>
  )
}

const mstp = (state: any) => {
  const {
    app: {
      persisted: {autoRefresh, timeZone},
    },
    dataExplorer: {timeRange, queryStatuses, sourceLink},
    dashboardUI: {dashboards},
    sources,
    links,
  } = state

  return {
    timeZone,
    fluxLinks: links.flux,
    autoRefresh,
    timeRange,
    dashboards,
    sources,
    queryStatuses,
    sourceLink,
  } as ReduxStateProps
}

const mdtp = {
  handleChooseAutoRefresh: setAutoRefresh,
  errorThrownAction: errorThrown,
  writeLineProtocol: writeLineProtocolAsync,
  handleGetDashboards: getDashboardsAsync,
  sendDashboardCell: sendDashboardCellAsync,
  editQueryStatus: editQueryStatusAction,
  resetQueryStatuses: resetQueryStatusesAction,
  notify: notifyAction,
  updateSourceLink: updateSourceLinkAction,
  onSetTimeZone: setTimeZoneAction,
}

export default connect(mstp, mdtp)(ConnectedDataExplorer)
