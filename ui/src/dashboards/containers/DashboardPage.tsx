import * as React from 'react'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import Dygraph from 'src/external/dygraph'

import OverlayTechnologies from 'shared/components/OverlayTechnologies'
import CellEditorOverlay from 'dashboards/components/CellEditorOverlay'
import DashboardHeader from 'dashboards/components/DashboardHeader'
import Dashboard from 'dashboards/components/Dashboard'
import TemplateVariableManager from 'dashboards/components/template_variables/Manager'
import ManualRefresh from 'shared/components/ManualRefresh'

import {errorThrown as errorThrownAction} from 'shared/actions/errors'
import idNormalizer, {TYPE_ID} from 'normalizers/id'

import * as dashboardActionCreators from 'dashboards/actions'

import {
  setAutoRefresh,
  templateControlBarVisibilityToggled as templateControlBarVisibilityToggledAction,
} from 'shared/actions/app'
import {presentationButtonDispatcher} from 'shared/dispatchers'

const FORMAT_INFLUXQL = 'influxql'
const defaultTimeRange = {
  upper: null,
  lower: 'now() - 15m',
  format: FORMAT_INFLUXQL,
}

import {
  Source,
  Cell,
  TimeRange,
  Dygraph as DygraphType,
  ZoomedTimeRange,
} from 'src/types'
import {Dashboard as Dash} from 'src/types/dashboards'

export interface Name {
  name: string
  link: string
}

export interface DashboardPageProps {
  source: Source
  sources: Source[]
  params: {
    sourceID: string
    dashboardID: string
  }
  dashboard: Dash
  dashboardActions: {
    putDashboard: typeof dashboardActionCreators.putDashboard
    getDashboardsAsync: () => Dash[]
    setTimeRange: typeof dashboardActionCreators.setTimeRange
    addDashboardCellAsync: typeof dashboardActionCreators.addDashboardCellAsync
    editDashboardCell: typeof dashboardActionCreators.editDashboardCell
    cancelEditCell: typeof dashboardActionCreators.cancelEditCell
    updateTempVarValues: typeof dashboardActionCreators.updateTempVarValues
    putDashboardByID: typeof dashboardActionCreators.putDashboardByID
    updateDashboardCell: (dashboard: Dash, cell: Cell) => Promise<void>
    updateDashboard: typeof dashboardActionCreators.updateDashboard
    setDashTimeV1: typeof dashboardActionCreators.setDashTimeV1
  }
  dashboards: Dash[]
  handleChooseAutoRefresh: () => void
  autoRefresh: number
  templateControlBarVisibilityToggled: () => void
  timeRange: TimeRange
  showTemplateControlBar: boolean
  inPresentationMode: boolean
  handleClickPresentationButton: () => void
  cellQueryStatus: {
    queryID: string
    status: {}
  }
  errorThrown: () => void
  manualRefresh: number
  onManualRefresh: () => void
}

export interface DashboardPageState {
  dygraphs: DygraphType[]
  selectedCell?: Cell
  isEditMode: boolean
  isTemplating: boolean
  zoomedTimeRange: ZoomedTimeRange
  names: Name[]
}

class DashboardPage extends React.Component<
  DashboardPageProps,
  DashboardPageState
> {
  constructor(props: DashboardPageProps) {
    super(props)

    this.state = {
      dygraphs: [],
      isEditMode: false,
      selectedCell: null,
      isTemplating: false,
      zoomedTimeRange: {zoomedLower: null, zoomedUpper: null},
      names: [],
    }
  }

  private handleRenameDashboard = name => {
    const {dashboardActions, dashboard} = this.props
    this.setState({isEditMode: false})
    const newDashboard = {...dashboard, name}

    dashboardActions.updateDashboard(newDashboard)
    dashboardActions.putDashboard(newDashboard)
  }

  private handleOpenTemplateManager = () => {
    this.setState({isTemplating: true})
  }

  private handleCloseTemplateManager = isEdited => () => {
    if (
      !isEdited ||
      (isEdited && confirm('Do you want to close without saving?')) // eslint-disable-line no-alert
    ) {
      this.setState({isTemplating: false})
    }
  }

  private handleDismissOverlay = () => {
    this.setState({selectedCell: null})
  }

  private handleSaveEditedCell = newCell => {
    const {dashboardActions, dashboard} = this.props
    dashboardActions
      .updateDashboardCell(dashboard, newCell)
      .then(this.handleDismissOverlay)
  }

  private handleSummonOverlayTechnologies = cell => {
    this.setState({selectedCell: cell})
  }

  private handleChooseTimeRange = ({upper, lower}) => {
    const {dashboard, dashboardActions} = this.props
    dashboardActions.setDashTimeV1(dashboard.id, {
      upper,
      lower,
      format: FORMAT_INFLUXQL,
    })
  }

  private handleUpdatePosition = cells => {
    const {dashboardActions, dashboard} = this.props
    const newDashboard = {...dashboard, cells}

    dashboardActions.updateDashboard(newDashboard)
    dashboardActions.putDashboard(newDashboard)
  }

  private handleAddCell = () => {
    const {dashboardActions, dashboard} = this.props
    dashboardActions.addDashboardCellAsync(dashboard)
  }

  private handleEditDashboard = () => {
    this.setState({isEditMode: true})
  }

  private handleCancelEditDashboard = () => {
    this.setState({isEditMode: false})
  }

  private handleUpdateDashboardCell = newCell => () => {
    const {dashboardActions, dashboard} = this.props
    dashboardActions.updateDashboardCell(dashboard, newCell)
  }

  private handleDeleteDashboardCell = cell => {
    const {dashboardActions, dashboard} = this.props
    dashboardActions.deleteDashboardCellAsync(dashboard, cell)
  }

  private handleSelectTemplate = templateID => values => {
    const {dashboardActions, dashboard} = this.props
    dashboardActions.templateVariableSelected(dashboard.id, templateID, [
      values,
    ])
  }

  private handleEditTemplateVariables = (
    templates,
    onSaveTemplatesSuccess
  ) => async () => {
    const {dashboardActions, dashboard} = this.props

    try {
      await dashboardActions.putDashboard({
        ...dashboard,
        templates,
      })
      onSaveTemplatesSuccess()
    } catch (error) {
      console.error(error)
    }
  }

  private handleRunQueryFailure = error => {
    console.error(error)
    this.props.errorThrown(error)
  }

  private synchronizer = dygraph => {
    const dygraphs = [...this.state.dygraphs, dygraph].filter(d => d.graphDiv)
    const {dashboards, params: {dashboardID}} = this.props

    const dashboard = dashboards.find(
      d => d.id === idNormalizer(TYPE_ID, dashboardID)
    )

    if (
      dashboard &&
      dygraphs.length === dashboard.cells.length &&
      dashboard.cells.length > 1
    ) {
      Dygraph.synchronize(dygraphs, {
        selection: true,
        zoom: false,
        range: false,
      })
    }

    this.setState({dygraphs})
  }

  private handleToggleTempVarControls = () => {
    this.props.templateControlBarVisibilityToggled()
  }

  private handleZoomedTimeRange = (zoomedLower, zoomedUpper) => {
    this.setState({zoomedTimeRange: {zoomedLower, zoomedUpper}})
  }

  public async componentDidMount() {
    const {
      params: {dashboardID, sourceID},
      dashboardActions: {
        getDashboardsAsync,
        updateTempVarValues,
        putDashboardByID,
      },
      source,
    } = this.props

    const dashboards = await getDashboardsAsync()
    const dashboard = dashboards.find(
      d => d.id === idNormalizer(TYPE_ID, dashboardID)
    )

    // Refresh and persists influxql generated template variable values
    await updateTempVarValues(source, dashboard)
    await putDashboardByID(dashboardID)

    const names = dashboards.map(d => ({
      name: d.name,
      link: `/sources/${sourceID}/dashboards/${d.id}`,
    }))

    this.setState({names})
  }

  public render() {
    const {zoomedTimeRange} = this.state
    const {zoomedLower, zoomedUpper} = zoomedTimeRange

    const {
      source,
      sources,
      timeRange,
      timeRange: {lower, upper},
      showTemplateControlBar,
      dashboard,
      dashboards,
      autoRefresh,
      manualRefresh,
      onManualRefresh,
      cellQueryStatus,
      dashboardActions,
      inPresentationMode,
      handleChooseAutoRefresh,
      handleClickPresentationButton,
      params: {sourceID, dashboardID},
    } = this.props

    const low = zoomedLower ? zoomedLower : lower
    const up = zoomedUpper ? zoomedUpper : upper

    const lowerType = low && low.includes(':') ? 'timeStamp' : 'constant'
    const upperType = up && up.includes(':') ? 'timeStamp' : 'constant'

    const dashboardTime = {
      id: 'dashtime',
      tempVar: ':dashboardTime:',
      type: lowerType,
      values: [
        {
          value: low,
          type: lowerType,
          selected: true,
        },
      ],
    }

    const upperDashboardTime = {
      id: 'upperdashtime',
      tempVar: ':upperDashboardTime:',
      type: upperType,
      values: [
        {
          value: up || 'now()',
          type: upperType,
          selected: true,
        },
      ],
    }

    // this controls the auto group by behavior
    const interval = {
      id: 'interval',
      type: 'constant',
      tempVar: ':interval:',
      resolution: 1000,
      reportingInterval: 10000000000,
      values: [],
    }

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

    const {selectedCell, isEditMode, isTemplating, names} = this.state

    return (
      <div className="page">
        {isTemplating ? (
          <OverlayTechnologies>
            <TemplateVariableManager
              source={source}
              templates={dashboard.templates}
              onClose={this.handleCloseTemplateManager}
              onRunQueryFailure={this.handleRunQueryFailure}
              onEditTemplateVariables={this.handleEditTemplateVariables}
            />
          </OverlayTechnologies>
        ) : null}
        {selectedCell ? (
          <CellEditorOverlay
            source={source}
            sources={sources}
            cell={selectedCell}
            timeRange={timeRange}
            autoRefresh={autoRefresh}
            dashboardID={dashboardID}
            queryStatus={cellQueryStatus}
            onSave={this.handleSaveEditedCell}
            onCancel={this.handleDismissOverlay}
            templates={templatesIncludingDashTime}
            editQueryStatus={dashboardActions.editCellQueryStatus}
          />
        ) : null}
        <DashboardHeader
          names={names}
          sourceID={sourceID}
          dashboard={dashboard}
          dashboards={dashboards}
          timeRange={timeRange}
          isEditMode={isEditMode}
          autoRefresh={autoRefresh}
          isHidden={inPresentationMode}
          onAddCell={this.handleAddCell}
          onManualRefresh={onManualRefresh}
          zoomedTimeRange={zoomedTimeRange}
          onSave={this.handleRenameDashboard}
          onCancel={this.handleCancelEditDashboard}
          onEditDashboard={this.handleEditDashboard}
          activeDashboard={dashboard ? dashboard.name : ''}
          showTemplateControlBar={showTemplateControlBar}
          handleChooseAutoRefresh={handleChooseAutoRefresh}
          handleChooseTimeRange={this.handleChooseTimeRange}
          onToggleTempVarControls={this.handleToggleTempVarControls}
          handleClickPresentationButton={handleClickPresentationButton}
        />
        {dashboard ? (
          <Dashboard
            source={source}
            sources={sources}
            dashboard={dashboard}
            timeRange={timeRange}
            autoRefresh={autoRefresh}
            manualRefresh={manualRefresh}
            onZoom={this.handleZoomedTimeRange}
            onAddCell={this.handleAddCell}
            synchronizer={this.synchronizer}
            inPresentationMode={inPresentationMode}
            onPositionChange={this.handleUpdatePosition}
            onSelectTemplate={this.handleSelectTemplate}
            onDeleteCell={this.handleDeleteDashboardCell}
            showTemplateControlBar={showTemplateControlBar}
            onOpenTemplateManager={this.handleOpenTemplateManager}
            templatesIncludingDashTime={templatesIncludingDashTime}
            onSummonOverlayTechnologies={this.handleSummonOverlayTechnologies}
          />
        ) : null}
      </div>
    )
  }
}

const mapStateToProps = (state, {params: {dashboardID}}) => {
  const {
    app: {
      ephemeral: {inPresentationMode},
      persisted: {autoRefresh, showTemplateControlBar},
    },
    dashboardUI: {dashboards, cellQueryStatus},
    sources,
    dashTimeV1,
  } = state

  const timeRange =
    dashTimeV1.ranges.find(
      r => r.dashboardID === idNormalizer(TYPE_ID, dashboardID)
    ) || defaultTimeRange

  const dashboard = dashboards.find(
    d => d.id === idNormalizer(TYPE_ID, dashboardID)
  )

  return {
    dashboards,
    autoRefresh,
    dashboard,
    timeRange,
    showTemplateControlBar,
    inPresentationMode,
    cellQueryStatus,
    sources,
  }
}

const mapDispatchToProps = dispatch => ({
  handleChooseAutoRefresh: bindActionCreators(setAutoRefresh, dispatch),
  templateControlBarVisibilityToggled: bindActionCreators(
    templateControlBarVisibilityToggledAction,
    dispatch
  ),
  handleClickPresentationButton: presentationButtonDispatcher(dispatch),
  dashboardActions: bindActionCreators(dashboardActionCreators, dispatch),
  errorThrown: bindActionCreators(errorThrownAction, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(
  ManualRefresh(DashboardPage)
)
