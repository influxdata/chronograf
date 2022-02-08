import {
  default as reducer,
  initialState,
} from 'src/shared/components/TimeMachine/fluxQueryBuilder/reducers/aggregation'

import {
  setFillMissing,
  setPeriod,
  setSelectedFunctions,
} from 'src/shared/components/TimeMachine/fluxQueryBuilder/actions/aggregation'

describe('fluxQueryBuilder/reducers/aggregation', () => {
  it('should handle FQB_AGG_PERIOD', () => {
    const newVal = '1h1s'
    const {period: initialPeriod, ...initialRest} = initialState
    expect(initialPeriod).toEqual('auto')
    const reducedState = reducer(initialState, setPeriod(newVal))

    const {period, ...rest} = reducedState
    expect(period).toEqual(newVal)
    expect(rest).toEqual(initialRest)
  })

  it('should handle FQB_AGG_FILL_MISSING', () => {
    ;[true, false].forEach(newVal => {
      const {fillMissing: initial, ...initialRest} = initialState
      expect(initial).toBe(false)
      const reducedState = reducer(initialState, setFillMissing(newVal))

      const {fillMissing, ...rest} = reducedState
      expect(fillMissing).toBe(newVal)
      expect(rest).toEqual(initialRest)
    })
  })

  it('should handle ME_GET_REQUESTED', () => {
    const newVal = []
    const {selectedFunctions: initial, ...initialRest} = initialState
    expect(initial).toEqual(['mean'])
    const reducedState = reducer(initialState, setSelectedFunctions(newVal))

    const {selectedFunctions, ...rest} = reducedState
    expect(selectedFunctions).toBe(newVal)
    expect(rest).toEqual(initialRest)
  })
})
