// Actions
import {Action, ActionType} from 'src/data_explorer/actions/queries'

// Types
import {DEState} from 'src/types/dataExplorer'

export const initialState: DEState = {
  sourceLink: '',
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
        queryStatuses: {...queryStatuses, [queryID]: status},
      }
    }
    case ActionType.ResetQueryStatuses: {
      return {
        ...state,
        queryStatuses: {},
      }
    }
  }

  return state
}
