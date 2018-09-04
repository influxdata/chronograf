import React, {PureComponent, MouseEvent} from 'react'
import {Link} from 'react-router'
import _ from 'lodash'

import Authorized, {EDITOR_ROLE, VIEWER_ROLE} from 'src/auth/Authorized'
import ConfirmButton from 'src/shared/components/ConfirmButton'

import {getDeep} from 'src/utils/wrappers'

import {Dashboard, Template, RemoteDataState} from 'src/types'

interface Props {
  dashboards: Dashboard[]
  dashboardsStatus: RemoteDataState
  onDeleteDashboard: (dashboard: Dashboard) => () => void
  onCreateDashboard: () => void
  onCloneDashboard: (
    dashboard: Dashboard
  ) => (event: MouseEvent<HTMLButtonElement>) => void
  onExportDashboard: (dashboard: Dashboard) => () => void
  dashboardLink: string
}

class DashboardsTable extends PureComponent<Props> {
  public render() {
    const {
      dashboards,
      dashboardsStatus,
      dashboardLink,
      onCloneDashboard,
      onDeleteDashboard,
      onExportDashboard,
    } = this.props

    if (
      dashboardsStatus === RemoteDataState.Loading ||
      dashboardsStatus === RemoteDataState.NotStarted
    ) {
      return this.renderLoadingState()
    }

    if (dashboardsStatus === RemoteDataState.Error) {
      return this.renderErrorState()
    }

    if (!dashboards.length) {
      return this.renderEmptyState()
    }

    return (
      <table className="table v-center admin-table table-highlight">
        <thead>
          <tr>
            <th>Name</th>
            <th>Template Variables</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {_.sortBy(dashboards, d => d.name.toLowerCase()).map(dashboard => (
            <tr key={dashboard.id}>
              <td>
                <Link to={`${dashboardLink}/dashboards/${dashboard.id}`}>
                  {dashboard.name}
                </Link>
              </td>
              <td>{this.getDashboardTemplates(dashboard)}</td>
              <td className="text-right">
                <Authorized
                  requiredRole={VIEWER_ROLE}
                  replaceWithIfNotAuthorized={<div />}
                >
                  <button
                    className="btn btn-xs btn-default table--show-on-row-hover"
                    onClick={onExportDashboard(dashboard)}
                  >
                    <span className="icon export" />Export
                  </button>
                </Authorized>
                <Authorized
                  requiredRole={EDITOR_ROLE}
                  replaceWithIfNotAuthorized={<div />}
                >
                  <>
                    <button
                      className="btn btn-xs btn-default table--show-on-row-hover"
                      onClick={onCloneDashboard(dashboard)}
                    >
                      <span className="icon duplicate" />
                      Clone
                    </button>
                    <ConfirmButton
                      confirmAction={onDeleteDashboard(dashboard)}
                      size="btn-xs"
                      type="btn-danger"
                      text="Delete"
                      customClass="table--show-on-row-hover"
                    />
                  </>
                </Authorized>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  private getDashboardTemplates = (
    dashboard: Dashboard
  ): JSX.Element | JSX.Element[] => {
    const templates = getDeep<Template[]>(dashboard, 'templates', [])

    if (templates.length) {
      return templates.map(tv => (
        <code className="table--temp-var" key={tv.id}>
          {tv.tempVar}
        </code>
      ))
    }

    return <span className="empty-string">None</span>
  }

  private renderLoadingState(): JSX.Element {
    return (
      <div className="generic-empty-state">
        <h4>Loading dashboards...</h4>
      </div>
    )
  }

  private renderErrorState(): JSX.Element {
    return (
      <div className="generic-empty-state">
        <h4>Unable to load dashboards</h4>
      </div>
    )
  }

  private renderEmptyState(): JSX.Element {
    const {onCreateDashboard} = this.props

    return (
      <Authorized
        requiredRole={EDITOR_ROLE}
        replaceWithIfNotAuthorized={this.unauthorizedEmptyState}
      >
        <div className="generic-empty-state">
          <h4>Looks like you don’t have any dashboards</h4>
          <br />
          <button
            className="btn btn-sm btn-primary"
            onClick={onCreateDashboard}
          >
            <span className="icon plus" /> Create Dashboard
          </button>
        </div>
      </Authorized>
    )
  }

  private get unauthorizedEmptyState(): JSX.Element {
    return (
      <div className="generic-empty-state">
        <h4 style={{margin: '90px 0'}}>
          Looks like you don’t have any dashboards
        </h4>
      </div>
    )
  }
}

export default DashboardsTable
