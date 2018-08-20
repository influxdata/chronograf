import React, {SFC} from 'react'

import SourceSelector from 'src/dashboards/components/SourceSelector'

import * as QueriesModels from 'src/types/queries'
import * as SourcesModels from 'src/types/sources'
import {Service} from 'src/types'

interface Props {
  source: SourcesModels.Source
  sources: SourcesModels.SourceOption[]
  service: Service
  services: Service[]
  isDynamicSourceSelected: boolean
  onChangeService: (service: Service, source: SourcesModels.Source) => void
  queries: QueriesModels.QueryConfig[]
}

const TimeMachineControls: SFC<Props> = ({
  source,
  sources,
  service,
  queries,
  services,
  onChangeService,
  isDynamicSourceSelected,
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
      />
    </div>
  )
}

export default TimeMachineControls
