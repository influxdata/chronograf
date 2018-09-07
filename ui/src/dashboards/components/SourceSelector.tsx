// Libraries
import React, {SFC} from 'react'

// Componentes
import SourceDropdown from 'src/flux/components/SourceDropdown'
import {Radio} from 'src/reusable_ui'

// Types
import * as QueriesModels from 'src/types/queries'
import * as SourcesModels from 'src/types/sources'
import {Service} from 'src/types'

interface Props {
  source: SourcesModels.Source
  sources: SourcesModels.SourceOption[]
  service: Service
  services: Service[]
  isFluxSource: boolean
  queries: QueriesModels.QueryConfig[]
  isDynamicSourceSelected: boolean
  toggleFlux: () => void
  onSelectDynamicSource: () => void
  onChangeService: (service: Service, source: SourcesModels.Source) => void
}

const SourceSelector: SFC<Props> = ({
  source,
  sources = [],
  service,
  services,
  queries,
  toggleFlux,
  isFluxSource,
  onChangeService,
  isDynamicSourceSelected,
  onSelectDynamicSource,
}) => {
  if (!sources.length || !queries.length) {
    return <div className="source-selector" />
  }

  return (
    <div className="source-selector">
      <SourceDropdown
        service={service}
        services={services}
        source={source}
        sources={sources}
        allowInfluxQL={true}
        allowFlux={true}
        allowDynamicSource={true}
        isDynamicSourceSelected={isDynamicSourceSelected}
        onChangeService={onChangeService}
        onSelectDynamicSource={onSelectDynamicSource}
      />
      {isDynamicSourceSelected && (
        <Radio>
          <Radio.Button
            id="flux-source"
            titleText="Flux"
            value="Flux"
            onClick={toggleFlux}
            active={isFluxSource}
          >
            Flux
          </Radio.Button>
          <Radio.Button
            id="influxql-source"
            titleText="InfluxQL"
            value="InfluxQL"
            onClick={toggleFlux}
            active={!isFluxSource}
          >
            InfluxQL
          </Radio.Button>
        </Radio>
      )}
    </div>
  )
}

export default SourceSelector
