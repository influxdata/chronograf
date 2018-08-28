// Libraries
import React, {SFC} from 'react'

// Components
import SourceSelector from 'src/dashboards/components/SourceSelector'
import TimeRangeDropdown from 'src/shared/components/TimeRangeDropdown'
import CSVExporter from 'src/shared/components/TimeMachine/CSVExporter'

// Utils
import buildQueries from 'src/utils/buildQueriesForGraphs'

// Types
import * as QueriesModels from 'src/types/queries'
import * as SourcesModels from 'src/types/sources'
import {Service, Template} from 'src/types'

interface Props {
  source: SourcesModels.Source
  sources: SourcesModels.SourceOption[]
  service: Service
  services: Service[]
  isDynamicSourceSelected: boolean
  onChangeService: (service: Service, source: SourcesModels.Source) => void
  queries: QueriesModels.QueryConfig[]
  templates: Template[]
  onSelectDynamicSource: () => void
  timeRange: QueriesModels.TimeRange
  updateEditorTimeRange: (timeRange: QueriesModels.TimeRange) => void
}

const TimeMachineControls: SFC<Props> = ({
  source,
  sources,
  service,
  queries,
  templates,
  services,
  timeRange,
  onChangeService,
  onSelectDynamicSource,
  isDynamicSourceSelected,
  updateEditorTimeRange,
}) => {
  return (
    <div className="deceo--controls">
      <SourceSelector
        source={source}
        sources={sources}
        service={service}
        services={services}
        queries={queries}
        onChangeService={onChangeService}
        isDynamicSourceSelected={isDynamicSourceSelected}
        onSelectDynamicSource={onSelectDynamicSource}
      />
      <CSVExporter
        queries={buildQueries(queries, timeRange)}
        templates={templates}
      />
      <TimeRangeDropdown
        onChooseTimeRange={updateEditorTimeRange}
        selected={timeRange}
      />
    </div>
  )
}

export default TimeMachineControls
