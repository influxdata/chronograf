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

export function removeTagSelector(tagIndex: number) {
  return {
    type: 'FQB_TAG_REMOVE' as const,
    payload: {
      tagIndex,
    },
  }
}

export function changeFunctionType(
  tagIndex: number,
  type: BuilderAggregateFunctionType
) {
  return {
    type: 'FQB_TAG_CHANGE_TYPE' as const,
    payload: {
      tagIndex,
      type,
    },
  }
}

export function selectKey(tagIndex: number, key: string) {
  return {
    type: 'FQB_TAG_SELECT_KEY' as const,
    payload: {
      tagIndex,
      key,
    },
  }
}

export function changeKeysSearchTerm(tagIndex: number, term: string) {
  return {
    type: 'FQB_TAG_CHANGE_KEY_SEARCHTERM' as const,
    payload: {
      tagIndex,
      term,
    },
  }
}

export function searchKeys(tagIndex: number) {
  return {
    type: 'FQB_TAG_SEARCH_KEY' as const,
    payload: {
      tagIndex,
    },
  }
}

export function selectValues(tagIndex: number, values: string[]) {
  return {
    type: 'FQB_TAG_SELECT_VALUES' as const,
    payload: {
      tagIndex,
      values,
    },
  }
}

export function changeValuesSearchTerm(tagIndex: number, term: string) {
  return {
    type: 'FQB_TAG_CHANGE_VALUES_SEARCHTERM' as const,
    payload: {
      tagIndex,
      term,
    },
  }
}

export function searchValues(tagIndex: number) {
  return {
    type: 'FQB_TAG_SEARCH_VALUES' as const,
    payload: {
      tagIndex,
    },
  }
}

export function setTagKeysStatus(tagIndex: number, status: RemoteDataState) {
  return {
    type: 'FQB_TAG_KEY_STATUS' as const,
    payload: {
      tagIndex,
      status,
    },
  }
}
