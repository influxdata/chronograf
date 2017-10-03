import React, {PropTypes} from 'react'

import QueryEditor from './QueryEditor'
import SchemaExplorer from 'src/shared/components/SchemaExplorer'
import buildInfluxQLQuery from 'utils/influxql'

const rawTextBinder = (links, id, action) => text =>
  action(links.queries, id, text)

const buildText = (q, timeRange) =>
  q.rawText || buildInfluxQLQuery(timeRange, q) || ''

const QueryMaker = ({query, source, actions, timeRange}) =>
  <div className="query-maker--tab-contents">
    <QueryEditor
      query={buildText(query, timeRange)}
      config={query}
      onUpdate={rawTextBinder(source.links, query.id, actions.editRawTextAsync)}
    />
    <SchemaExplorer query={query} actions={actions} />
  </div>

const {func, number, shape, string} = PropTypes

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
  actions: shape({
    chooseNamespace: func.isRequired,
    chooseMeasurement: func.isRequired,
    chooseTag: func.isRequired,
    groupByTag: func.isRequired,
    toggleField: func.isRequired,
    groupByTime: func.isRequired,
    toggleTagAcceptance: func.isRequired,
    applyFuncsToField: func.isRequired,
    editRawTextAsync: func.isRequired,
  }).isRequired,
  activeQuery: shape({}),
  activeQueryIndex: number,
}

export default QueryMaker
