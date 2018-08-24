// Libraries
import React, {Component} from 'react'

// Components
import {Radio, ButtonShape} from 'src/reusable_ui'
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
            <Radio shape={ButtonShape.StretchToFit}>
              <Radio.Button
                id="deceo-tab-queries"
                titleText="Queries"
                value={CEOTabs.Queries}
                active={activeEditorTab === CEOTabs.Queries}
                onClick={onSetActiveEditorTab}
              >
                Queries
              </Radio.Button>
              <Radio.Button
                id="deceo-tab-vis"
                titleText="Visualization"
                value={CEOTabs.Vis}
                active={activeEditorTab === CEOTabs.Vis}
                onClick={onSetActiveEditorTab}
              >
                Visualization
              </Radio.Button>
            </Radio>
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
