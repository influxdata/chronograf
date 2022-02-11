import {
  default as reducer,
  initialState,
  initialSelectorState,
} from 'src/shared/components/TimeMachine/fluxQueryBuilder/reducers/tags'

import {
  addTagSelector,
  removeTagSelector,
  reset,
  changeFunctionType,
  changeKeysSearchTerm,
  changeValuesSearchTerm,
  selectKey,
  selectValues,
  setKeys,
  setValues,
  searchKeys,
  searchValues,
  setKeysStatus,
  setValuesStatus,
} from 'src/shared/components/TimeMachine/fluxQueryBuilder/actions/tags'
import {BuilderAggregateFunctionType, RemoteDataState} from 'src/types'

describe('fluxQueryBuilder/reducers/tags', () => {
  it('has empty initial state', () => {
    expect(initialState).toEqual([])
  })
  it('should handle addTagSelector', () => {
    const reducedState = reducer(initialState, addTagSelector())
    expect(reducedState).toEqual([initialSelectorState(0)])
    expect(reducedState[0].keysSearchTerm).toBe('')
    expect(reducedState[0].valuesSearchTerm).toBe('')
    expect(reducedState[0].keys).toEqual([])
    expect(reducedState[0].values).toEqual([])
    expect(Object.is(initialState, reducedState)).toBe(false)
  })
  it('should handle reset', () => {
    let state = reducer(initialState, addTagSelector())
    state = reducer(initialState, addTagSelector())
    const reducedState = reducer(state, reset())
    expect(reducedState).toEqual([initialSelectorState(0)])
    expect(Object.is(state, reducedState)).toBe(false)
  })
  it('should handle removeTagSelector', () => {
    const state = [initialSelectorState(0), initialSelectorState(1)]
    state[1].tagKey = 'a'
    const reducedState = reducer(state, removeTagSelector(0))
    expect(reducedState).toEqual([{...initialSelectorState(0), tagKey: 'a'}])
    expect(Object.is(state, reducedState)).toBe(false)
  })
  it('should handle changeFunctionType', () => {
    const vals: BuilderAggregateFunctionType[] = ['group', 'filter']
    vals.forEach(type => {
      const state = [initialSelectorState(0), initialSelectorState(1)]
      const reducedState = reducer(state, changeFunctionType(1, type))
      expect(reducedState).toEqual([
        state[0],
        {...state[1], aggregateFunctionType: type},
      ])
      expect(Object.is(state, reducedState)).toBe(false)
      expect(Object.is(state[1], reducedState[1])).toBe(false)
    })
  })
  it('should handle changeKeysSearchTerm', () => {
    const newVal = 'aaa'
    const state = [initialSelectorState(0), initialSelectorState(1)]
    const reducedState = reducer(state, changeKeysSearchTerm(1, newVal))
    expect(reducedState).toEqual([
      state[0],
      {...state[1], keysSearchTerm: newVal},
    ])
    expect(Object.is(state, reducedState)).toBe(false)
    expect(Object.is(state[1], reducedState[1])).toBe(false)
  })
  it('should handle changeKeysSearchTerm', () => {
    const newVal = 'aaa'
    const state = [initialSelectorState(0), initialSelectorState(1)]
    const reducedState = reducer(state, changeValuesSearchTerm(1, newVal))
    expect(reducedState).toEqual([
      state[0],
      {...state[1], valuesSearchTerm: newVal},
    ])
    expect(Object.is(state, reducedState)).toBe(false)
    expect(Object.is(state[1], reducedState[1])).toBe(false)
  })
  it('should handle selectKey', () => {
    const newVal = 'newK'
    const state = [initialSelectorState(0), initialSelectorState(1)]
    const reducedState = reducer(state, selectKey(1, newVal))
    expect(reducedState).toEqual([state[0], {...state[1], tagKey: newVal}])
    expect(Object.is(state, reducedState)).toBe(false)
    expect(Object.is(state[1], reducedState[1])).toBe(false)
  })
  it('should handle selectValues', () => {
    const newVal = ['newV']
    const state = [initialSelectorState(0), initialSelectorState(1)]
    const reducedState = reducer(state, selectValues(1, newVal))
    expect(reducedState).toEqual([state[0], {...state[1], tagValues: newVal}])
    expect(Object.is(state, reducedState)).toBe(false)
    expect(Object.is(state[1], reducedState[1])).toBe(false)
  })
  it('should handle setKeys', () => {
    ;[true, false].forEach(truncated => {
      const newVal = ['newK']
      const state = [initialSelectorState(0), initialSelectorState(1)]
      const reducedState = reducer(state, setKeys(1, newVal, truncated))
      expect(reducedState).toEqual([
        state[0],
        {
          ...state[1],
          keys: newVal,
          keysTruncated: truncated,
          keysStatus: RemoteDataState.Done,
        },
      ])
      expect(Object.is(state, reducedState)).toBe(false)
      expect(Object.is(state[1], reducedState[1])).toBe(false)
    })
  })
  it('should handle setValues', () => {
    const newVal = ['newV']
    const state = [initialSelectorState(0), initialSelectorState(1)]
    const reducedState = reducer(state, setValues(1, newVal))
    expect(reducedState).toEqual([
      state[0],
      {...state[1], values: newVal, valuesStatus: RemoteDataState.Done},
    ])
    expect(Object.is(state, reducedState)).toBe(false)
    expect(Object.is(state[1], reducedState[1])).toBe(false)
  })
  it('should ignore searchKeys', () => {
    const state = [initialSelectorState(0), initialSelectorState(1)]
    const reducedState = reducer(state, searchKeys(1))
    expect(reducedState).toEqual([
      initialSelectorState(0),
      {...initialSelectorState(1), keysStatus: RemoteDataState.Loading},
    ])
  })
  it('should ignore searchValues', () => {
    const state = [initialSelectorState(0), initialSelectorState(1)]
    const reducedState = reducer(state, searchValues(1))
    expect(reducedState).toEqual([
      initialSelectorState(0),
      {...initialSelectorState(1), valuesStatus: RemoteDataState.Loading},
    ])
  })
  it('should handle setValuesStatus', () => {
    ;[
      RemoteDataState.Loading,
      RemoteDataState.Error,
      RemoteDataState.NotStarted,
      RemoteDataState.Done,
    ].forEach(newVal => {
      const state = [initialSelectorState(0), initialSelectorState(1)]
      const reducedState = reducer(state, setValuesStatus(1, newVal))
      expect(reducedState).toEqual([
        state[0],
        {...state[1], valuesStatus: newVal},
      ])
      expect(Object.is(state, reducedState)).toBe(false)
      expect(Object.is(state[1], reducedState[1])).toBe(false)
    })
  })
  it('should handle setKeysStatus', () => {
    expect(
      reducer(initialState, setKeysStatus(0, RemoteDataState.Error))
    ).toEqual(initialState)
    ;[
      RemoteDataState.Loading,
      RemoteDataState.Error,
      RemoteDataState.NotStarted,
      RemoteDataState.Done,
    ].forEach(newVal => {
      const state = [
        initialSelectorState(0),
        initialSelectorState(1),
        initialSelectorState(2),
        initialSelectorState(3),
      ]
      const reducedState = reducer(state, setKeysStatus(1, newVal))
      expect(reducedState).toEqual([
        {...state[0]},
        {
          ...state[1],
          keysStatus: newVal,
          ...(newVal === RemoteDataState.Loading
            ? {valuesStatus: RemoteDataState.NotStarted}
            : {}),
        },
        {
          ...state[2],
          ...(newVal === RemoteDataState.Loading
            ? {keysStatus: RemoteDataState.NotStarted}
            : {}),
        },
        {
          ...state[3],
          ...(newVal === RemoteDataState.Loading
            ? {keysStatus: RemoteDataState.NotStarted}
            : {}),
        },
      ])
      expect(Object.is(state, reducedState)).toBe(false)
      expect(Object.is(state[1], reducedState[1])).toBe(false)
      expect(Object.is(state[2], reducedState[2])).toBe(
        newVal !== RemoteDataState.Loading
      )
      expect(Object.is(state[3], reducedState[3])).toBe(
        newVal !== RemoteDataState.Loading
      )
    })
  })
})
