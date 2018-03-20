import React from 'react'
import PropTypes from 'prop-types'
import {Link} from 'react-router'

import NoKapacitorError from 'shared/components/NoKapacitorError'
import SourceIndicator from 'shared/components/SourceIndicator'
import KapacitorRulesTable from 'src/kapacitor/components/KapacitorRulesTable'
import TasksTable from 'src/kapacitor/components/TasksTable'
import FancyScrollbar from 'shared/components/FancyScrollbar'
import QuestionMarkTooltip from 'shared/components/QuestionMarkTooltip'

const KapacitorRules = ({
  source,
  rules,
  hasKapacitor,
  loading,
  onDelete,
  onChangeRuleStatus,
}) => {
  if (loading) {
    return (
      <PageContents>
        <div className="panel-heading">
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
      <PageContents>
        <NoKapacitorError source={source} />
      </PageContents>
    )
  }

  const builderRules = rules.filter(r => r.query)

  const builderHeader = `${builderRules.length} Alert Rule${
    builderRules.length === 1 ? '' : 's'
  }`
  const scriptsHeader = `${rules.length} TICKscript${
    rules.length === 1 ? '' : 's'
  }`

  return (
    <PageContents source={source}>
      <div className="panel">
        <div className="panel-heading">
          <h2 className="panel-title">{builderHeader}</h2>
          <Link
            to={`/sources/${source.id}/alert-rules/new`}
            className="btn btn-sm btn-primary"
            style={{marginRight: '4px'}}
          >
            <span className="icon plus" /> Build Alert Rule
          </Link>
        </div>
        <div className="panel-body">
          <KapacitorRulesTable
            source={source}
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
            to={`/sources/${source.id}/tickscript/new`}
            className="btn btn-sm btn-success"
            style={{marginRight: '4px'}}
          >
            <span className="icon plus" /> Write TICKscript
          </Link>
        </div>
        <div className="panel-body">
          <TasksTable
            source={source}
            tasks={rules}
            onDelete={onDelete}
            onChangeRuleStatus={onChangeRuleStatus}
          />
        </div>
      </div>
    </PageContents>
  )
}

const PageContents = ({children}) => (
  <div className="page">
    <div className="page-header">
      <div className="page-header__container">
        <div className="page-header__left">
          <h1 className="page-header__title">Manage Tasks</h1>
        </div>
        <div className="page-header__right">
          <QuestionMarkTooltip
            tipID="manage-tasks--tooltip"
            tipContent="<b>Alert Rules</b> generate a TICKscript for<br/>you using our Builder UI.<br/><br/>Not all TICKscripts can be edited<br/>using the Builder."
          />
          <SourceIndicator />
        </div>
      </div>
    </div>
    <FancyScrollbar className="page-contents fancy-scroll--kapacitor">
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12">{children}</div>
        </div>
      </div>
    </FancyScrollbar>
  </div>
)

const {arrayOf, bool, func, node, shape} = PropTypes

KapacitorRules.propTypes = {
  source: shape(),
  rules: arrayOf(shape()),
  hasKapacitor: bool,
  loading: bool,
  onChangeRuleStatus: func,
  onDelete: func,
}

PageContents.propTypes = {
  children: node,
  onCloseTickscript: func,
}

export default KapacitorRules
