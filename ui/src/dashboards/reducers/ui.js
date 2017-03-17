import _ from 'lodash'
import {EMPTY_DASHBOARD} from 'src/dashboards/constants'
import timeRanges from 'hson!../../shared/data/timeRanges.hson';
import cellQueries from 'src/shared/fixtures/cellQueries.js'

const initialState = {
  dashboards: [],
  dashboard: EMPTY_DASHBOARD,
  timeRange: timeRanges[1],
  isEditMode: false,
};

export default function ui(state = initialState, action) {
  switch (action.type) {
    case 'LOAD_DASHBOARDS': {
      const {dashboards, dashboardID} = action.payload;
      const newState = {
        dashboards,
        dashboard: _.find(dashboards, (d) => d.id === +dashboardID),
      };

      const fixture = _.cloneDeep(cellQueries)
      newState.dashboard.cells[0].queries = fixture

      return {...state, ...newState};
    }

    case 'SET_DASHBOARD': {
      const {dashboardID} = action.payload
      const newState = {
        dashboard: _.find(state.dashboards, (d) => d.id === +dashboardID),
      };

      return {...state, ...newState}
    }

    case 'SET_DASHBOARD_TIME_RANGE': {
      const {timeRange} = action.payload

      return {...state, timeRange};
    }

    case 'SET_EDIT_MODE': {
      const {isEditMode} = action.payload
      return {...state, isEditMode}
    }

    case 'UPDATE_DASHBOARD': {
      const {dashboard} = action.payload
      const newState = {
        dashboard,
        dashboards: state.dashboards.map((d) => d.id === dashboard.id ? dashboard : d),
      }

      const fixture = _.cloneDeep(cellQueries)
      newState.dashboard.cells[0].queries = fixture

      return {...state, ...newState}
    }
  }

  return state;
}
