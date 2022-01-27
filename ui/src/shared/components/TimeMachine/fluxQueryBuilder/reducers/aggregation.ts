import {AggregationSelectorAction} from '../actions/aggregations'
import {AggregationSelectorState} from '../types'

export const initialState: AggregationSelectorState = {
  fillMissing: false,
  period: 'auto',
  selectedFunctions: ['mean'],
}

const aggregationReducer = (
  state = initialState,
  action: AggregationSelectorAction
): AggregationSelectorState => {
  switch (action.type) {
    case 'FQB_AGG_FILL_MISSING': {
      return {
        ...state,
        fillMissing: action.payload.fillMissing,
      }
    }
    case 'FQB_AGG_PERIOD': {
      return {
        ...state,
        period: action.payload.period,
      }
    }
    case 'FQB_AGG_SELECTED_FNS': {
      return {
        ...state,
        selectedFunctions: action.payload.functions,
      }
    }
  }

  return state
}

export default aggregationReducer
