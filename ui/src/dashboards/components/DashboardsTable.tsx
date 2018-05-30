import React, {PureComponent, MouseEvent} from 'react'
import {Link} from 'react-router'
import _ from 'lodash'

import Authorized, {EDITOR_ROLE, VIEWER_ROLE} from 'src/auth/Authorized'
import ConfirmButton from 'src/shared/components/ConfirmButton'

import {Dashboard} from 'src/types'

interface Props {
  dashboards: Dashboard[]
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
      dashboardLink,
      onCloneDashboard,
      onDeleteDashboard,
      onExportDashboard,
    } = this.props

    if (!dashboards.length) {
      return this.emptyStateDashboard
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
              <td>
                {dashboard.templates.length ? (
                  dashboard.templates.map(tv => (
                    <code className="table--temp-var" key={tv.id}>
                      {tv.tempVar}
                    </code>
                  ))
                ) : (
                  <span className="empty-string">None</span>
                )}
              </td>
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
                  <span>
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
                  </span>
                </Authorized>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  private get emptyStateDashboard() {
    const {onCreateDashboard} = this.props
    return (
      <Authorized
        requiredRole={EDITOR_ROLE}
        replaceWithIfNotAuthorized={this.unauthorizedEmptyState}
      >
        <div className="generic-empty-state">
          <h4 style={{marginTop: '90px'}}>
            Looks like you don’t have any dashboards
          </h4>
          <br />
          <button
            className="btn btn-sm btn-primary"
            onClick={onCreateDashboard}
            style={{marginBottom: '90px'}}
          >
            <span className="icon plus" /> Create Dashboard
          </button>
        </div>
      </Authorized>
    )
  }

  private get unauthorizedEmptyState() {
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
