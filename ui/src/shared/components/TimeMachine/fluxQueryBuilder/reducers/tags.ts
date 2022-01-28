import {TagSelectorAction} from '../actions/tags'
import {TagSelectorState} from '../types'
import uuid from 'uuid'
import {RemoteDataState} from 'src/types'

export const initialState: TagSelectorState[] = []

function changeTagSelector(
  state: TagSelectorState[],
  tagId: string,
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
          tagId: uuid.v4(),
          aggregateFunctionType: 'filter',
          keys: [],
          keysSearchTerm: '',
          keysStatus: RemoteDataState.NotStarted,
          selectedKey: '',
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
        selectedKey: action.payload.key,
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
  }

  return state
}

export default aggregationReducer
