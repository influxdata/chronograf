// Libraries
import React, {Component} from 'react'

// Components
import {Page, Radio, ButtonShape} from 'src/reusable_ui'
import GraphTips from 'src/shared/components/GraphTips'
import Authorized, {EDITOR_ROLE} from 'src/auth/Authorized'
import TimeZoneToggle from 'src/shared/components/time_zones/TimeZoneToggle'

// Constants
import {CEOTabs} from 'src/dashboards/constants'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

// Types
import {TimeRange, TimeZones} from 'src/types'
import {setTimeZone} from 'src/shared/actions/app'

interface Props {
  timeZone: TimeZones
  timeRange: TimeRange
  activeEditorTab: CEOTabs
  onSetTimeZone: typeof setTimeZone
  onOpenWriteData: () => void
  toggleSendToDashboard: () => void
  onSetActiveEditorTab: (activeEditorTab: CEOTabs) => void
}

@ErrorHandling
class DEHeader extends Component<Props> {
  public render() {
    const {
      timeZone,
      onSetTimeZone,
      onOpenWriteData,
      activeEditorTab,
      onSetActiveEditorTab,
      toggleSendToDashboard,
    } = this.props

    return (
      <Page.Header fullWidth={true}>
        <Page.Header.Left>
          <Page.Title title="Explore" />
        </Page.Header.Left>
        <Page.Header.Center widthPixels={220}>
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
        </Page.Header.Center>
        <Page.Header.Right>
          <GraphTips />
          <TimeZoneToggle timeZone={timeZone} onSetTimeZone={onSetTimeZone} />
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
        </Page.Header.Right>
      </Page.Header>
    )
  }
}

export default DEHeader
