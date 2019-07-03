// Libraries
import React, {Component, MouseEvent} from 'react'
import {connect} from 'react-redux'
import {withRouter} from 'react-router'
import _ from 'lodash'

// Components
import {ErrorHandling} from 'src/shared/decorators/errors'
import CellEditorOverlay from 'src/dashboards/components/CellEditorOverlay'
import DashboardHeader from 'src/dashboards/components/DashboardHeader'
import Dashboard from 'src/dashboards/components/Dashboard'
import ManualRefresh from 'src/shared/components/ManualRefresh'
import TemplateControlBar from 'src/tempVars/components/TemplateControlBar'
import AnnotationControlBar from 'src/shared/components/AnnotationControlBar'
import AnnotationEditorContainer from 'src/shared/components/AnnotationEditorContainer'
import {OverlayTechnology, Page} from 'src/reusable_ui'

// Actions
import * as dashboardActions from 'src/dashboards/actions'
import {
  getAnnotationsAsync,
  dismissEditingAnnotation,
} from 'src/shared/actions/annotations'
import * as cellEditorOverlayActions from 'src/dashboards/actions/cellEditorOverlay'

import * as appActions from 'src/shared/actions/app'
import * as errorActions from 'src/shared/actions/errors'
import * as notifyActions from 'src/shared/actions/notifications'

// Utils
import idNormalizer, {TYPE_ID} from 'src/normalizers/id'
import {getDeep} from 'src/utils/wrappers'
import {updateDashboardLinks} from 'src/dashboards/utils/dashboardSwitcherLinks'
import {GlobalAutoRefresher} from 'src/utils/AutoRefresher'
import {getTimeRange} from 'src/dashboards/selectors'
import {annotationsError} from 'src/shared/copy/notifications'

// APIs
import {loadDashboardLinks} from 'src/dashboards/apis'

// Constants
import {interval, DASHBOARD_LAYOUT_ROW_HEIGHT} from 'src/shared/constants'
import {FORMAT_INFLUXQL} from 'src/shared/data/timeRanges'
import {EMPTY_LINKS} from 'src/dashboards/constants/dashboardHeader'
import {getNewDashboardCell} from 'src/dashboards/utils/cellGetters'

// Types
import {WithRouterProps} from 'react-router'
import {ManualRefreshProps} from 'src/shared/components/ManualRefresh'
import {Location} from 'history'
import {InjectedRouter} from 'react-router'
import * as AppActions from 'src/types/actions/app'
import * as DashboardsModels from 'src/types/dashboards'
import * as ErrorsActions from 'src/types/actions/errors'
import * as QueriesModels from 'src/types/queries'
import * as SourcesModels from 'src/types/sources'
import * as TempVarsModels from 'src/types/tempVars'
import {NewDefaultCell} from 'src/types/dashboards'
import {NotificationAction, TimeZones} from 'src/types'
import {AnnotationsDisplaySetting} from 'src/types/annotations'
import {Links} from 'src/types/flux'
import {createTimeRangeTemplates} from 'src/shared/utils/templates'

interface Props extends ManualRefreshProps, WithRouterProps {
  fluxLinks: Links
  source: SourcesModels.Source
  sources: SourcesModels.Source[]
  params: {
    sourceID: string
    dashboardID: string
  }
  timeZone: TimeZones
  setTimeZone: typeof appActions.setTimeZone
  location: Location
  dashboardID: number
  dashboard: DashboardsModels.Dashboard
  dashboards: DashboardsModels.Dashboard[]
  handleChooseAutoRefresh: AppActions.SetAutoRefreshActionCreator
  autoRefresh: number
  timeRange: QueriesModels.TimeRange
  zoomedTimeRange: QueriesModels.TimeRange
  inPresentationMode: boolean
  showTemplateVariableControlBar: boolean
  toggleTemplateVariableControlBar: typeof appActions.toggleTemplateVariableControlBar
  handleClickPresentationButton: AppActions.DelayEnablePresentationModeDispatcher
  cellQueryStatus: QueriesModels.QueryStatus
  errorThrown: ErrorsActions.ErrorThrownActionCreator
  meRole: string
  isUsingAuth: boolean
  router: InjectedRouter
  notify: NotificationAction
  annotationsDisplaySetting: AnnotationsDisplaySetting
  onGetAnnotationsAsync: typeof getAnnotationsAsync
  handleClearCEO: typeof cellEditorOverlayActions.clearCEO
  handleDismissEditingAnnotation: typeof dismissEditingAnnotation
  editorTimeRange: QueriesModels.TimeRange
  setDashTimeV1: typeof dashboardActions.setDashTimeV1
  setZoomedTimeRange: typeof dashboardActions.setZoomedTimeRange
  updateDashboard: typeof dashboardActions.updateDashboard
  putDashboard: typeof dashboardActions.putDashboard
  putDashboardByID: typeof dashboardActions.putDashboardByID
  getDashboardsAsync: typeof dashboardActions.getDashboardsAsync
  addDashboardCellAsync: typeof dashboardActions.addDashboardCellAsync
  editCellQueryStatus: typeof dashboardActions.editCellQueryStatus
  updateDashboardCell: typeof dashboardActions.updateDashboardCell
  cloneDashboardCellAsync: typeof dashboardActions.cloneDashboardCellAsync
  deleteDashboardCellAsync: typeof dashboardActions.deleteDashboardCellAsync
  templateVariableLocalSelected: typeof dashboardActions.templateVariableLocalSelected
  getDashboardWithTemplatesAsync: typeof dashboardActions.getDashboardWithTemplatesAsync
  rehydrateTemplatesAsync: typeof dashboardActions.rehydrateTemplatesAsync
  updateTemplateQueryParams: typeof dashboardActions.updateTemplateQueryParams
  updateQueryParams: typeof dashboardActions.updateQueryParams
  updateTimeRangeQueryParams: typeof dashboardActions.updateTimeRangeQueryParams
}

interface State {
  scrollTop: number
  windowHeight: number
  selectedCell: DashboardsModels.Cell | DashboardsModels.NewDefaultCell | null
  dashboardLinks: DashboardsModels.DashboardSwitcherLinks
  showAnnotationControls: boolean
  showCellEditorOverlay: boolean
}

@ErrorHandling
class DashboardPage extends Component<Props, State> {
  public constructor(props: Props) {
    super(props)

    this.state = {
      scrollTop: 0,
      selectedCell: null,
      windowHeight: window.innerHeight,
      dashboardLinks: EMPTY_LINKS,
      showAnnotationControls: false,
      showCellEditorOverlay: false,
    }
  }

  public async componentDidMount() {
    const {autoRefresh} = this.props

    GlobalAutoRefresher.poll(autoRefresh)
    GlobalAutoRefresher.subscribe(this.fetchAnnotations)

    window.addEventListener('resize', this.handleWindowResize, true)

    await this.getDashboard()

    this.fetchAnnotations()
    this.getDashboardLinks()
  }

  public fetchAnnotations = async () => {
    const {source, dashboardID, onGetAnnotationsAsync, notify} = this.props

    try {
      await onGetAnnotationsAsync(source.links.annotations, dashboardID)
    } catch {
      notify(annotationsError('Error fetching annotations'))
    }
  }

  public componentDidUpdate(prevProps: Props) {
    const {dashboard, autoRefresh, annotationsDisplaySetting} = this.props

    const prevPath = getDeep(prevProps.location, 'pathname', null)
    const thisPath = getDeep(this.props.location, 'pathname', null)

    const templates = this.parseTempVar(dashboard)
    const prevTemplates = this.parseTempVar(prevProps.dashboard)

    const intersection = _.intersection(templates, prevTemplates)
    const isTemplateDeleted = intersection.length !== prevTemplates.length

    if ((prevPath && thisPath && prevPath !== thisPath) || isTemplateDeleted) {
      this.getDashboard()
    }

    if (autoRefresh !== prevProps.autoRefresh) {
      GlobalAutoRefresher.poll(autoRefresh)
    }

    if (
      annotationsDisplaySetting !== AnnotationsDisplaySetting.HideAnnotations &&
      annotationsDisplaySetting !== prevProps.annotationsDisplaySetting
    ) {
      this.fetchAnnotations()
    }
  }

  public componentWillUnmount() {
    GlobalAutoRefresher.stopPolling()
    GlobalAutoRefresher.unsubscribe(this.fetchAnnotations)

    window.removeEventListener('resize', this.handleWindowResize, true)
    this.props.handleDismissEditingAnnotation()
  }

  public render() {
    const {
      notify,
      fluxLinks,
      isUsingAuth,
      meRole,
      source,
      sources,
      timeRange,
      timeZone,
      setTimeZone,
      zoomedTimeRange,
      dashboard,
      dashboardID,
      autoRefresh,
      manualRefresh,
      onManualRefresh,
      cellQueryStatus,
      inPresentationMode,
      showTemplateVariableControlBar,
      handleChooseAutoRefresh,
      handleClickPresentationButton,
      toggleTemplateVariableControlBar,
    } = this.props

    const {dashboardTime, upperDashboardTime} = createTimeRangeTemplates(
      timeRange,
      zoomedTimeRange
    )

    let templatesIncludingDashTime
    if (dashboard) {
      templatesIncludingDashTime = [
        ...dashboard.templates,
        dashboardTime,
        upperDashboardTime,
        interval,
      ]
    } else {
      templatesIncludingDashTime = []
    }

    const {
      dashboardLinks,
      showAnnotationControls,
      selectedCell,
      showCellEditorOverlay,
    } = this.state

    return (
      <Page>
        <OverlayTechnology visible={showCellEditorOverlay}>
          <CellEditorOverlay
            source={source}
            sources={sources}
            notify={notify}
            fluxLinks={fluxLinks}
            cell={selectedCell}
            dashboardID={dashboardID}
            queryStatus={cellQueryStatus}
            onSave={this.handleSaveEditedCell}
            onCancel={this.handleHideCellEditorOverlay}
            dashboardTemplates={_.get(dashboard, 'templates', [])}
            editQueryStatus={this.props.editCellQueryStatus}
            dashboardTimeRange={timeRange}
          />
        </OverlayTechnology>
        <DashboardHeader
          dashboard={dashboard}
          timeRange={timeRange}
          timeZone={timeZone}
          onSetTimeZone={setTimeZone}
          autoRefresh={autoRefresh}
          isHidden={inPresentationMode}
          onAddCell={this.handleAddCell}
          onManualRefresh={onManualRefresh}
          zoomedTimeRange={zoomedTimeRange}
          onRenameDashboard={this.handleRenameDashboard}
          dashboardLinks={dashboardLinks}
          activeDashboard={dashboard ? dashboard.name : ''}
          showAnnotationControls={showAnnotationControls}
          showTempVarControls={showTemplateVariableControlBar}
          handleChooseAutoRefresh={handleChooseAutoRefresh}
          handleChooseTimeRange={this.handleChooseTimeRange}
          onToggleShowTempVarControls={toggleTemplateVariableControlBar}
          onToggleShowAnnotationControls={this.toggleAnnotationControls}
          handleClickPresentationButton={handleClickPresentationButton}
        />
        {!inPresentationMode &&
          showTemplateVariableControlBar && (
            <TemplateControlBar
              templates={dashboard && dashboard.templates}
              meRole={meRole}
              isUsingAuth={isUsingAuth}
              onSaveTemplates={this.handleSaveTemplateVariables}
              onPickTemplate={this.handlePickTemplate}
              source={source}
            />
          )}
        {!inPresentationMode &&
          showAnnotationControls && (
            <AnnotationControlBar dashboardID={dashboardID} source={source} />
          )}
        {this.showDashboard ? (
          <Dashboard
            source={source}
            sources={sources}
            setScrollTop={this.setScrollTop}
            inView={this.inView}
            dashboard={dashboard}
            timeRange={timeRange}
            manualRefresh={manualRefresh}
            onZoom={this.handleZoomedTimeRange}
            inPresentationMode={inPresentationMode}
            onPositionChange={this.handleUpdatePosition}
            onDeleteCell={this.handleDeleteDashboardCell}
            onCloneCell={this.handleCloneCell}
            templatesIncludingDashTime={templatesIncludingDashTime}
            onSummonOverlayTechnologies={this.handleShowCellEditorOverlay}
          />
        ) : null}
        <AnnotationEditorContainer />
      </Page>
    )
  }

  public parseTempVar(
    dashboard: DashboardsModels.Dashboard
  ): TempVarsModels.Template[] {
    return getDeep(dashboard, 'templates', []).map(t => t.tempVar)
  }

  private get showDashboard(): boolean {
    const {dashboard} = this.props

    return !!dashboard
  }

  private handleWindowResize = (): void => {
    this.setState({windowHeight: window.innerHeight})
  }

  private getDashboard = async () => {
    const {dashboardID, source, getDashboardWithTemplatesAsync} = this.props

    await getDashboardWithTemplatesAsync(dashboardID, source)
    this.updateActiveDashboard()
  }

  private updateActiveDashboard(): void {
    this.setState((prevState, props) => ({
      dashboardLinks: updateDashboardLinks(
        prevState.dashboardLinks,
        props.dashboard
      ),
    }))
  }

  private inView = (cell: DashboardsModels.Cell): boolean => {
    const {scrollTop, windowHeight} = this.state
    const bufferValue = 600
    const cellTop = cell.y * DASHBOARD_LAYOUT_ROW_HEIGHT
    const cellBottom = (cell.y + cell.h) * DASHBOARD_LAYOUT_ROW_HEIGHT
    const bufferedWindowBottom = windowHeight + scrollTop + bufferValue
    const bufferedWindowTop = scrollTop - bufferValue
    const topInView = cellTop < bufferedWindowBottom
    const bottomInView = cellBottom > bufferedWindowTop

    return topInView && bottomInView
  }

  private isExistingCell(cell: DashboardsModels.Cell | NewDefaultCell) {
    return (cell as DashboardsModels.Cell).i !== undefined
  }

  private handleSaveEditedCell = async (
    newCell: DashboardsModels.Cell | NewDefaultCell
  ): Promise<void> => {
    const {dashboard} = this.props

    if (this.isExistingCell(newCell)) {
      await this.props.updateDashboardCell(dashboard, newCell)
    } else {
      this.props.addDashboardCellAsync(dashboard, newCell)
    }

    this.handleHideCellEditorOverlay()
  }

  private handleShowCellEditorOverlay = (cell: DashboardsModels.Cell): void => {
    this.setState({selectedCell: cell, showCellEditorOverlay: true})
  }

  private handleHideCellEditorOverlay = () => {
    const {handleClearCEO} = this.props
    const WAIT_FOR_ANIMATION = 400

    this.setState({showCellEditorOverlay: false})
    window.setTimeout(() => {
      handleClearCEO()
    }, WAIT_FOR_ANIMATION)
  }

  private handleChooseTimeRange = (
    timeRange: QueriesModels.TimeRange
  ): void => {
    const {dashboardID, setDashTimeV1, updateTimeRangeQueryParams} = this.props

    updateTimeRangeQueryParams({
      lower: timeRange.lower,
      upper: timeRange.upper,
    })

    setDashTimeV1(dashboardID, {
      ...timeRange,
      format: FORMAT_INFLUXQL,
    })

    this.fetchAnnotations()
  }

  private handleUpdatePosition = (cells: DashboardsModels.Cell[]): void => {
    const {dashboard} = this.props
    const newDashboard = {...dashboard, cells}

    this.props.updateDashboard(newDashboard)
    this.props.putDashboard(newDashboard)
  }

  private handleAddCell = (): void => {
    const {dashboard} = this.props
    const emptyCell = getNewDashboardCell(dashboard)

    this.setState({selectedCell: emptyCell, showCellEditorOverlay: true})
  }

  private handleCloneCell = (cell: DashboardsModels.Cell): void => {
    const {dashboard} = this.props
    this.props.cloneDashboardCellAsync(dashboard, cell)
  }

  private handleRenameDashboard = async (name: string): Promise<void> => {
    const {dashboard} = this.props
    const renamedDashboard = {...dashboard, name}

    this.props.updateDashboard(renamedDashboard)
    await this.props.putDashboard(renamedDashboard)
    this.updateActiveDashboard()
  }

  private handleDeleteDashboardCell = (cell: DashboardsModels.Cell): void => {
    const {dashboard} = this.props
    this.props.deleteDashboardCellAsync(dashboard, cell)
  }

  private handlePickTemplate = (
    template: TempVarsModels.Template,
    value: TempVarsModels.TemplateValue
  ): void => {
    const {
      dashboard,
      source,
      templateVariableLocalSelected,
      rehydrateTemplatesAsync,
    } = this.props

    templateVariableLocalSelected(dashboard.id, template.id, value)
    rehydrateTemplatesAsync(dashboard.id, source)
  }

  private handleSaveTemplateVariables = async (
    templates: TempVarsModels.Template[]
  ): Promise<void> => {
    const {dashboard, updateTemplateQueryParams} = this.props

    try {
      await this.props.putDashboard({
        ...dashboard,
        templates,
      })

      updateTemplateQueryParams(dashboard.id)
    } catch (error) {
      console.error(error)
    }
  }

  private toggleAnnotationControls = () => {
    this.setState({showAnnotationControls: !this.state.showAnnotationControls})
  }

  private handleZoomedTimeRange = (
    zoomedTimeRange: QueriesModels.TimeRange
  ): void => {
    const {setZoomedTimeRange, updateQueryParams} = this.props

    setZoomedTimeRange(zoomedTimeRange)

    updateQueryParams({
      zoomedLower: zoomedTimeRange.lower,
      zoomedUpper: zoomedTimeRange.upper,
    })
  }

  private setScrollTop = (e: MouseEvent<HTMLElement>): void => {
    const target = e.target as HTMLElement

    this.setState({scrollTop: target.scrollTop})
  }

  private getDashboardLinks = async (): Promise<void> => {
    const {source, dashboard: activeDashboard} = this.props

    try {
      const dashboardLinks = await loadDashboardLinks(source, {activeDashboard})

      this.setState({
        dashboardLinks,
      })
    } catch (error) {
      console.error(error)
    }
  }
}

const mstp = (state, {params: {dashboardID}}) => {
  const {
    app: {
      ephemeral: {inPresentationMode},
      persisted: {autoRefresh, showTemplateVariableControlBar, timeZone},
    },
    links,
    annotations: {displaySetting},
    dashboardUI: {dashboards, cellQueryStatus, zoomedTimeRange},
    sources,
    auth: {me, isUsingAuth},
    cellEditorOverlay: {cell, timeRange: editorTimeRange},
  } = state

  const meRole = _.get(me, 'role', null)

  const timeRange = getTimeRange(state, dashboardID)

  const dashboard = dashboards.find(
    d => d.id === idNormalizer(TYPE_ID, dashboardID)
  )

  const selectedCell = cell

  return {
    sources,
    meRole,
    timeZone,
    dashboard,
    fluxLinks: links.flux,
    dashboardID: Number(dashboardID),
    timeRange,
    zoomedTimeRange,
    autoRefresh,
    isUsingAuth,
    cellQueryStatus,
    inPresentationMode,
    selectedCell,
    editorTimeRange,
    showTemplateVariableControlBar,
    annotationsDisplaySetting: displaySetting,
  }
}

const mdtp = {
  setDashTimeV1: dashboardActions.setDashTimeV1,
  setZoomedTimeRange: dashboardActions.setZoomedTimeRange,
  updateDashboard: dashboardActions.updateDashboard,
  putDashboard: dashboardActions.putDashboard,
  putDashboardByID: dashboardActions.putDashboardByID,
  getDashboardsAsync: dashboardActions.getDashboardsAsync,
  addDashboardCellAsync: dashboardActions.addDashboardCellAsync,
  editCellQueryStatus: dashboardActions.editCellQueryStatus,
  updateDashboardCell: dashboardActions.updateDashboardCell,
  cloneDashboardCellAsync: dashboardActions.cloneDashboardCellAsync,
  deleteDashboardCellAsync: dashboardActions.deleteDashboardCellAsync,
  templateVariableLocalSelected: dashboardActions.templateVariableLocalSelected,
  toggleTemplateVariableControlBar: appActions.toggleTemplateVariableControlBar,
  getDashboardWithTemplatesAsync:
    dashboardActions.getDashboardWithTemplatesAsync,
  rehydrateTemplatesAsync: dashboardActions.rehydrateTemplatesAsync,
  updateTemplateQueryParams: dashboardActions.updateTemplateQueryParams,
  updateQueryParams: dashboardActions.updateQueryParams,
  updateTimeRangeQueryParams: dashboardActions.updateTimeRangeQueryParams,
  handleChooseAutoRefresh: appActions.setAutoRefresh,
  handleClickPresentationButton: appActions.delayEnablePresentationMode,
  errorThrown: errorActions.errorThrown,
  notify: notifyActions.notify,
  handleClearCEO: cellEditorOverlayActions.clearCEO,
  onGetAnnotationsAsync: getAnnotationsAsync,
  handleDismissEditingAnnotation: dismissEditingAnnotation,
  setTimeZone: appActions.setTimeZone,
}

export default connect(mstp, mdtp)(
  ManualRefresh<Props>(withRouter<Props>(DashboardPage))
)
