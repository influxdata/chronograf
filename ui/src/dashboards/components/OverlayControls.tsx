import React, {SFC} from 'react'

import ConfirmOrCancel from 'src/shared/components/ConfirmOrCancel'
import SourceSelector from 'src/dashboards/components/SourceSelector'
import RadioButtons from 'src/reusable_ui/components/radio_buttons/RadioButtons'
import {ButtonShape} from 'src/reusable_ui/types'

import {CEOTabs} from 'src/dashboards/constants'

import * as QueriesModels from 'src/types/queries'
import * as SourcesModels from 'src/types/sources'
import * as ServicesModels from 'src/types/services'

interface Props {
  onCancel: () => void
  onSave: () => void
  activeEditorTab: CEOTabs
  onSetActiveEditorTab: (tabName: CEOTabs) => void
  isSavable: boolean
  source: SourcesModels.Source
  sources: SourcesModels.SourceOption[]
  service: ServicesModels.Service
  services: ServicesModels.Service[]
  onChangeService: (
    service: ServicesModels.Service,
    source: SourcesModels.Source
  ) => void
  queries: QueriesModels.QueryConfig[]
}

const OverlayControls: SFC<Props> = ({
  onSave,
  source,
  sources,
  service,
  queries,
  services,
  onCancel,
  isSavable,
  onChangeService,
  activeEditorTab,
  onSetActiveEditorTab,
}) => {
  return (
    <div className="overlay-controls">
      <SourceSelector
        source={source}
        sources={sources}
        service={service}
        services={services}
        queries={queries}
        onChangeService={onChangeService}
      />
      <div className="overlay-controls--tabs">
        <RadioButtons
          activeButton={activeEditorTab}
          buttons={[CEOTabs.Queries, CEOTabs.Vis]}
          onChange={onSetActiveEditorTab}
          shape={ButtonShape.StretchToFit}
        />
      </div>
      <div className="overlay-controls--right">
        <ConfirmOrCancel
          onCancel={onCancel}
          onConfirm={onSave}
          isDisabled={!isSavable}
        />
      </div>
    </div>
  )
}

export default OverlayControls
