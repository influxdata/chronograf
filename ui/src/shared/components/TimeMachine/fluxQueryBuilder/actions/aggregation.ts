export type AggregationSelectorAction =
  | ReturnType<typeof setPeriod>
  | ReturnType<typeof setFillMissing>
  | ReturnType<typeof setSelectedFunctions>

export function setPeriod(period: string) {
  return {
    type: 'FQB_AGG_PERIOD' as const,
    payload: {
      period,
    },
  }
}

export function setFillMissing(fillMissing: boolean) {
  return {
    type: 'FQB_AGG_FILL_MISSING' as const,
    payload: {
      fillMissing,
    },
  }
}

export function setSelectedFunctions(functions: string[]) {
  return {
    type: 'FQB_AGG_SELECTED_FNS' as const,
    payload: {
      functions,
    },
  }
}
export const actionCreators = {
  setFillMissing,
  setPeriod,
  setSelectedFunctions,
}
