// Libraries
import _ from 'lodash'

// Actions
import {Action, ActionType} from 'src/data_explorer/actions/queries'

// Types
import {DEState} from 'src/types/dataExplorer'

export const initialState: DEState = {
  sourceLink: '',
  queryStatus: {queryID: null, status: null},
}

export default (state = initialState, action: Action): DEState => {
  switch (action.type) {
    case ActionType.UpdateSourceLink: {
      const {sourceLink} = action.payload

      return {...state, sourceLink}
    }

    case ActionType.EditQueryStatus: {
      const {queryID, status} = action.payload

      return {...state, queryStatus: {queryID, status}}
    }
  }

  return state
}
