import * as React from 'react'

import QueryEditor from './QueryEditor'
import SchemaExplorer from 'shared/components/SchemaExplorer'
import {buildRawText} from 'utils/influxql'
import {QueryConfig, Source, TimeRange} from 'src/types'
import {QueryConfigActions} from '../containers/DataExplorer'

export interface QueryMakerProps {
  source: Source
  timeRange: TimeRange
  actions: QueryConfigActions
  activeQuery?: QueryConfig
  initialGroupByTime: string
}

const rawTextBinder = (links, id, action) => text =>
  action(links.queries, id, text)

const QueryMaker: React.SFC<QueryMakerProps> = ({
  source,
  actions,
  timeRange,
  activeQuery,
  initialGroupByTime,
}) => (
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
        source={source}
      />
    </div>
  </div>
)

export default QueryMaker
