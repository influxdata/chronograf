// Libraries
import React, {SFC} from 'react'
import _ from 'lodash'
import {Subscribe} from 'unstated'

// Components
import EmptyQuery from 'src/shared/components/EmptyQuery'
import QueryTabList from 'src/shared/components/QueryTabList'
import InfluxQLEditor from 'src/dashboards/components/InfluxQLEditor'
import SchemaExplorer from 'src/shared/components/SchemaExplorer'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'

// Utils
import {TimeMachineContainer} from 'src/shared/utils/TimeMachineContainer'
import {buildQuery} from 'src/utils/influxql'
import {TYPE_QUERY_CONFIG} from 'src/dashboards/constants'
import {AUTO_GROUP_BY} from 'src/shared/constants'

// Types
import {QueryConfig, Source, TimeRange, Template} from 'src/types'

const buildText = (q: QueryConfig): string => {
  return q.rawText || buildQuery(TYPE_QUERY_CONFIG, q.range, q) || ''
}

interface ConnectedProps {
  timeRange: TimeRange
  onFill: TimeMachineContainer['handleFill']
  onTimeShift: TimeMachineContainer['handleTimeShift']
  onChooseTag: TimeMachineContainer['handleChooseTag']
  onGroupByTag: TimeMachineContainer['handleGroupByTag']
  onGroupByTime: TimeMachineContainer['handleGroupByTime']
  onToggleField: TimeMachineContainer['handleToggleField']
  onRemoveFuncs: TimeMachineContainer['handleRemoveFuncs']
  onAddInitialField: TimeMachineContainer['handleAddInitialField']
  onChooseNamespace: TimeMachineContainer['handleChooseNamespace']
  onChooseMeasurement: TimeMachineContainer['handleChooseMeasurement']
  onApplyFuncsToField: TimeMachineContainer['handleApplyFuncsToField']
  onToggleTagAcceptance: TimeMachineContainer['handleToggleTagAcceptance']
}

interface PassedProps {
  source: Source
  queries: QueryConfig[]
  setActiveQueryIndex: (index: number) => void
  activeQueryIndex: number
  activeQuery: QueryConfig
  templates: Template[]
  onAddQuery: () => void
  onDeleteQuery: (index: number) => void
  onEditRawText: (text: string) => Promise<void>
}

type Props = ConnectedProps & PassedProps

const QueryMaker: SFC<Props> = ({
  source,
  queries,
  timeRange,
  templates,
  onAddQuery,
  activeQuery,
  onDeleteQuery,
  activeQueryIndex,
  setActiveQueryIndex,
  onEditRawText,
  onFill,
  onTimeShift,
  onChooseTag,
  onGroupByTag,
  onGroupByTime,
  onToggleField,
  onRemoveFuncs,
  onAddInitialField,
  onChooseNamespace,
  onChooseMeasurement,
  onApplyFuncsToField,
  onToggleTagAcceptance,
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
            onUpdate={onEditRawText}
            templates={templates}
          />
          <SchemaExplorer
            source={source}
            query={activeQuery}
            initialGroupByTime={AUTO_GROUP_BY}
            isQuerySupportedByExplorer={_.get(
              activeQuery,
              'isQuerySupportedByExplorer',
              true
            )}
            onFill={onFill}
            onTimeShift={onTimeShift}
            onChooseTag={onChooseTag}
            onGroupByTag={onGroupByTag}
            onGroupByTime={onGroupByTime}
            onToggleField={onToggleField}
            onRemoveFuncs={onRemoveFuncs}
            onAddInitialField={onAddInitialField}
            onChooseNamespace={onChooseNamespace}
            onChooseMeasurement={onChooseMeasurement}
            onApplyFuncsToField={onApplyFuncsToField}
            onToggleTagAcceptance={onToggleTagAcceptance}
          />
        </div>
      </div>
    </FancyScrollbar>
  )
}

const ConnectedQueryMaker = (props: PassedProps) => (
  <Subscribe to={[TimeMachineContainer]}>
    {(container: TimeMachineContainer) => (
      <QueryMaker
        {...props}
        timeRange={container.state.timeRange}
        onFill={container.handleFill}
        onTimeShift={container.handleTimeShift}
        onChooseTag={container.handleChooseTag}
        onGroupByTag={container.handleGroupByTag}
        onGroupByTime={container.handleGroupByTime}
        onToggleField={container.handleToggleField}
        onRemoveFuncs={container.handleRemoveFuncs}
        onAddInitialField={container.handleAddInitialField}
        onChooseNamespace={container.handleChooseNamespace}
        onChooseMeasurement={container.handleChooseMeasurement}
        onApplyFuncsToField={container.handleApplyFuncsToField}
        onToggleTagAcceptance={container.handleToggleTagAcceptance}
      />
    )}
  </Subscribe>
)

export default ConnectedQueryMaker
