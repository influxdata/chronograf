// Libraries
import React, {Component} from 'react'

// Components
import {Radio, ButtonShape} from 'src/reusable_ui'
import AutoRefreshDropdown from 'src/shared/components/dropdown_auto_refresh/AutoRefreshDropdown'
import TimeRangeDropdown from 'src/shared/components/TimeRangeDropdown'
import GraphTips from 'src/shared/components/GraphTips'
import Authorized, {EDITOR_ROLE} from 'src/auth/Authorized'

// Constants
import {CEOTabs} from 'src/dashboards/constants'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

// Types
import {TimeRange} from 'src/types'

interface Props {
  timeRange: TimeRange
  autoRefresh: number
  activeEditorTab: CEOTabs
  onManualRefresh: () => void
  onOpenWriteData: () => void
  toggleSendToDashboard: () => void
  onChooseAutoRefresh: () => void
  onChooseTimeRange: (timeRange: TimeRange) => void
  onSetActiveEditorTab: (activeEditorTab: CEOTabs) => void
}

@ErrorHandling
class DEHeader extends Component<Props> {
  public render() {
    const {
      timeRange,
      autoRefresh,
      onOpenWriteData,
      onManualRefresh,
      activeEditorTab,
      onChooseTimeRange,
      onSetActiveEditorTab,
      toggleSendToDashboard,
      onChooseAutoRefresh,
    } = this.props

    return (
      <div className="page-header full-width deceo--header">
        <div className="page-header--container">
          <div className="page-header--left">Explore</div>
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
            <button
              onClick={onOpenWriteData}
              data-test="write-data-button"
              className="button button-sm button-default"
            >
              Write Data
            </button>
            <Authorized requiredRole={EDITOR_ROLE}>
              <button
                onClick={toggleSendToDashboard}
                className="button button-sm button-success"
              >
                Send to Dashboard
              </button>
            </Authorized>
            <GraphTips />
            <AutoRefreshDropdown
              selected={autoRefresh}
              onChoose={onChooseAutoRefresh}
              onManualRefresh={onManualRefresh}
            />
            <TimeRangeDropdown
              selected={timeRange}
              page="DataExplorer"
              onChooseTimeRange={onChooseTimeRange}
            />
          </div>
        </div>
      </div>
    )
  }
}

export default DEHeader
