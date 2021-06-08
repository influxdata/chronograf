import React, {FC} from 'react'
import {Link} from 'react-router'

import KapacitorRulesTable from 'src/kapacitor/components/KapacitorRulesTable'
import TasksTable from 'src/kapacitor/components/TasksTable'
import FluxTasksTable from 'src/kapacitor/components/FluxTasksTable'

import {Source, AlertRule, Kapacitor, FluxTask} from 'src/types'

interface KapacitorRulesProps {
  source: Source
  kapacitor: Kapacitor
  rules: AlertRule[]
  fluxTasks: FluxTask[]
  onDelete: (rule: AlertRule) => void
  onChangeRuleStatus: (rule: AlertRule) => void
  onChangeFluxTaskStatus: (task: FluxTask) => void
}

const KapacitorRules: FC<KapacitorRulesProps> = ({
  source,
  kapacitor,
  rules,
  onDelete,
  onChangeRuleStatus,
  onChangeFluxTaskStatus,
  fluxTasks = [],
}) => {
  const builderRules = rules.filter((r: AlertRule) => r.query)
  const builderHeader = `${builderRules.length} Alert Rule${
    builderRules.length === 1 ? '' : 's'
  }`
  const scriptsHeader = `${rules.length} TICKscript${
    rules.length === 1 ? '' : 's'
  }`
  const fluxTasksHeader = `${fluxTasks.length} Flux Task${
    fluxTasks.length === 1 ? '' : 's'
  }`
  const kapacitorLink = `/sources/${source.id}/kapacitors/${kapacitor.id}`

  return (
    <div>
      <div className="panel">
        <div className="panel-heading">
          <h2 className="panel-title">{builderHeader}</h2>
          <Link
            to={`${kapacitorLink}/alert-rules/new`}
            className="btn btn-sm btn-primary"
            style={{marginRight: '4px'}}
          >
            <span className="icon plus" /> Build Alert Rule
          </Link>
        </div>
        <div className="panel-body">
          <KapacitorRulesTable
            kapacitorLink={kapacitorLink}
            rules={builderRules}
            onDelete={onDelete}
            onChangeRuleStatus={onChangeRuleStatus}
          />
        </div>
      </div>
      <div className="panel">
        <div className="panel-heading">
          <h2 className="panel-title">{scriptsHeader}</h2>
          <Link
            to={`${kapacitorLink}/tickscripts/new`}
            className="btn btn-sm btn-success"
            style={{marginRight: '4px'}}
          >
            <span className="icon plus" /> Write TICKscript
          </Link>
        </div>
        <div className="panel-body">
          <TasksTable
            kapacitorLink={kapacitorLink}
            tasks={rules}
            onDelete={onDelete}
            onChangeRuleStatus={onChangeRuleStatus}
          />
        </div>
      </div>
      <div className="panel">
        <div className="panel-heading">
          <h2 className="panel-title">{fluxTasksHeader}</h2>
        </div>
        <div className="panel-body">
          <FluxTasksTable
            kapacitorLink={kapacitorLink}
            tasks={fluxTasks}
            // eslint-disable-next-line no-console
            onDelete={console.log}
            // eslint-disable-next-line no-console
            onChangeTaskStatus={onChangeFluxTaskStatus}
          />
        </div>
      </div>
    </div>
  )
}

export default KapacitorRules
