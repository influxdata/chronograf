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
    tagId: string
  }
}
export function removeTagSelector(tagId: string): ActionRemoveTagSelector {
  return {
    type: 'FQB_TAG_REMOVE',
    payload: {
      tagId,
    },
  }
}

export interface ActionChangeFunctionType {
  type: 'FQB_TAG_CHANGE_TYPE'
  payload: {
    tagId: string
    type: BuilderAggregateFunctionType
  }
}
export function changeFunctionType(
  tagId: string,
  type: BuilderAggregateFunctionType
): ActionChangeFunctionType {
  return {
    type: 'FQB_TAG_CHANGE_TYPE',
    payload: {
      tagId,
      type,
    },
  }
}

export interface ActionSelectKey {
  type: 'FQB_TAG_SELECT_KEY'
  payload: {
    tagId: string
    key: string
  }
}
export function selectKey(tagId: string, key: string): ActionSelectKey {
  return {
    type: 'FQB_TAG_SELECT_KEY',
    payload: {
      tagId,
      key,
    },
  }
}

export interface ActionChangeKeysSearchTerm {
  type: 'FQB_TAG_CHANGE_KEY_SEARCHTERM'
  payload: {
    tagId: string
    term: string
  }
}
export function changeKeysSearchTerm(
  tagId: string,
  term: string
): ActionChangeKeysSearchTerm {
  return {
    type: 'FQB_TAG_CHANGE_KEY_SEARCHTERM',
    payload: {
      tagId,
      term,
    },
  }
}

export interface ActionSearchKeys {
  type: 'FQB_TAG_SEARCH_KEY'
  payload: {
    tagId: string
  }
}
export function searchKeys(tagId: string): ActionSearchKeys {
  return {
    type: 'FQB_TAG_SEARCH_KEY',
    payload: {
      tagId,
    },
  }
}

export interface ActionSelectValues {
  type: 'FQB_TAG_SELECT_VALUES'
  payload: {
    tagId: string
    values: string[]
  }
}
export function selectValues(
  tagId: string,
  values: string[]
): ActionSelectValues {
  return {
    type: 'FQB_TAG_SELECT_VALUES',
    payload: {
      tagId,
      values,
    },
  }
}

export interface ActionChangeValuesSearchTerm {
  type: 'FQB_TAG_CHANGE_VALUES_SEARCHTERM'
  payload: {
    tagId: string
    term: string
  }
}
export function changeValuesSearchTerm(
  tagId: string,
  term: string
): ActionChangeValuesSearchTerm {
  return {
    type: 'FQB_TAG_CHANGE_VALUES_SEARCHTERM',
    payload: {
      tagId,
      term,
    },
  }
}

export interface ActionSearchValues {
  type: 'FQB_TAG_SEARCH_VALUES'
  payload: {
    tagId: string
  }
}
export function searchValues(tagId: string): ActionSearchValues {
  return {
    type: 'FQB_TAG_SEARCH_VALUES',
    payload: {
      tagId,
    },
  }
}
