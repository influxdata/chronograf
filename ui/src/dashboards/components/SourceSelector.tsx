import React, {SFC} from 'react'

import SourceDropdown from 'src/flux/components/SourceDropdown'

import * as QueriesModels from 'src/types/queries'
import * as SourcesModels from 'src/types/sources'
import * as ServicesModels from 'src/types/services'

interface Props {
  source: SourcesModels.Source
  sources: SourcesModels.SourceOption[]
  service: ServicesModels.Service
  services: ServicesModels.Service[]
  queries: QueriesModels.QueryConfig[]
  onChangeService: (
    service: ServicesModels.Service,
    source: SourcesModels.Source
  ) => void
}

const SourceSelector: SFC<Props> = ({
  source,
  sources = [],
  service,
  services,
  queries,
  onChangeService,
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
        onChangeService={onChangeService}
      />
    </div>
  ) : (
    <div className="source-selector" />
  )
}

export default SourceSelector
