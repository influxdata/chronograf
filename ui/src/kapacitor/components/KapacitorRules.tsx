import * as React from 'react'
import {Link} from 'react-router-dom'

import NoKapacitorError from 'shared/components/NoKapacitorError'
import SourceIndicator from 'shared/components/SourceIndicator'
import KapacitorRulesTable from 'kapacitor/components/KapacitorRulesTable'
import TasksTable from 'kapacitor/components/TasksTable'
import FancyScrollbar from 'shared/components/FancyScrollbar'

import {Rule, Source} from 'src/types'

export interface KapacitorRulesProps {
  source: Source
  rules: Rule[]
  hasKapacitor: boolean
  loading: boolean
  onDelete: () => void
  onChangeRuleStatus: () => void
}

const KapacitorRules: React.SFC<KapacitorRulesProps> = ({
  source,
  rules,
  hasKapacitor,
  loading,
  onDelete,
  onChangeRuleStatus,
}) => {
  if (loading) {
    return (
      <PageContents source={source}>
        <div className="panel-heading u-flex u-ai-center u-jc-space-between">
          <h2 className="panel-title">Alert Rules</h2>
          <button className="btn btn-primary btn-sm disabled" disabled={true}>
            Create Rule
          </button>
        </div>
        <div className="panel-body">
          <div className="generic-empty-state">
            <p>Loading Rules...</p>
          </div>
        </div>
      </PageContents>
    )
  }

  if (!hasKapacitor) {
    return (
      <PageContents source={source}>
        <NoKapacitorError source={source} />
      </PageContents>
    )
  }

  const rulez = rules.filter(r => r.query)
  const tasks = rules.filter(r => !r.query)

  const rHeader = `${rulez.length} Alert Rule${rulez.length === 1 ? '' : 's'}`
  const tHeader = `${tasks.length} TICKscript${tasks.length === 1 ? '' : 's'}`

  return (
    <PageContents source={source}>
      <div className="panel-heading u-flex u-ai-center u-jc-space-between">
        <h2 className="panel-title">{rHeader}</h2>
        <div className="u-flex u-ai-center u-jc-space-between">
          <Link
            to={`/sources/${source.id}/alert-rules/new`}
            className="btn btn-sm btn-primary"
            style={{marginRight: '4px'}}
          >
            <span className="icon plus" /> Build Rule
          </Link>
        </div>
      </div>
      <KapacitorRulesTable
        source={source}
        rules={rulez}
        onDelete={onDelete}
        onChangeRuleStatus={onChangeRuleStatus}
      />

      <div className="row">
        <div className="col-md-12">
          <div className="panel panel-minimal">
            <div className="panel-heading u-flex u-ai-center u-jc-space-between">
              <h2 className="panel-title">{tHeader}</h2>
              <div className="u-flex u-ai-center u-jc-space-between">
                <Link
                  to={`/sources/${source.id}/tickscript/new`}
                  className="btn btn-sm btn-info"
                >
                  Write TICKscript
                </Link>
              </div>
            </div>
            <TasksTable
              source={source}
              tasks={tasks}
              onDelete={onDelete}
              onChangeRuleStatus={onChangeRuleStatus}
            />
          </div>
        </div>
      </div>
    </PageContents>
  )
}

export interface PageContentsProps {
  source: Source
}

const PageContents: React.SFC<PageContentsProps> = ({source, children}) => (
  <div className="page">
    <div className="page-header">
      <div className="page-header__container">
        <div className="page-header__left">
          <h1 className="page-header__title">
            Build Alert Rules or Write TICKscripts
          </h1>
        </div>
        <div className="page-header__right">
          <SourceIndicator source={source} />
        </div>
      </div>
    </div>
    <FancyScrollbar className="page-contents fancy-scroll--kapacitor">
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12">
            <div className="panel panel-minimal">{children}</div>
          </div>
        </div>
      </div>
    </FancyScrollbar>
  </div>
)

export default KapacitorRules
