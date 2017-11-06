import * as React from 'react'
import * as PropTypes from 'prop-types'
import {Link} from 'react-router-dom'
import * as _ from 'lodash'

import {KAPACITOR_RULES_TABLE} from 'kapacitor/constants/tableSizing'
const {
  colName,
  colTrigger,
  colMessage,
  colAlerts,
  colEnabled,
  colActions,
} = KAPACITOR_RULES_TABLE

const KapacitorRulesTable = ({rules, source, onDelete, onChangeRuleStatus}) =>
  <div className="panel-body">
    <table className="table v-center">
      <thead>
        <tr>
          <th style={{width: colName}}>Name</th>
          <th style={{width: colTrigger}}>Rule Trigger</th>
          <th style={{width: colMessage}}>Message</th>
          <th style={{width: colAlerts}}>Alerts</th>
          <th style={{width: colEnabled}} className="text-center">
            Enabled
          </th>
          <th style={{width: colActions}} />
        </tr>
      </thead>
      <tbody>
        {_.sortBy(rules, r => r.name.toLowerCase()).map(rule => {
          return (
            <RuleRow
              key={rule.id}
              rule={rule}
              source={source}
              onDelete={onDelete}
              onChangeRuleStatus={onChangeRuleStatus}
            />
          )
        })}
      </tbody>
    </table>
  </div>

const handleDelete = (rule, onDelete) => onDelete(rule)

const RuleRow = ({rule, source, onDelete, onChangeRuleStatus}) =>
  <tr key={rule.id}>
    <td style={{width: colName}} className="monotype">
      <RuleTitle rule={rule} source={source} />
    </td>
    <td style={{width: colTrigger}} className="monotype">
      {rule.trigger}
    </td>
    <td className="monotype">
      <span
        className="table-cell-nowrap"
        style={{display: 'inline-block', maxWidth: colMessage}}
      >
        {rule.message}
      </span>
    </td>
    <td style={{width: colAlerts}} className="monotype">
      {rule.alerts.join(', ')}
    </td>
    <td style={{width: colEnabled}} className="monotype text-center">
      <div className="dark-checkbox">
        <input
          id={`kapacitor-enabled ${rule.id}`}
          className="form-control-static"
          type="checkbox"
          defaultChecked={rule.status === 'enabled'}
          onClick={onChangeRuleStatus(rule)}
        />
        <label htmlFor={`kapacitor-enabled ${rule.id}`} />
      </div>
    </td>
    <td style={{width: colActions}} className="text-right table-cell-nowrap">
      <Link
        className="btn btn-info btn-xs"
        to={`/sources/${source.id}/tickscript/${rule.id}`}
      >
        Edit TICKscript
      </Link>
      <button
        className="btn btn-danger btn-xs"
        onClick={handleDelete(rule, onDelete)}
      >
        Delete
      </button>
    </td>
  </tr>

const RuleTitle = ({rule: {id, name, query}, source}) => {
  // no queryConfig means the rule was manually created outside of Chronograf
  if (!query) {
    return (
      <i>
        {name}
      </i>
    )
  }

  return (
    <Link to={`/sources/${source.id}/alert-rules/${id}`}>
      {name}
    </Link>
  )
}

const {arrayOf, func, shape, string} = PropTypes

KapacitorRulesTable.propTypes = {
  rules: arrayOf(shape()),
  onChangeRuleStatus: func,
  onDelete: func,
  source: shape({
    id: string.isRequired,
  }).isRequired,
}

RuleRow.propTypes = {
  rule: shape(),
  source: shape(),
  onChangeRuleStatus: func,
  onDelete: func,
}

RuleTitle.propTypes = {
  rule: shape({
    name: string.isRequired,
    query: shape(),
    links: shape({
      self: string.isRequired,
    }),
  }),
  source: shape({
    id: string.isRequired,
  }).isRequired,
}

export default KapacitorRulesTable
