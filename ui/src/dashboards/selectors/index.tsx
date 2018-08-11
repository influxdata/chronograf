import {DEFAULT_TIME_RANGE} from 'src/shared/data/timeRanges'
import idNormalizer, {TYPE_ID} from 'src/normalizers/id'
import {State as DashTimeState} from 'src/dashboards/reducers/dashTimeV1'

export const getTimeRange = (state: {dashTimeV1: DashTimeState}, dashboardID) =>
  state.dashTimeV1.ranges.find(
    r => r.dashboardID === idNormalizer(TYPE_ID, dashboardID)
  ) || DEFAULT_TIME_RANGE
