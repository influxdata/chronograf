import React, {SFC} from 'react'
import _ from 'lodash'

import EmptyQuery from 'src/shared/components/EmptyQuery'
import QueryTabList from 'src/shared/components/QueryTabList'
import InfluxQLEditor from 'src/dashboards/components/InfluxQLEditor'
import SchemaExplorer from 'src/shared/components/SchemaExplorer'

import {buildText, rawTextBinder} from 'src/dashboards/utils/queryMaker'

import {QueryConfig, Source, TimeRange, Template} from 'src/types'
import {CellEditorOverlayActions} from 'src/dashboards/components/CellEditorOverlay'

interface Props {
  source: Source
  queries: QueryConfig[]
  timeRange: TimeRange
  actions: CellEditorOverlayActions
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
}) => (
  <div className="query-maker query-maker--panel">
    <QueryTabList
      queries={queries}
      timeRange={timeRange}
      onAddQuery={onAddQuery}
      onDeleteQuery={onDeleteQuery}
      activeQueryIndex={activeQueryIndex}
      setActiveQueryIndex={setActiveQueryIndex}
    />
    {activeQuery && activeQuery.id ? (
      <div className="query-maker--tab-contents">
        <InfluxQLEditor
          query={buildText(activeQuery)}
          config={activeQuery}
          onUpdate={rawTextBinder(
            source,
            activeQuery.id,
            actions.editRawTextAsync
          )}
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
    ) : (
      <EmptyQuery onAddQuery={onAddQuery} />
    )}
  </div>
)

export default QueryMaker
