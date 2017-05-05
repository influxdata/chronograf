import React, {PropTypes} from 'react'
import classnames from 'classnames'

import TemplateControlBar from 'src/dashboards/components/TemplateControlBar'
import LayoutRenderer from 'shared/components/LayoutRenderer'

const Dashboard = ({
  source,
  dashboard,
  onAddCell,
  onEditCell,
  autoRefresh,
  onRenameCell,
  onUpdateCell,
  onDeleteCell,
  onPositionChange,
  inPresentationMode,
  onOpenTemplateManager,
  templatesIncludingDashTime,
  onSummonOverlayTechnologies,
  onSelectTemplate,
}) => {
  if (dashboard.id === 0) {
    return null
  }

  const cells = dashboard.cells.map(cell => {
    const dashboardCell = {...cell}
    dashboardCell.queries = dashboardCell.queries.map(
      ({label, query, queryConfig, db}) => ({
        label,
        query,
        queryConfig,
        db,
        database: db,
        text: query,
      })
    )
    return dashboardCell
  })

  return (
    <div
      className={classnames(
        'dashboard container-fluid full-width page-contents',
        {'presentation-mode': inPresentationMode}
      )}
    >
      <TemplateControlBar
        templates={dashboard.templates}
        onSelectTemplate={onSelectTemplate}
        onOpenTemplateManager={onOpenTemplateManager}
      />
      {cells.length
        ? <LayoutRenderer
            templates={templatesIncludingDashTime}
            cells={cells}
            autoRefresh={autoRefresh}
            source={source.links.proxy}
            onPositionChange={onPositionChange}
            onEditCell={onEditCell}
            onRenameCell={onRenameCell}
            onUpdateCell={onUpdateCell}
            onDeleteCell={onDeleteCell}
            onSummonOverlayTechnologies={onSummonOverlayTechnologies}
          />
        : <div className="dashboard__empty">
            <p>This Dashboard has no Graphs</p>
            <button className="btn btn-primary btn-m" onClick={onAddCell}>
              Add Graph
            </button>
          </div>}
    </div>
  )
}

const {arrayOf, bool, func, shape, string, number} = PropTypes

Dashboard.propTypes = {
  dashboard: shape({
    templates: arrayOf(
      shape({
        type: string.isRequired,
        tempVar: string.isRequired,
        query: shape({
          db: string,
          rp: string,
          influxql: string,
        }),
        values: arrayOf(
          shape({
            type: string.isRequired,
            value: string.isRequired,
            selected: bool,
          })
        ).isRequired,
      })
    ).isRequired,
  }).isRequired,
  templatesIncludingDashTime: arrayOf(shape()).isRequired,
  inPresentationMode: bool,
  onAddCell: func,
  onPositionChange: func,
  onEditCell: func,
  onRenameCell: func,
  onUpdateCell: func,
  onDeleteCell: func,
  onSummonOverlayTechnologies: func,
  source: shape({
    links: shape({
      proxy: string,
    }).isRequired,
  }).isRequired,
  autoRefresh: number.isRequired,
  timeRange: shape({}).isRequired,
  onOpenTemplateManager: func.isRequired,
  onSelectTemplate: func.isRequired,
}

export default Dashboard
