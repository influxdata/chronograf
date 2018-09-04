// Libraries
import React, {SFC} from 'react'
import _ from 'lodash'

// Components
import EmptyQuery from 'src/shared/components/EmptyQuery'
import QueryTabList from 'src/shared/components/QueryTabList'
import InfluxQLEditor from 'src/dashboards/components/InfluxQLEditor'
import SchemaExplorer from 'src/shared/components/SchemaExplorer'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import {buildQuery} from 'src/utils/influxql'
import {TYPE_QUERY_CONFIG} from 'src/dashboards/constants'
import {TEMPLATE_RANGE} from 'src/tempVars/constants'

// Types
import {QueryConfig, Source, TimeRange, Template} from 'src/types'
import {QueryConfigActions} from 'src/shared/actions/queries'

const buildText = (q: QueryConfig): string =>
  q.rawText || buildQuery(TYPE_QUERY_CONFIG, q.range || TEMPLATE_RANGE, q) || ''

interface Props {
  source: Source
  queries: QueryConfig[]
  timeRange: TimeRange
  actions: QueryConfigActions
  setActiveQueryIndex: (index: number) => void
  onDeleteQuery: (index: number) => void
  activeQueryIndex: number
  activeQuery: QueryConfig
  onAddQuery: () => void
  templates: Template[]
  initialGroupByTime: string
  isInCEO: boolean
}

const QueryMaker: SFC<Props> = ({
  source,
  isInCEO,
  actions,
  queries,
  timeRange,
  templates,
  onAddQuery,
  activeQuery,
  onDeleteQuery,
  activeQueryIndex,
  initialGroupByTime,
  setActiveQueryIndex,
}) => {
  if (!activeQuery || !activeQuery.id) {
    return (
      <div className="query-maker">
        <EmptyQuery onAddQuery={onAddQuery} />
      </div>
    )
  }

  return (
    <FancyScrollbar className="query-maker--container">
      <div className="query-maker">
        <QueryTabList
          queries={queries}
          timeRange={timeRange}
          onAddQuery={onAddQuery}
          onDeleteQuery={onDeleteQuery}
          activeQueryIndex={activeQueryIndex}
          setActiveQueryIndex={setActiveQueryIndex}
        />
        <div className="query-maker--tab-contents">
          <InfluxQLEditor
            query={buildText(activeQuery)}
            config={activeQuery}
            onUpdate={actions.editRawTextAsync}
            templates={templates}
          />
          <SchemaExplorer
            source={source}
            actions={actions}
            query={activeQuery}
            initialGroupByTime={initialGroupByTime}
            isQuerySupportedByExplorer={_.get(
              activeQuery,
              'isQuerySupportedByExplorer',
              true
            )}
            isInCEO={isInCEO}
          />
        </div>
      </div>
    </FancyScrollbar>
  )
}

export default QueryMaker
