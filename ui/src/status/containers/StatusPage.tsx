// Libraries
import React, {Component} from 'react'
import {connect} from 'react-redux'

// Components
import LayoutRenderer from 'src/shared/components/LayoutRenderer'
import {Page} from 'src/reusable_ui'
import TimeZoneToggle from 'src/shared/components/time_zones/TimeZoneToggle'

// Actions
import * as appActions from 'src/shared/actions/app'

// Constants
import {STATUS_PAGE_TIME_RANGE} from 'src/shared/data/timeRanges'
import {fixtureStatusPageCells} from 'src/status/fixtures'
import {
  TEMP_VAR_DASHBOARD_TIME,
  TEMP_VAR_UPPER_DASHBOARD_TIME,
} from 'src/shared/constants'

// Types
import {
  Source,
  Template,
  TemplateType,
  TemplateValueType,
  TimeZones,
} from 'src/types'

import {ErrorHandling} from 'src/shared/decorators/errors'

interface OwnProps {
  source: Source
}

interface StateProps {
  timeZone: TimeZones
  onSetTimeZone: typeof appActions.setTimeZone
}

const timeRange = STATUS_PAGE_TIME_RANGE

type Props = StateProps & OwnProps

@ErrorHandling
class StatusPage extends Component<Props> {
  public render() {
    const {source, onSetTimeZone, timeZone} = this.props
    const cells = fixtureStatusPageCells

    return (
      <Page>
        <Page.Header fullWidth={true}>
          <Page.Header.Left>
            <Page.Title title="Status" />
          </Page.Header.Left>
          <Page.Header.Right showSourceIndicator={true}>
            <TimeZoneToggle onSetTimeZone={onSetTimeZone} timeZone={timeZone} />
          </Page.Header.Right>
        </Page.Header>
        <Page.Contents fullWidth={true}>
          <div className="dashboard container-fluid full-width">
            {cells.length ? (
              <LayoutRenderer
                host=""
                sources={[]}
                cells={cells}
                source={source}
                manualRefresh={0}
                isEditable={false}
                isStatusPage={true}
                timeRange={timeRange}
                templates={this.templates}
              />
            ) : (
              <span>Loading Status Page...</span>
            )}
          </div>
        </Page.Contents>
      </Page>
    )
  }

  private get templates(): Template[] {
    const dashboardTime = {
      id: 'dashtime',
      tempVar: TEMP_VAR_DASHBOARD_TIME,
      type: TemplateType.Constant,
      label: '',
      values: [
        {
          value: timeRange.lower,
          type: TemplateValueType.Constant,
          selected: true,
          localSelected: true,
        },
      ],
    }

    const upperDashboardTime = {
      id: 'upperdashtime',
      tempVar: TEMP_VAR_UPPER_DASHBOARD_TIME,
      type: TemplateType.Constant,
      label: '',
      values: [
        {
          value: 'now()',
          type: TemplateValueType.Constant,
          selected: true,
          localSelected: true,
        },
      ],
    }

    return [dashboardTime, upperDashboardTime]
  }
}

const mstp = ({app}) => ({
  timeZone: app.persisted.timeZone,
})

const mdtp = {
  onSetTimeZone: appActions.setTimeZone,
}

export default connect(mstp, mdtp)(StatusPage)
