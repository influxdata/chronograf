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
    keysTruncated: false,
    tagKey: '',
    values: [],
    valuesSearchTerm: '',
    valuesStatus: undefined,
    tagValues: [],
  }
}

function changeTagSelector(
  state: TagSelectorState[],
  tagIndex: number,
  fn: (tagState: TagSelectorState, index: number) => Partial<TagSelectorState>
): TagSelectorState[] {
  if (state[tagIndex]) {
    state = [...state]
    state[tagIndex] = {
      ...state[tagIndex],
      ...fn(state[tagIndex], tagIndex),
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
      return state
        .filter(({tagIndex}) => tagIndex !== id)
        .map((tag, tagIndex) => ({...tag, tagIndex}))
    }
    case 'FQB_TAG_CHANGE_TYPE': {
      return changeTagSelector(state, action.payload.tagIndex, () => ({
        aggregateFunctionType: action.payload.type,
        tagValues: [],
        valuesSearchTerm: '',
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
        tagKey: action.payload.key,
        values: [],
        aggregateFunctionType: 'filter',
      }))
    }
    case 'FQB_TAG_SELECT_VALUES': {
      return changeTagSelector(state, action.payload.tagIndex, () => ({
        tagValues: action.payload.values,
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
      const {tagIndex, status} = action.payload
      if (state[tagIndex] === undefined) {
        return state
      }
      state = [...state]
      state[tagIndex] = {
        ...state[tagIndex],
        keysStatus: status,
      }
      if (status === RemoteDataState.Loading) {
        state[tagIndex].valuesStatus = RemoteDataState.NotStarted
        for (let i = tagIndex + 1; i < state.length; i++) {
          state[i] = {
            ...state[i],
            keysStatus: RemoteDataState.NotStarted,
          }
        }
      }
      return state
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
        keysTruncated: action.payload.keysTruncated,
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
