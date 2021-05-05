// Actions
import {Action, ActionType} from 'src/data_explorer/actions/queries'

// Types
import {DEState} from 'src/types/dataExplorer'

export const initialState: DEState = {
  sourceLink: '',
  queryStatus: {queryID: null, status: null},
  queryStatuses: {},
}

export default (state = initialState, action: Action): DEState => {
  switch (action.type) {
    case ActionType.UpdateSourceLink: {
      const {sourceLink} = action.payload

      return {...state, sourceLink}
    }

    case ActionType.EditQueryStatus: {
      const {queryID, status} = action.payload
      const {queryStatuses} = state
      return {
        ...state,
        queryStatus: {queryID, status},
        queryStatuses: {...queryStatuses, [queryID]: status},
      }
    }
    case ActionType.ResetQueryStatuses: {
      return {
        ...state,
        queryStatuses: {},
        queryStatus: {queryID: null, status: null},
      }
    }
  }

  return state
}
