// Libraries
import React, {SFC} from 'react'

// Components
import SourceDropdown from 'src/flux/components/SourceDropdown'
import {Radio} from 'src/reusable_ui'
import QuestionMarkTooltip from 'src/shared/components/QuestionMarkTooltip'

// Types
import * as QueriesModels from 'src/types/queries'
import * as SourcesModels from 'src/types/sources'
import {QueryType} from 'src/types'

interface Props {
  source: SourcesModels.Source
  sources: SourcesModels.SourceOption[]
  isFluxSelected: boolean
  sourceSupportsFlux: boolean
  queries: QueriesModels.QueryConfig[]
  isDynamicSourceSelected: boolean
  toggleFlux: (queryType: QueryType) => void
  onSelectDynamicSource: () => void
  onChangeSource: (source: SourcesModels.Source, type: QueryType) => void
}

const SourceSelector: SFC<Props> = ({
  source,
  sources = [],
  queries,
  toggleFlux,
  isFluxSelected,
  onChangeSource,
  sourceSupportsFlux,
  isDynamicSourceSelected,
  onSelectDynamicSource,
}) => {
  if (!sources.length || !queries.length) {
    return <div className="source-selector" />
  }

  const type = isFluxSelected ? QueryType.Flux : QueryType.InfluxQL

  return (
    <div className="source-selector">
      <SourceDropdown
        source={source}
        type={type}
        sources={sources}
        allowDynamicSource={true}
        isDynamicSourceSelected={isDynamicSourceSelected}
        onChangeSource={onChangeSource}
        onSelectDynamicSource={onSelectDynamicSource}
      />
      <Radio>
        <Radio.Button
          id="influxql-source"
          titleText="InfluxQL"
          value={QueryType.InfluxQL}
          onClick={toggleFlux}
          active={!isFluxSelected}
          disabled={!sourceSupportsFlux}
        >
          InfluxQL
        </Radio.Button>
        <Radio.Button
          id="flux-source"
          titleText="Flux"
          value={QueryType.Flux}
          onClick={toggleFlux}
          active={isFluxSelected}
          disabled={!sourceSupportsFlux}
        >
          Flux
        </Radio.Button>
      </Radio>
      {!sourceSupportsFlux && (
        <QuestionMarkTooltip
          tipID="token"
          tipContent={`<p>The current source does not support Flux.</p>`}
        />
      )}
    </div>
  )
}

export default SourceSelector
