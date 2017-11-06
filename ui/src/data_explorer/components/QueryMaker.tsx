import * as React from 'react'
import * as PropTypes from 'prop-types'

import QueryEditor from './QueryEditor'
import SchemaExplorer from 'shared/components/SchemaExplorer'
import {buildRawText} from 'utils/influxql'

const rawTextBinder = (links, id, action) => text =>
  action(links.queries, id, text)

const QueryMaker = ({
  source,
  actions,
  timeRange,
  activeQuery,
  initialGroupByTime,
}) =>
  <div className="query-maker query-maker--panel">
    <div className="query-maker--tab-contents">
      <QueryEditor
        query={buildRawText(activeQuery, timeRange)}
        config={activeQuery}
        onUpdate={rawTextBinder(
          source.links,
          activeQuery.id,
          actions.editRawTextAsync
        )}
      />
      <SchemaExplorer
        initialGroupByTime={initialGroupByTime}
        query={activeQuery}
        actions={actions}
      />
    </div>
  </div>

const {func, shape, string} = PropTypes

QueryMaker.propTypes = {
  source: shape({
    links: shape({
      queries: string.isRequired,
    }).isRequired,
  }).isRequired,
  timeRange: shape({
    upper: string,
    lower: string,
  }).isRequired,
  actions: shape({
    chooseNamespace: func.isRequired,
    chooseMeasurement: func.isRequired,
    chooseTag: func.isRequired,
    groupByTag: func.isRequired,
    addQuery: func.isRequired,
    toggleField: func.isRequired,
    groupByTime: func.isRequired,
    toggleTagAcceptance: func.isRequired,
    applyFuncsToField: func.isRequired,
    editRawTextAsync: func.isRequired,
    addInitialField: func.isRequired,
  }).isRequired,
  activeQuery: shape({}),
  initialGroupByTime: string.isRequired,
}

export default QueryMaker
