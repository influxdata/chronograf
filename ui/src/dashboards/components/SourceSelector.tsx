// Libraries
import React, {SFC} from 'react'

// Componentes
import SourceDropdown from 'src/flux/components/SourceDropdown'

// Types
import * as QueriesModels from 'src/types/queries'
import * as SourcesModels from 'src/types/sources'
import {Service} from 'src/types'

interface Props {
  source: SourcesModels.Source
  sources: SourcesModels.SourceOption[]
  service: Service
  services: Service[]
  queries: QueriesModels.QueryConfig[]
  isDynamicSourceSelected: boolean
  onChangeService: (service: Service, source: SourcesModels.Source) => void
}

const SourceSelector: SFC<Props> = ({
  source,
  sources = [],
  service,
  services,
  queries,
  onChangeService,
  isDynamicSourceSelected,
}) => {
  return sources.length > 1 && queries.length ? (
    <div className="source-selector">
      <h3>Source:</h3>
      <SourceDropdown
        service={service}
        services={services}
        source={source}
        sources={sources}
        allowInfluxQL={true}
        // TODO: when flux is added into CEO/DE, change to true
        allowFlux={false}
        allowDynamicSource={true}
        isDynamicSourceSelected={isDynamicSourceSelected}
        onChangeService={onChangeService}
      />
    </div>
  ) : (
    <div className="source-selector" />
  )
}

export default SourceSelector
