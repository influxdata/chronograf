import {BuilderAggregateFunctionType, RemoteDataState} from 'src/types'

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
  | ReturnType<typeof setTagKeysStatus>

export function addTagSelector() {
  return {
    type: 'FQB_TAG_ADD' as const,
  }
}

export function removeTagSelector(tagId: string) {
  return {
    type: 'FQB_TAG_REMOVE' as const,
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
    type: 'FQB_TAG_CHANGE_TYPE' as const,
    payload: {
      tagId,
      type,
    },
  }
}

export function selectKey(tagId: string, key: string) {
  return {
    type: 'FQB_TAG_SELECT_KEY' as const,
    payload: {
      tagId,
      key,
    },
  }
}

export function changeKeysSearchTerm(tagId: string, term: string) {
  return {
    type: 'FQB_TAG_CHANGE_KEY_SEARCHTERM' as const,
    payload: {
      tagId,
      term,
    },
  }
}

export function searchKeys(tagId: string) {
  return {
    type: 'FQB_TAG_SEARCH_KEY' as const,
    payload: {
      tagId,
    },
  }
}

export function selectValues(tagId: string, values: string[]) {
  return {
    type: 'FQB_TAG_SELECT_VALUES' as const,
    payload: {
      tagId,
      values,
    },
  }
}

export function changeValuesSearchTerm(tagId: string, term: string) {
  return {
    type: 'FQB_TAG_CHANGE_VALUES_SEARCHTERM' as const,
    payload: {
      tagId,
      term,
    },
  }
}

export function searchValues(tagId: string) {
  return {
    type: 'FQB_TAG_SEARCH_VALUES' as const,
    payload: {
      tagId,
    },
  }
}

export function setTagKeysStatus(tagId: string, status: RemoteDataState) {
  return {
    type: 'FQB_TAG_KEY_STATUS' as const,
    payload: {
      tagId,
      status,
    },
  }
}
