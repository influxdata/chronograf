import {unionBy} from 'lodash'

import {TimeRange} from 'src/types'
import {Refresh} from 'src/types/localStorage'
import {Action, ActionType} from 'src/dashboards/actions'

interface Range extends TimeRange {
  dashboardID: number
}

export interface State {
  ranges: Range[]
  refreshes: Refresh[]
}

const initialState: State = {
  ranges: [],
  refreshes: [],
}

export default (state: State = initialState, action: Action) => {
  switch (action.type) {
    case ActionType.DeleteDashboard: {
      const {dashboard} = action.payload
      const ranges = state.ranges.filter(r => r.dashboardID !== dashboard.id)

      return {...state, ranges}
    }

    case ActionType.RetainRangesDashboardTimeV1: {
      const {dashboardIDs} = action.payload
      const ranges = state.ranges.filter(r =>
        dashboardIDs.includes(r.dashboardID)
      )
      return {...state, ranges}
    }

    case ActionType.RetainDashboardRefresh: {
      const {dashboardIDs} = action.payload
      const refreshes = state.refreshes.filter(r =>
        dashboardIDs.includes(r.dashboardID)
      )
      return {...state, refreshes}
    }

    case ActionType.SetDashboardTimeV1: {
      const {dashboardID, timeRange} = action.payload
      const newTimeRange = [{dashboardID, ...timeRange}]
      const ranges = unionBy(newTimeRange, state.ranges, 'dashboardID')

      return {...state, ranges}
    }

    case ActionType.SetDashboardRefresh: {
      const {dashboardID, refreshRate} = action.payload
      const newRefresh = [{dashboardID, refreshRate}]
      const refreshes = unionBy(newRefresh, state.refreshes, 'dashboardID')

      return {...state, refreshes}
    }
  }

  return state
}
