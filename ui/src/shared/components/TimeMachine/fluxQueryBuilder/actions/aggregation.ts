export type AggregationSelectorAction =
  | ActionSetPeriod
  | ActionSetFillMissing
  | ActionSetSelectedFunctions

export interface ActionSetPeriod {
  type: 'FQB_AGG_PERIOD'
  payload: {
    period: string
  }
}
export function setPeriod(period: string): ActionSetPeriod {
  return {
    type: 'FQB_AGG_PERIOD',
    payload: {
      period,
    },
  }
}

export interface ActionSetFillMissing {
  type: 'FQB_AGG_FILL_MISSING'
  payload: {
    fillMissing: boolean
  }
}
export function setFillMissing(fillMissing: boolean): ActionSetFillMissing {
  return {
    type: 'FQB_AGG_FILL_MISSING',
    payload: {
      fillMissing,
    },
  }
}

export interface ActionSetSelectedFunctions {
  type: 'FQB_AGG_SELECTED_FNS'
  payload: {
    functions: string[]
  }
}
export function setSelectedFunctions(
  functions: string[]
): ActionSetSelectedFunctions {
  return {
    type: 'FQB_AGG_SELECTED_FNS',
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
