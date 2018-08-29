// Libraries
import React, {SFC} from 'react'
import _ from 'lodash'

// Components
import EmptyQuery from 'src/shared/components/EmptyQuery'
import QueryTabList from 'src/shared/components/QueryTabList'
import InfluxQLEditor from 'src/dashboards/components/InfluxQLEditor'
import SchemaExplorer from 'src/shared/components/SchemaExplorer'
import {buildQuery} from 'src/utils/influxql'
import {TYPE_QUERY_CONFIG} from 'src/dashboards/constants'
import {TEMPLATE_RANGE} from 'src/tempVars/constants'

// Types
import {QueryConfig, Source, TimeRange, Template} from 'src/types'
import {QueryConfigActions} from 'src/dashboards/actions/cellEditorOverlay'

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
}

const QueryMaker: SFC<Props> = ({
  source,
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
        />
      </div>
    </div>
  )
}

export default QueryMaker
