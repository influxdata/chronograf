// Libraries
import React, {FunctionComponent} from 'react'

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

function fluxDisabledTooltip(source: SourcesModels.Source): string {
  // if source is version 2, recommend InfluxDB v2 authentication
  if (!source.version || source.version.startsWith('2.')) {
    return 'To enable Flux modify the connection to use InfluxDB v2 Auth with an organization and a token.'
  }
  return `The current source does not support Flux.<br>
  See <a href="https://docs.influxdata.com/influxdb/v1.8/flux/installation/" 
  target="_blank">https://docs.influxdata.com/influxdb/v1.8/flux/installation/</a>`
}

const SourceSelector: FunctionComponent<Props> = ({
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
    <div className="source-selector" data-test="source-button-selector">
      <SourceDropdown
        source={source}
        type={type}
        sources={sources}
        allowDynamicSource={true}
        isDynamicSourceSelected={isDynamicSourceSelected}
        onChangeSource={onChangeSource}
        onSelectDynamicSource={onSelectDynamicSource}
        widthPixels={250}
      />
      <Radio>
        <Radio.Button
          id="influxql-source"
          titleText="InfluxQL"
          value={QueryType.InfluxQL}
          onClick={toggleFlux}
          active={!isFluxSelected}
          disabled={!sourceSupportsFlux}
          disabledTitleText=""
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
          tipContent={`<p>${fluxDisabledTooltip(source)}</p>`}
        />
      )}
    </div>
  )
}

export default SourceSelector
