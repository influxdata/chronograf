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

interface Props {
  isFluxSource: boolean
  source: SourcesModels.Source
  sources: SourcesModels.SourceOption[]
  service: Service
  services: Service[]
  script: string
  isViewingRawData: boolean
  isDynamicSourceSelected: boolean
  onChangeService: (service: Service, source: SourcesModels.Source) => void
  autoRefreshDuration: number
  onChangeAutoRefreshDuration: (newDuration: number) => void
  queries: QueriesModels.QueryConfig[]
  templates: Template[]
  sourceSupportsFlux: boolean
  onSelectDynamicSource: () => void
  timeRange: QueriesModels.TimeRange
  updateEditorTimeRange: (timeRange: QueriesModels.TimeRange) => void
  toggleFlux: () => void
  toggleIsViewingRawData: () => void
}

const TimeMachineControls: SFC<Props> = ({
  script,
  source,
  sources,
  service,
  queries,
  templates,
  services,
  timeRange,
  toggleFlux,
  isFluxSource,
  isViewingRawData,
  autoRefreshDuration,
  onChangeAutoRefreshDuration,
  onChangeService,
  sourceSupportsFlux,
  onSelectDynamicSource,
  toggleIsViewingRawData,
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
        toggleFlux={toggleFlux}
        sourceSupportsFlux={sourceSupportsFlux}
        isFluxSource={isFluxSource}
        onChangeService={onChangeService}
        isDynamicSourceSelected={isDynamicSourceSelected}
        onSelectDynamicSource={onSelectDynamicSource}
      />
      {isFluxSource && (
        <div className="time-machine-vis--raw-toggle">
          <SlideToggle
            active={isViewingRawData}
            onChange={toggleIsViewingRawData}
            size={ComponentSize.ExtraSmall}
          />
          View Raw Data
        </div>
      )}
      <CSVExporter
        script={script}
        service={service}
        isFluxSource={isFluxSource}
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
      />
    </div>
  )
}

export default TimeMachineControls
