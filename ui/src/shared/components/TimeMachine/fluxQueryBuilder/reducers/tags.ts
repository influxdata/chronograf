import {TagSelectorAction} from '../actions/tags'
import {TagSelectorState} from '../types'
import {RemoteDataState} from 'src/types'

export const initialState: TagSelectorState[] = []

function changeTagSelector(
  state: TagSelectorState[],
  tagId: number,
  fn: (tagState: TagSelectorState, index: number) => Partial<TagSelectorState>
): TagSelectorState[] {
  const index = state.findIndex(({tagId: id}) => id === tagId)
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
      return [
        ...state,
        {
          tagId: state.length,
          aggregateFunctionType: 'filter',
          keys: [],
          keysSearchTerm: '',
          keysStatus: RemoteDataState.NotStarted,
          key: '',
          values: [],
          valuesSearchTerm: '',
          valuesStatus: undefined,
          selectedValues: [],
        },
      ]
    }
    case 'FQB_TAG_REMOVE': {
      const id = action.payload.tagId
      return state.filter(({tagId}) => tagId !== id)
    }
    case 'FQB_TAG_CHANGE_TYPE': {
      return changeTagSelector(state, action.payload.tagId, () => ({
        aggregateFunctionType: action.payload.type,
      }))
    }
    case 'FQB_TAG_CHANGE_KEY_SEARCHTERM': {
      return changeTagSelector(state, action.payload.tagId, () => ({
        keysSearchTerm: action.payload.term,
      }))
    }
    case 'FQB_TAG_CHANGE_VALUES_SEARCHTERM': {
      return changeTagSelector(state, action.payload.tagId, () => ({
        valuesSearchTerm: action.payload.term,
      }))
    }
    case 'FQB_TAG_SELECT_KEY': {
      return changeTagSelector(state, action.payload.tagId, () => ({
        key: action.payload.key,
      }))
    }
    case 'FQB_TAG_SELECT_VALUES': {
      return changeTagSelector(state, action.payload.tagId, () => ({
        selectedValues: action.payload.values,
      }))
    }
    case 'FQB_TAG_SEARCH_KEY': {
      return changeTagSelector(state, action.payload.tagId, () => ({
        keysStatus: RemoteDataState.Loading,
      }))
    }
    case 'FQB_TAG_SEARCH_VALUES': {
      return changeTagSelector(state, action.payload.tagId, () => ({
        valuesStatus: RemoteDataState.Loading,
      }))
    }
    case 'FQB_TAG_KEY_STATUS': {
      return changeTagSelector(state, action.payload.tagId, () => ({
        keysStatus: action.payload.status,
      }))
    }
  }

  return state
}

export default aggregationReducer
