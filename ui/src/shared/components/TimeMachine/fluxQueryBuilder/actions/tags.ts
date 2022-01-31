import {BuilderAggregateFunctionType} from 'src/types'

export type TagSelectorAction =
  | ReturnType<typeof addTagSelector>
  | ReturnType<typeof removeTagSelector>
  | ReturnType<typeof changeFunctionType>
  | ReturnType<typeof selectKey>
  | ReturnType<typeof changeKeysSearchTerm>
  | ReturnType<typeof searchKeys>
  | ReturnType<typeof selectValues>
  | ReturnType<typeof changeValuesSearchTerm>
  | ReturnType<typeof searchValues>

export function addTagSelector() {
  return {
    type: 'FQB_TAG_ADD',
  }
}

export function removeTagSelector(tagId: string) {
  return {
    type: 'FQB_TAG_REMOVE',
    payload: {
      tagId,
    },
  }
}

export function changeFunctionType(
  tagId: string,
  type: BuilderAggregateFunctionType
) {
  return {
    type: 'FQB_TAG_CHANGE_TYPE',
    payload: {
      tagId,
      type,
    },
  }
}

export function selectKey(tagId: string, key: string) {
  return {
    type: 'FQB_TAG_SELECT_KEY',
    payload: {
      tagId,
      key,
    },
  }
}

export function changeKeysSearchTerm(tagId: string, term: string) {
  return {
    type: 'FQB_TAG_CHANGE_KEY_SEARCHTERM',
    payload: {
      tagId,
      term,
    },
  }
}

export function searchKeys(tagId: string) {
  return {
    type: 'FQB_TAG_SEARCH_KEY',
    payload: {
      tagId,
    },
  }
}

export function selectValues(tagId: string, values: string[]) {
  return {
    type: 'FQB_TAG_SELECT_VALUES',
    payload: {
      tagId,
      values,
    },
  }
}

export function changeValuesSearchTerm(tagId: string, term: string) {
  return {
    type: 'FQB_TAG_CHANGE_VALUES_SEARCHTERM',
    payload: {
      tagId,
      term,
    },
  }
}

export function searchValues(tagId: string) {
  return {
    type: 'FQB_TAG_SEARCH_VALUES',
    payload: {
      tagId,
    },
  }
}
