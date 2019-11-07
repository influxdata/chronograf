import {ActionTypes, Action} from 'src/types/actions/app'
import {Env} from 'src/types/'

const initialState: Env = {
  telegrafSystemInterval: '1m',
  hostPageDisabled: false,
}

const envReducer = (state = initialState, action: Action) => {
  switch (action.type) {
    case ActionTypes.SetTelegrafSystemInterval: {
      const {telegrafSystemInterval} = action.payload
      return {
        ...state,
        telegrafSystemInterval,
      }
    }

    case ActionTypes.SetHostPageDisplayStatus: {
      const {hostPageDisabled} = action.payload
      return {
        ...state,
        hostPageDisabled,
      }
    }

    default:
      return state
  }
}

export default envReducer
