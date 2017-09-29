import React, {PropTypes} from 'react'

import QueryTextArea from 'src/dashboards/components/QueryTextArea'
import SchemaExplorer from 'src/shared/components/SchemaExplorer'
import buildInfluxQLQuery from 'utils/influxql'

const TEMPLATE_RANGE = {upper: null, lower: ':dashboardTime:'}
const rawTextBinder = (links, id, action) => text =>
  action(links.queries, id, text)
const buildText = q =>
  q.rawText || buildInfluxQLQuery(q.range || TEMPLATE_RANGE, q) || ''

const QueryMaker = ({source: {links}, actions, query, templates, onAddQuery}) =>
  <div className="query-maker--tab-contents">
    <QueryTextArea
      query={buildText(query)}
      config={query}
      onUpdate={rawTextBinder(links, query.id, actions.editRawTextAsync)}
      templates={templates}
    />
    <SchemaExplorer query={query} actions={actions} onAddQuery={onAddQuery} />
  </div>

const {arrayOf, bool, func, number, shape, string} = PropTypes

QueryMaker.propTypes = {
  source: shape({
    links: shape({
      queries: string.isRequired,
    }).isRequired,
  }).isRequired,
  query: shape({}).isRequired,
  timeRange: shape({
    upper: string,
    lower: string,
  }).isRequired,
  isInDataExplorer: bool,
  actions: shape({
    chooseNamespace: func.isRequired,
    chooseMeasurement: func.isRequired,
    chooseTag: func.isRequired,
    groupByTag: func.isRequired,
    toggleField: func.isRequired,
    groupByTime: func.isRequired,
    toggleTagAcceptance: func.isRequired,
    fill: func,
    applyFuncsToField: func.isRequired,
    editRawTextAsync: func.isRequired,
  }).isRequired,
  setActiveQueryIndex: func.isRequired,
  onDeleteQuery: func.isRequired,
  activeQueryIndex: number,
  activeQuery: shape({}),
  onAddQuery: func.isRequired,
  templates: arrayOf(
    shape({
      tempVar: string.isRequired,
    })
  ).isRequired,
}

export default QueryMaker
