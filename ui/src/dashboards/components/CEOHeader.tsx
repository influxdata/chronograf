// Libraries
import React, {Component} from 'react'

// Components
import {RadioButtons, ButtonShape} from 'src/reusable_ui'
import VisualizationName from 'src/dashboards/components/VisualizationName'
import ConfirmOrCancel from 'src/shared/components/ConfirmOrCancel'

// Constants
import {CEOTabs} from 'src/dashboards/constants'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  title: string
  renameCell: (name: string) => void
  onSave: () => void
  onCancel: () => void
  activeEditorTab: CEOTabs
  onSetActiveEditorTab: (activeEditorTab: CEOTabs) => void
  isSaveable: boolean
}

@ErrorHandling
class CEOHeader extends Component<Props> {
  public render() {
    const {
      activeEditorTab,
      onSetActiveEditorTab,
      title,
      renameCell,
      onCancel,
      onSave,
      isSaveable,
    } = this.props

    return (
      <div className="page-header full-width deceo--header">
        <div className="page-header--container">
          <div className="page-header--left">
            <VisualizationName name={title} handleRenameCell={renameCell} />
          </div>
          <div className="deceo--header-tabs">
            <RadioButtons
              activeButton={activeEditorTab}
              buttons={[CEOTabs.Queries, CEOTabs.Vis]}
              onChange={onSetActiveEditorTab}
              shape={ButtonShape.StretchToFit}
            />
          </div>
          <div className="page-header--right">
            <ConfirmOrCancel
              onCancel={onCancel}
              onConfirm={onSave}
              isDisabled={!isSaveable}
            />
          </div>
        </div>
      </div>
    )
  }
}

export default CEOHeader
