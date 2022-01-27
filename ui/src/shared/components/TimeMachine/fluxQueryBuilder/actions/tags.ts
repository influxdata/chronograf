import {BuilderAggregateFunctionType} from 'src/types'

export type TagSelectorAction =
  | ActionAddTagSelector
  | ActionRemoveTagSelector
  | ActionChangeFunctionType
  | ActionSelectKey
  | ActionChangeKeysSearchTerm
  | ActionSearchKeys
  | ActionSelectValues
  | ActionChangeValuesSearchTerm
  | ActionSearchValues

export interface ActionAddTagSelector {
  type: 'FQB_TAG_ADD'
}
export function addTagSelector(): ActionAddTagSelector {
  return {
    type: 'FQB_TAG_ADD',
  }
}

export interface ActionRemoveTagSelector {
  type: 'FQB_TAG_REMOVE'
  payload: {
    index: number
  }
}
export function removeTagSelector(index: number): ActionRemoveTagSelector {
  return {
    type: 'FQB_TAG_REMOVE',
    payload: {
      index,
    },
  }
}

export interface ActionChangeFunctionType {
  type: 'FQB_TAG_CHANGE_TYPE'
  payload: {
    index: number
    type: BuilderAggregateFunctionType
  }
}
export function changeFunctionType(
  index: number,
  type: BuilderAggregateFunctionType
): ActionChangeFunctionType {
  return {
    type: 'FQB_TAG_CHANGE_TYPE',
    payload: {
      index,
      type,
    },
  }
}

export interface ActionSelectKey {
  type: 'FQB_TAG_SELECT_KEY'
  payload: {
    index: number
    key: string
  }
}
export function selectKey(index: number, key: string): ActionSelectKey {
  return {
    type: 'FQB_TAG_SELECT_KEY',
    payload: {
      index,
      key,
    },
  }
}

export interface ActionChangeKeysSearchTerm {
  type: 'FQB_TAG_CHANGE_KEY_SEARCHTERM'
  payload: {
    index: number
    term: string
  }
}
export function changeKeysSearchTerm(
  index: number,
  term: string
): ActionChangeKeysSearchTerm {
  return {
    type: 'FQB_TAG_CHANGE_KEY_SEARCHTERM',
    payload: {
      index,
      term,
    },
  }
}

export interface ActionSearchKeys {
  type: 'FQB_TAG_SEARCH_KEY'
  payload: {
    index: number
  }
}
export function searchKeys(index: number): ActionSearchKeys {
  return {
    type: 'FQB_TAG_SEARCH_KEY',
    payload: {
      index,
    },
  }
}

export interface ActionSelectValues {
  type: 'FQB_TAG_SELECT_VALUES'
  payload: {
    index: number
    values: string[]
  }
}
export function selectValues(
  index: number,
  values: string[]
): ActionSelectValues {
  return {
    type: 'FQB_TAG_SELECT_VALUES',
    payload: {
      index,
      values,
    },
  }
}

export interface ActionChangeValuesSearchTerm {
  type: 'FQB_TAG_CHANGE_VALUES_SEARCHTERM'
  payload: {
    index: number
    term: string
  }
}
export function changeValuesSearchTerm(
  index: number,
  term: string
): ActionChangeValuesSearchTerm {
  return {
    type: 'FQB_TAG_CHANGE_VALUES_SEARCHTERM',
    payload: {
      index,
      term,
    },
  }
}

export interface ActionSearchValues {
  type: 'FQB_TAG_SEARCH_VALUES'
  payload: {
    index: number
  }
}
export function searchValues(index: number): ActionSearchValues {
  return {
    type: 'FQB_TAG_SEARCH_VALUES',
    payload: {
      index,
    },
  }
}
