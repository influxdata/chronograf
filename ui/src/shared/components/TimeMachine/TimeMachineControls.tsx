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
import {Template, QueryType} from 'src/types'

// Constants
import {AutoRefreshOption} from 'src/shared/components/dropdown_auto_refresh/autoRefreshOptions'

interface Props {
  isFluxSelected: boolean
  source: SourcesModels.Source
  sources: SourcesModels.SourceOption[]
  script: string
  isViewingRawData: boolean
  isDynamicSourceSelected: boolean
  onChangeSource: (source: SourcesModels.Source, type: QueryType) => void
  autoRefreshDuration: number
  onChangeAutoRefreshDuration: (autoRefreshOption: AutoRefreshOption) => void
  queries: QueriesModels.QueryConfig[]
  templates: Template[]
  sourceSupportsFlux: boolean
  onSelectDynamicSource: () => void
  timeRange: QueriesModels.TimeRange
  updateEditorTimeRange: (timeRange: QueriesModels.TimeRange) => void
  toggleFlux: (queryType: QueryType) => void
  toggleIsViewingRawData: () => void
  onManualRefresh: () => void
}

const TimeMachineControls: SFC<Props> = ({
  script,
  source,
  sources,
  queries,
  templates,
  timeRange,
  toggleFlux,
  isFluxSelected,
  isViewingRawData,
  autoRefreshDuration,
  onChangeAutoRefreshDuration,
  onManualRefresh,
  onChangeSource,
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
        queries={queries}
        toggleFlux={toggleFlux}
        sourceSupportsFlux={sourceSupportsFlux}
        isFluxSelected={isFluxSelected}
        onChangeSource={onChangeSource}
        isDynamicSourceSelected={isDynamicSourceSelected}
        onSelectDynamicSource={onSelectDynamicSource}
      />
      {isFluxSelected && (
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
        source={source}
        isFluxSelected={isFluxSelected}
        queries={buildQueries(queries, timeRange)}
        templates={templates}
        timeRange={timeRange}
      />
      <AutoRefreshDropdown
        selected={autoRefreshDuration}
        onChoose={onChangeAutoRefreshDuration}
        onManualRefresh={onManualRefresh}
        showManualRefresh={true}
      />
      <TimeRangeDropdown
        onChooseTimeRange={updateEditorTimeRange}
        selected={timeRange}
      />
    </div>
  )
}

export default TimeMachineControls
