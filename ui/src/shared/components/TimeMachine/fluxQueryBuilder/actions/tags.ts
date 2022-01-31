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

export function removeTagSelector(tagId: number) {
  return {
    type: 'FQB_TAG_REMOVE' as const,
    payload: {
      tagId,
    },
  }
}

export function changeFunctionType(
  tagId: number,
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

export function selectKey(tagId: number, key: string) {
  return {
    type: 'FQB_TAG_SELECT_KEY' as const,
    payload: {
      tagId,
      key,
    },
  }
}

export function changeKeysSearchTerm(tagId: number, term: string) {
  return {
    type: 'FQB_TAG_CHANGE_KEY_SEARCHTERM' as const,
    payload: {
      tagId,
      term,
    },
  }
}

export function searchKeys(tagId: number) {
  return {
    type: 'FQB_TAG_SEARCH_KEY' as const,
    payload: {
      tagId,
    },
  }
}

export function selectValues(tagId: number, values: string[]) {
  return {
    type: 'FQB_TAG_SELECT_VALUES' as const,
    payload: {
      tagId,
      values,
    },
  }
}

export function changeValuesSearchTerm(tagId: number, term: string) {
  return {
    type: 'FQB_TAG_CHANGE_VALUES_SEARCHTERM' as const,
    payload: {
      tagId,
      term,
    },
  }
}

export function searchValues(tagId: number) {
  return {
    type: 'FQB_TAG_SEARCH_VALUES' as const,
    payload: {
      tagId,
    },
  }
}

export function setTagKeysStatus(tagId: number, status: RemoteDataState) {
  return {
    type: 'FQB_TAG_KEY_STATUS' as const,
    payload: {
      tagId,
      status,
    },
  }
}
