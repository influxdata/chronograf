import React, {Component, MouseEvent} from 'react'

import Authorized, {EDITOR_ROLE} from 'src/auth/Authorized'

import DashboardsTable from 'src/dashboards/components/DashboardsTable'
import ImportDashboardOverlay from 'src/dashboards/components/ImportDashboardOverlay'
import SearchBar from 'src/hosts/components/SearchBar'
import {ErrorHandling} from 'src/shared/decorators/errors'
import OverlayTechnology from 'src/reusable_ui/components/overlays/OverlayTechnology'
import {Button, ComponentColor, IconFont} from 'src/reusable_ui'

import {Dashboard, Source, RemoteDataState} from 'src/types'
import {Notification} from 'src/types/notifications'

interface Props {
  source: Source
  sources: Source[]
  dashboards: Dashboard[]
  dashboardsStatus: RemoteDataState
  onDeleteDashboard: (dashboard: Dashboard) => () => void
  onCreateDashboard: () => void
  onCloneDashboard: (
    dashboard: Dashboard
  ) => (event: MouseEvent<HTMLButtonElement>) => void
  onExportDashboard: (dashboard: Dashboard) => () => void
  onImportDashboard: (dashboard: Dashboard) => void
  notify: (message: Notification) => void
  dashboardLink: string
}

interface State {
  searchTerm: string
  isOverlayVisible: boolean
}

@ErrorHandling
class DashboardsPageContents extends Component<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      searchTerm: '',
      isOverlayVisible: false,
    }
  }

  public render() {
    const {
      onDeleteDashboard,
      onCreateDashboard,
      onCloneDashboard,
      onExportDashboard,
      dashboardLink,
      dashboardsStatus,
    } = this.props

    return (
      <div className="panel dashboards-page-panel">
        {this.renderPanelHeading}
        <div className="panel-body">
          <DashboardsTable
            dashboards={this.filteredDashboards}
            dashboardsStatus={dashboardsStatus}
            onDeleteDashboard={onDeleteDashboard}
            onCreateDashboard={onCreateDashboard}
            onCloneDashboard={onCloneDashboard}
            onExportDashboard={onExportDashboard}
            dashboardLink={dashboardLink}
          />
        </div>
      </div>
    )
  }

  private get renderPanelHeading(): JSX.Element {
    const {onCreateDashboard} = this.props

    return (
      <>
        <div className="panel-heading">
          <h2 className="panel-title">{this.panelTitle}</h2>
          <div className="panel-controls">
            <SearchBar
              placeholder="Filter by Name..."
              onSearch={this.filterDashboards}
            />
            <Authorized requiredRole={EDITOR_ROLE}>
              <>
                <Button
                  text="Import Dashboard"
                  icon={IconFont.Import}
                  onClick={this.handleToggleOverlay}
                />
                <Button
                  text="Create Dashboard"
                  icon={IconFont.Plus}
                  onClick={onCreateDashboard}
                  color={ComponentColor.Primary}
                />
              </>
            </Authorized>
          </div>
        </div>
        {this.renderImportOverlay}
      </>
    )
  }

  private get filteredDashboards(): Dashboard[] {
    const {dashboards} = this.props
    const {searchTerm} = this.state

    return dashboards.filter(d =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  private get panelTitle(): string {
    const {dashboards} = this.props

    if (dashboards === null) {
      return 'Loading Dashboards...'
    } else if (dashboards.length === 1) {
      return '1 Dashboard'
    }

    return `${dashboards.length} Dashboards`
  }

  private filterDashboards = (searchTerm: string): void => {
    this.setState({searchTerm})
  }

  private handleToggleOverlay = (): void => {
    this.setState({isOverlayVisible: !this.state.isOverlayVisible})
  }

  private get renderImportOverlay(): JSX.Element {
    const {onImportDashboard, notify, sources, source} = this.props
    const {isOverlayVisible} = this.state

    return (
      <OverlayTechnology visible={isOverlayVisible}>
        <ImportDashboardOverlay
          onDismissOverlay={this.handleToggleOverlay}
          onImportDashboard={onImportDashboard}
          notify={notify}
          source={source}
          sources={sources}
        />
      </OverlayTechnology>
    )
  }
}

export default DashboardsPageContents
