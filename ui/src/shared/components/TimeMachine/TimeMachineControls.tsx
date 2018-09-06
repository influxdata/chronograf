// Libraries
import React, {SFC} from 'react'

// Components
import SourceSelector from 'src/dashboards/components/SourceSelector'
import TimeRangeDropdown from 'src/shared/components/TimeRangeDropdown'
import CSVExporter from 'src/shared/components/TimeMachine/CSVExporter'
import AutoRefreshDropdown from 'src/shared/components/dropdown_auto_refresh/AutoRefreshDropdown'
import {SlideToggle, ComponentSize} from 'src/reusable_ui'

// Utils
import buildQueries from 'src/utils/buildQueriesForGraphs'

// Types
import * as QueriesModels from 'src/types/queries'
import * as SourcesModels from 'src/types/sources'
import {Service, Template} from 'src/types'

enum VisType {
  Graph,
  Table,
}

interface Props {
  isInCEO: boolean
  source: SourcesModels.Source
  sources: SourcesModels.SourceOption[]
  service: Service
  services: Service[]
  isDynamicSourceSelected: boolean
  onChangeService: (service: Service, source: SourcesModels.Source) => void
  autoRefreshDuration: number
  onChangeAutoRefreshDuration: (newDuration: number) => void
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
  visType,
  templates,
  isInCEO,
  services,
  timeRange,
  isFluxSource,
  toggleVisType,
  autoRefreshDuration,
  onChangeAutoRefreshDuration,
  onChangeService,
  onSelectDynamicSource,
  isDynamicSourceSelected,
  updateEditorTimeRange,
}) => {
  const timeRangePage = isInCEO ? null : 'DataExplorer'

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
      {isFluxSource && (
        <div className="time-machine-vis--raw-toggle">
          <SlideToggle
            active={visType === VisType.Table}
            onChange={toggleVisType}
            size={ComponentSize.ExtraSmall}
          />
          View Raw Data
        </div>
      )}
      <CSVExporter
        queries={buildQueries(queries, timeRange)}
        templates={templates}
      />
      <AutoRefreshDropdown
        selected={autoRefreshDuration}
        onChoose={onChangeAutoRefreshDuration}
        showManualRefresh={false}
      />
      <TimeRangeDropdown
        onChooseTimeRange={updateEditorTimeRange}
        selected={timeRange}
        page={timeRangePage}
      />
    </div>
  )
}

export default TimeMachineControls
