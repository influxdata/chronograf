import * as React from 'react'
import {withRouter} from 'react-router-dom'
import {connect} from 'react-redux'
import {bindActionCreators, compose} from 'redux'

import DashboardsHeader from 'dashboards/components/DashboardsHeader'
import DashboardsContents from 'dashboards/components/DashboardsPageContents'

import {createDashboard} from 'dashboards/apis'
import {getDashboardsAsync, deleteDashboardAsync} from 'dashboards/actions'

import {NEW_DASHBOARD} from 'dashboards/constants'
import {Dashboard, History, Source} from 'src/types'

export interface DashboardsPageProps {
  source: Source
  history: History
  handleGetDashboards: () => void
  handleDeleteDashboard: (dashboard: Dashboard) => void
  dashboards: Dashboard[]
}

class DashboardsPage extends React.Component<DashboardsPageProps> {
  private handleCreateDashbord = async () => {
    const {source: {id}, history: {push}} = this.props
    const {data} = await createDashboard(NEW_DASHBOARD)
    push(`/sources/${id}/dashboards/${data.id}`)
  }

  private handleDeleteDashboard = dashboard => {
    this.props.handleDeleteDashboard(dashboard)
  }

  public componentDidMount() {
    this.props.handleGetDashboards()
  }

  public render() {
    const {dashboards, source} = this.props
    const dashboardLink = `/sources/${source.id}`

    return (
      <div className="page">
        <DashboardsHeader source={source} />
        <DashboardsContents
          dashboardLink={dashboardLink}
          dashboards={dashboards}
          onDeleteDashboard={this.handleDeleteDashboard}
          onCreateDashboard={this.handleCreateDashbord}
        />
      </div>
    )
  }
}

const mapStateToProps = ({dashboardUI: {dashboards, dashboard}}) => ({
  dashboards,
  dashboard,
})

const mapDispatchToProps = dispatch => ({
  handleGetDashboards: bindActionCreators(getDashboardsAsync, dispatch),
  handleDeleteDashboard: bindActionCreators(deleteDashboardAsync, dispatch),
})

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(DashboardsPage)
