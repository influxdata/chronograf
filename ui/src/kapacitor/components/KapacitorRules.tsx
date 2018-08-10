// Libraries
import React, {SFC} from 'react'
import {Link} from 'react-router'

// Components
import NoKapacitorError from 'src/shared/components/NoKapacitorError'
import KapacitorRulesTable from 'src/kapacitor/components/KapacitorRulesTable'
import TasksTable from 'src/kapacitor/components/TasksTable'
import {Panel} from 'src/reusable_ui'

// Types
import {Source, AlertRule} from 'src/types'

interface KapacitorRulesProps {
  source: Source
  rules: AlertRule[]
  hasKapacitor: boolean
  loading: boolean
  onDelete: (rule: AlertRule) => void
  onChangeRuleStatus: (rule: AlertRule) => void
}

const KapacitorRules: SFC<KapacitorRulesProps> = ({
  source,
  rules,
  hasKapacitor,
  loading,
  onDelete,
  onChangeRuleStatus,
}) => {
  if (loading || !hasKapacitor) {
    return (
      <Panel>
        <Panel.Header title="Alert Rules">
          <button className="btn btn-primary btn-sm disabled" disabled={true}>
            Create Rule
          </button>
        </Panel.Header>
        <Panel.Body>
          <div className="generic-empty-state">
            {!hasKapacitor ? (
              <NoKapacitorError source={source} />
            ) : (
              <p>Loading Rules...</p>
            )}
          </div>
        </Panel.Body>
      </Panel>
    )
  }

  const builderRules = rules.filter((r: AlertRule) => r.query)

  const builderHeader = `${builderRules.length} Alert Rule${
    builderRules.length === 1 ? '' : 's'
  }`
  const scriptsHeader = `${rules.length} TICKscript${
    rules.length === 1 ? '' : 's'
  }`

  return (
    <>
      <Panel>
        <Panel.Header title={builderHeader}>
          <Link
            to={`/sources/${source.id}/alert-rules/new`}
            className="btn btn-sm btn-primary"
            style={{marginRight: '4px'}}
          >
            <span className="icon plus" /> Build Alert Rule
          </Link>
        </Panel.Header>
        <Panel.Body>
          <KapacitorRulesTable
            source={source}
            rules={builderRules}
            onDelete={onDelete}
            onChangeRuleStatus={onChangeRuleStatus}
          />
        </Panel.Body>
      </Panel>
      <Panel>
        <Panel.Header title={scriptsHeader}>
          <Link
            to={`/sources/${source.id}/tickscript/new`}
            className="btn btn-sm btn-success"
            style={{marginRight: '4px'}}
          >
            <span className="icon plus" /> Write TICKscript
          </Link>
        </Panel.Header>
        <Panel.Body>
          <TasksTable
            source={source}
            tasks={rules}
            onDelete={onDelete}
            onChangeRuleStatus={onChangeRuleStatus}
          />
        </Panel.Body>
      </Panel>
    </>
  )
}

export default KapacitorRules
