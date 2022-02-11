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
  | ReturnType<typeof setKeysStatus>
  | ReturnType<typeof setKeys>
  | ReturnType<typeof setValuesStatus>
  | ReturnType<typeof setValues>
  | ReturnType<typeof reset>

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

export function reset() {
  return {
    type: 'FQB_TAG_RESET' as const,
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

export function setKeysStatus(tagIndex: number, status: RemoteDataState) {
  return {
    type: 'FQB_TAG_KEY_STATUS' as const,
    payload: {
      tagIndex,
      status,
    },
  }
}

export function setValuesStatus(tagIndex: number, status: RemoteDataState) {
  return {
    type: 'FQB_TAG_VALUES_STATUS' as const,
    payload: {
      tagIndex,
      status,
    },
  }
}

export function setKeys(
  tagIndex: number,
  keys: string[],
  truncated: boolean,
  limit: number
) {
  return {
    type: 'FQB_TAG_KEYS' as const,
    payload: {
      tagIndex,
      keys,
      truncated,
      limit,
    },
  }
}

export function setValues(
  tagIndex: number,
  values: string[],
  truncated: boolean
) {
  return {
    type: 'FQB_TAG_VALUES' as const,
    payload: {
      tagIndex,
      values,
      valuesTruncated: truncated,
    },
  }
}
