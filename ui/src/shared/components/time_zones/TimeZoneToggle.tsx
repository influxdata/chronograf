// Libraries
import React, {FunctionComponent} from 'react'

// Actions
import * as appActions from 'src/shared/actions/app'

// Components
import {Radio} from 'src/reusable_ui'

// Types
import {TimeZones} from 'src/types'

interface StateProps {
  timeZone: TimeZones
  onSetTimeZone: typeof appActions.setTimeZone
}

const TimeZoneToggle: FunctionComponent<StateProps> = ({
  onSetTimeZone,
  timeZone,
}) => {
  return (
    <Radio>
      <Radio.Button
        id="influxql-source"
        titleText="UTC"
        value={TimeZones.UTC}
        onClick={onSetTimeZone}
        active={timeZone === TimeZones.UTC}
      >
        UTC
      </Radio.Button>
      <Radio.Button
        id="flux-source"
        titleText="Local"
        value={TimeZones.Local}
        onClick={onSetTimeZone}
        active={timeZone === TimeZones.Local}
      >
        Local
      </Radio.Button>
    </Radio>
  )
}

export default TimeZoneToggle
