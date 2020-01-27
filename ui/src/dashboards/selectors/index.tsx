import {DEFAULT_TIME_RANGE} from 'src/shared/data/timeRanges'
import {DASHBOARD_REFRESH_DEFAULT} from 'src/shared/constants'
import {State as DashTimeState} from 'src/dashboards/reducers/dashTimeV1'

export const getTimeRange = (
  state: {dashTimeV1: DashTimeState},
  dashboardID: string
) =>
  state.dashTimeV1.ranges.find(r => r.dashboardID === dashboardID) ||
  DEFAULT_TIME_RANGE

export const getRefreshRate = (
  state: {dashTimeV1: DashTimeState},
  dashboardID
) => {
  const {refreshRate = DASHBOARD_REFRESH_DEFAULT} =
    state.dashTimeV1.refreshes.find(refr => refr.dashboardID === dashboardID) ||
    {}
  return refreshRate
}
