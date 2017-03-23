import React, {PropTypes} from 'react'
import classnames from 'classnames'

import LayoutRenderer from 'shared/components/LayoutRenderer'
import Visualizations from 'src/dashboards/components/VisualizationSelector'

const Dashboard = ({
  dashboard,
  isEditMode,
  inPresentationMode,
  onPositionChange,
  onEditCell,
  onRenameCell,
  onUpdateCell,
  onSummonOverlayTechnologies,
  source,
  autoRefresh,
  timeRange,
}) => {
  if (dashboard.id === 0) {
    return null
  }

  return (
    <div className={classnames({'page-contents': true, 'presentation-mode': inPresentationMode})}>
      <div className={classnames('container-fluid full-width dashboard', {'dashboard-edit': isEditMode})}>
        {isEditMode ? <Visualizations/> : null}
        {Dashboard.renderDashboard(dashboard, autoRefresh, timeRange, source, onPositionChange, onEditCell, onRenameCell, onUpdateCell, onSummonOverlayTechnologies)}
      </div>
    </div>
  )
}

Dashboard.renderDashboard = (dashboard, autoRefresh, timeRange, source, onPositionChange, onEditCell, onRenameCell, onUpdateCell, onSummonOverlayTechnologies) => {
  const cells = dashboard.cells.map((cell, i) => {
    i = `${i}`
    const dashboardCell = {...cell, i}
    dashboardCell.queries = dashboardCell.queries.map(({label, query, queryConfig, db}) =>
      ({
        label,
        query,
        queryConfig,
        db,
        database: db,
        text: query,
      })
    )
    return dashboardCell;
  })

  return (
    <LayoutRenderer
      timeRange={timeRange}
      cells={cells}
      autoRefresh={autoRefresh}
      source={source.links.proxy}
      onPositionChange={onPositionChange}
      onEditCell={onEditCell}
      onRenameCell={onRenameCell}
      onUpdateCell={onUpdateCell}
      onSummonOverlayTechnologies={onSummonOverlayTechnologies}
    />
  )
}

const {
  bool,
  func,
  shape,
  string,
  number,
} = PropTypes

Dashboard.propTypes = {
  dashboard: shape({}).isRequired,
  isEditMode: bool,
  inPresentationMode: bool,
  onPositionChange: func,
  onEditCell: func,
  onRenameCell: func,
  onUpdateCell: func,
  onSummonOverlayTechnologies: func,
  source: shape({
    links: shape({
      proxy: string,
    }).isRequired,
  }).isRequired,
  autoRefresh: number.isRequired,
  timeRange: shape({}).isRequired,
}

export default Dashboard
