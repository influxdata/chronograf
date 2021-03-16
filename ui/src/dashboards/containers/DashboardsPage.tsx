import React, {PureComponent} from 'react'
import {withRouter, InjectedRouter, WithRouterProps} from 'react-router'
import {connect} from 'react-redux'
import download from 'src/external/download'
import _ from 'lodash'

import DashboardsContents from 'src/dashboards/components/DashboardsPageContents'
import {Page} from 'src/reusable_ui'
import {getDeep} from 'src/utils/wrappers'

import {mapDashboardForDownload} from 'src/dashboards/utils/export'
import {createDashboard} from 'src/dashboards/apis'
import {
  getDashboardsAsync,
  deleteDashboardAsync,
  getChronografVersion,
  importDashboardAsync,
  retainRangesDashTimeV1 as retainRangesDashTimeV1Action,
  retainDashRefresh as retainDashRefreshAction,
} from 'src/dashboards/actions'
import {notify as notifyAction} from 'src/shared/actions/notifications'

import {
  NEW_DASHBOARD,
  DEFAULT_DASHBOARD_NAME,
  NEW_DEFAULT_DASHBOARD_CELL,
} from 'src/dashboards/constants'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {
  notifyDashboardExported,
  notifyDashboardExportFailed,
} from 'src/shared/copy/notifications'

import {Source, Dashboard, RemoteDataState} from 'src/types'
import {Notification} from 'src/types/notifications'
import {DashboardFile, Cell} from 'src/types/dashboards'

export interface Props extends WithRouterProps {
  source: Source
  sources: Source[]
  router: InjectedRouter
  dashboard: Dashboard
  handleGetDashboards: () => Promise<Dashboard[]>
  handleGetChronografVersion: () => string
  handleDeleteDashboard: (dashboard: Dashboard) => void
  handleImportDashboard: (dashboard: Dashboard) => void
  notify: (message: Notification) => void
  retainRangesDashTimeV1: (dashboardIDs: number[]) => void
  retainDashRefresh: (dashboardIDs: number[]) => void
  dashboards: Dashboard[]
}

interface State {
  dashboardsStatus: RemoteDataState
}

@ErrorHandling
export class DashboardsPage extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {dashboardsStatus: RemoteDataState.NotStarted}
  }

  public async componentDidMount() {
    this.setState({dashboardsStatus: RemoteDataState.Loading})

    let dashboards

    try {
      dashboards = await this.props.handleGetDashboards()

      const dashboardIDs = dashboards.map(d => d.id)

      this.props.retainRangesDashTimeV1(dashboardIDs)
      this.props.retainDashRefresh(dashboardIDs)
      this.setState({dashboardsStatus: RemoteDataState.Done})
    } catch {
      this.setState({dashboardsStatus: RemoteDataState.Error})
    }
  }

  public render() {
    const {dashboards, notify, sources, source} = this.props
    const {dashboardsStatus} = this.state
    const dashboardLink = `/sources/${this.props.source.id}`

    return (
      <Page>
        <Page.Header>
          <Page.Header.Left>
            <Page.Title title="Dashboards" />
          </Page.Header.Left>
          <Page.Header.Right showSourceIndicator={true} />
        </Page.Header>
        <Page.Contents>
          <DashboardsContents
            notify={notify}
            source={source}
            sources={sources}
            dashboards={dashboards}
            dashboardsStatus={dashboardsStatus}
            dashboardLink={dashboardLink}
            onDeleteDashboard={this.handleDeleteDashboard}
            onCreateDashboard={this.handleCreateDashboard}
            onCloneDashboard={this.handleCloneDashboard}
            onExportDashboard={this.handleExportDashboard}
            onImportDashboard={this.handleImportDashboard}
          />
        </Page.Contents>
      </Page>
    )
  }

  private handleCreateDashboard = async (): Promise<void> => {
    const {
      source: {id},
      router: {push},
    } = this.props
    const {data} = await createDashboard(NEW_DASHBOARD)
    push(`/sources/${id}/dashboards/${data.id}`)
  }

  private handleCloneDashboard = (
    dashboard: Dashboard
  ) => async (): Promise<void> => {
    const {
      source: {id},
      router: {push},
    } = this.props
    const {data} = await createDashboard({
      ...dashboard,
      name: `${dashboard.name} (clone)`,
    })
    push(`/sources/${id}/dashboards/${data.id}`)
  }

  private handleDeleteDashboard = (dashboard: Dashboard) => (): void => {
    this.props.handleDeleteDashboard(dashboard)
  }

  private handleExportDashboard = (
    dashboard: Dashboard
  ) => async (): Promise<void> => {
    const dashboardForDownload = await this.modifyDashboardForDownload(
      dashboard
    )
    try {
      download(
        JSON.stringify(dashboardForDownload, null, '\t'),
        `${dashboard.name}.json`,
        'text/plain'
      )
      this.props.notify(notifyDashboardExported(dashboard.name))
    } catch (error) {
      this.props.notify(notifyDashboardExportFailed(dashboard.name, error))
    }
  }

  private modifyDashboardForDownload = async (
    dashboard: Dashboard
  ): Promise<DashboardFile> => {
    const {sources, handleGetChronografVersion} = this.props
    const version = await handleGetChronografVersion()

    return mapDashboardForDownload(sources, dashboard, version)
  }

  private handleImportDashboard = async (
    dashboard: Dashboard
  ): Promise<void> => {
    const name = _.get(dashboard, 'name', DEFAULT_DASHBOARD_NAME)
    const cellsWithDefaultsApplied = getDeep<Cell[]>(
      dashboard,
      'cells',
      []
    ).map(c => ({...NEW_DEFAULT_DASHBOARD_CELL, ...c}))

    await this.props.handleImportDashboard({
      ...dashboard,
      name,
      cells: cellsWithDefaultsApplied,
    })
  }
}

const mapStateToProps = ({
  dashboardUI: {dashboards, dashboard},
  sources,
}): Partial<Props> => ({
  dashboards,
  dashboard,
  sources,
})

const mapDispatchToProps = {
  handleGetDashboards: getDashboardsAsync,
  handleDeleteDashboard: deleteDashboardAsync,
  handleGetChronografVersion: getChronografVersion,
  handleImportDashboard: importDashboardAsync,
  notify: notifyAction,
  retainRangesDashTimeV1: retainRangesDashTimeV1Action,
  retainDashRefresh: retainDashRefreshAction,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(DashboardsPage))
