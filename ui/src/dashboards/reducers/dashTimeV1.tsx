import * as _ from 'lodash'
const initialState = {
  ranges: [],
}

const dashTimeV1 = (state = initialState, action) => {
  switch (action.type) {
    case 'ADD_DASHBOARD_TIME_V1': {
      const {dashboardID, timeRange} = action.payload
      const ranges = [...state.ranges, {dashboardID, timeRange}]

      return {...state, ranges}
    }

    case 'DELETE_DASHBOARD': {
      const {dashboardID} = action.payload
      const ranges = state.ranges.filter(r => r.dashboardID !== dashboardID)

      return {...state, ranges}
    }

    case 'SET_DASHBOARD_TIME_V1': {
      const {dashboardID, timeRange} = action.payload
      const newTimeRange = [{dashboardID, ...timeRange}]
      const ranges = _.unionBy(newTimeRange, state.ranges, 'dashboardID')

      return {...state, ranges}
    }
  }

  return state
}

export default dashTimeV1
