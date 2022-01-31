import {TagSelectorAction} from '../actions/tags'
import {TagSelectorState} from '../types'
import {BuilderAggregateFunctionType, RemoteDataState} from 'src/types'

export const initialState: TagSelectorState[] = []
export function initialSelectorState(
  tagIndex: number = 0,
  aggregateFunctionType: BuilderAggregateFunctionType = 'filter'
): TagSelectorState {
  return {
    tagIndex,
    aggregateFunctionType,
    keys: [],
    keysSearchTerm: '',
    keysStatus: RemoteDataState.NotStarted,
    key: '',
    values: [],
    valuesSearchTerm: '',
    valuesStatus: undefined,
    selectedValues: [],
  }
}

function changeTagSelector(
  state: TagSelectorState[],
  tagIndex: number,
  fn: (tagState: TagSelectorState, index: number) => Partial<TagSelectorState>
): TagSelectorState[] {
  const index = state.findIndex(({tagIndex: id}) => id === tagIndex)
  if (index !== -1) {
    state[index] = {
      ...state[index],
      ...fn(state[index], index),
    }
  }
  return state
}

const aggregationReducer = (
  state = initialState,
  action: TagSelectorAction
): TagSelectorState[] => {
  switch (action.type) {
    case 'FQB_TAG_ADD': {
      return [...state, initialSelectorState(state.length)]
    }
    case 'FQB_TAG_RESET': {
      return [
        initialSelectorState(
          0,
          state.length ? state[0].aggregateFunctionType : 'filter'
        ),
      ]
    }
    case 'FQB_TAG_REMOVE': {
      const id = action.payload.tagIndex
      return state.filter(({tagIndex}) => tagIndex !== id)
    }
    case 'FQB_TAG_CHANGE_TYPE': {
      return changeTagSelector(state, action.payload.tagIndex, () => ({
        aggregateFunctionType: action.payload.type,
        selectedValues: [],
      }))
    }
    case 'FQB_TAG_CHANGE_KEY_SEARCHTERM': {
      return changeTagSelector(state, action.payload.tagIndex, () => ({
        keysSearchTerm: action.payload.term,
      }))
    }
    case 'FQB_TAG_CHANGE_VALUES_SEARCHTERM': {
      return changeTagSelector(state, action.payload.tagIndex, () => ({
        valuesSearchTerm: action.payload.term,
      }))
    }
    case 'FQB_TAG_SELECT_KEY': {
      return changeTagSelector(state, action.payload.tagIndex, () => ({
        key: action.payload.key,
      }))
    }
    case 'FQB_TAG_SELECT_VALUES': {
      return changeTagSelector(state, action.payload.tagIndex, () => ({
        selectedValues: action.payload.values,
      }))
    }
    case 'FQB_TAG_SEARCH_KEY': {
      return changeTagSelector(state, action.payload.tagIndex, () => ({
        keysStatus: RemoteDataState.Loading,
      }))
    }
    case 'FQB_TAG_SEARCH_VALUES': {
      return changeTagSelector(state, action.payload.tagIndex, () => ({
        valuesStatus: RemoteDataState.Loading,
      }))
    }
    case 'FQB_TAG_KEY_STATUS': {
      return changeTagSelector(state, action.payload.tagIndex, () => ({
        keysStatus: action.payload.status,
      }))
    }
    case 'FQB_TAG_VALUES_STATUS': {
      return changeTagSelector(state, action.payload.tagIndex, () => ({
        valuesStatus: action.payload.status,
      }))
    }
    case 'FQB_TAG_KEYS': {
      return changeTagSelector(state, action.payload.tagIndex, () => ({
        keys: action.payload.keys,
        keysStatus: RemoteDataState.Done,
      }))
    }
    case 'FQB_TAG_VALUES': {
      return changeTagSelector(state, action.payload.tagIndex, () => ({
        values: action.payload.values,
        valuesStatus: RemoteDataState.Done,
      }))
    }
  }

  return state
}

export default aggregationReducer
