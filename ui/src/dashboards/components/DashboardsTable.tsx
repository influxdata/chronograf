import * as React from 'react'
import * as PropTypes from 'prop-types'
import {Link} from 'react-router-dom'
import * as _ from 'lodash'

import DeleteConfirmTableCell from 'shared/components/DeleteConfirmTableCell'

const DashboardsTable = ({
  dashboards,
  onDeleteDashboard,
  onCreateDashboard,
  dashboardLink,
}) => {
  return dashboards && dashboards.length
    ? <table className="table v-center admin-table table-highlight">
        <thead>
          <tr>
            <th>Name</th>
            <th>Template Variables</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {_.sortBy(dashboards, d => d.name.toLowerCase()).map(dashboard =>
            <tr key={dashboard.id}>
              <td>
                <Link to={`${dashboardLink}/dashboards/${dashboard.id}`}>
                  {dashboard.name}
                </Link>
              </td>
              <td>
                {dashboard.templates.length
                  ? dashboard.templates.map(tv =>
                      <code className="table--temp-var" key={tv.id}>
                        {tv.tempVar}
                      </code>
                    )
                  : <span className="empty-string">None</span>}
              </td>
              <DeleteConfirmTableCell
                onDelete={onDeleteDashboard}
                item={dashboard}
                buttonSize="btn-xs"
              />
            </tr>
          )}
        </tbody>
      </table>
    : <div className="generic-empty-state">
        <h4 style={{marginTop: '90px'}}>
          Looks like you don’t have any dashboards
        </h4>
        <button
          className="btn btn-sm btn-primary"
          onClick={onCreateDashboard}
          style={{marginBottom: '90px'}}
        >
          <span className="icon plus" /> Create Dashboard
        </button>
      </div>
}

const {arrayOf, func, shape, string} = PropTypes

DashboardsTable.propTypes = {
  dashboards: arrayOf(shape()),
  onDeleteDashboard: func.isRequired,
  onCreateDashboard: func.isRequired,
  dashboardLink: string.isRequired,
}

export default DashboardsTable
