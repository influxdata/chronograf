import * as React from 'react'
import * as PropTypes from 'prop-types'

import DashboardsTable from 'dashboards/components/DashboardsTable'
import FancyScrollbar from 'shared/components/FancyScrollbar'

const DashboardsPageContents = ({
  dashboards,
  onDeleteDashboard,
  onCreateDashboard,
  dashboardLink,
}) => {
  let tableHeader
  if (dashboards === null) {
    tableHeader = 'Loading Dashboards...'
  } else if (dashboards.length === 1) {
    tableHeader = '1 Dashboard'
  } else {
    tableHeader = `${dashboards.length} Dashboards`
  }

  return (
    <FancyScrollbar className="page-contents">
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12">
            <div className="panel panel-minimal">
              <div className="panel-heading u-flex u-ai-center u-jc-space-between">
                <h2 className="panel-title">
                  {tableHeader}
                </h2>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={onCreateDashboard}
                >
                  <span className="icon plus" /> Create Dashboard
                </button>
              </div>
              <div className="panel-body">
                <DashboardsTable
                  dashboards={dashboards}
                  onDeleteDashboard={onDeleteDashboard}
                  onCreateDashboard={onCreateDashboard}
                  dashboardLink={dashboardLink}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </FancyScrollbar>
  )
}

const {arrayOf, func, shape, string} = PropTypes

DashboardsPageContents.propTypes = {
  dashboards: arrayOf(shape()),
  onDeleteDashboard: func.isRequired,
  onCreateDashboard: func.isRequired,
  dashboardLink: string.isRequired,
}

export default DashboardsPageContents
