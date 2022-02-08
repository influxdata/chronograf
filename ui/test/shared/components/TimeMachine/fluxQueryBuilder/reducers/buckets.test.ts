import {
  default as reducer,
  initialState,
} from 'src/shared/components/TimeMachine/fluxQueryBuilder/reducers/buckets'

import {
  filterBuckets,
  selectBucket,
  setBuckets,
  setBucketsSearchTerm,
  setBucketsStatus,
} from 'src/shared/components/TimeMachine/fluxQueryBuilder/actions/buckets'
import {RemoteDataState} from 'src/types'

describe('fluxQueryBuilder/reducers/buckets', () => {
  it('should handle FQB_BUCKETS_SEARCH_TERM', () => {
    const newVal = 'abc'
    const {searchTerm: initial, ...initialRest} = initialState
    expect(initial).toBe('')
    const reducedState = reducer(initialState, setBucketsSearchTerm(newVal))

    const {searchTerm, ...rest} = reducedState
    expect(searchTerm).toBe(newVal)
    expect(rest).toEqual(initialRest)
  })

  it('should handle FQB_BUCKETS_STATUS', () => {
    const newVal = RemoteDataState.Done
    const {status: initial, ...initialRest} = initialState
    expect(initial).toEqual(RemoteDataState.NotStarted)
    const reducedState = reducer(initialState, setBucketsStatus(newVal))

    const {status, ...rest} = reducedState
    expect(status).toBe(newVal)
    expect(rest).toEqual(initialRest)
  })
  it('should handle FQB_BUCKETS_BUCKETS', () => {
    const newVal = ['a']
    const {buckets: initial, ...initialRest} = initialState
    expect(initial).toEqual([])
    const reducedState = reducer(initialState, setBuckets(newVal))

    const {buckets, ...rest} = reducedState
    expect(buckets).toEqual(newVal)
    expect(rest).toEqual(initialRest)
  })
  it('should handle FQB_BUCKETS_SELECT', () => {
    const newVal = 'a'
    const {selectedBucket: initial, ...initialRest} = initialState
    expect(initial).toEqual('')
    const reducedState = reducer(initialState, selectBucket(newVal))

    const {selectedBucket, ...rest} = reducedState
    expect(selectedBucket).toEqual(newVal)
    expect(rest).toEqual(initialRest)
  })
  it('ignores FQB_BUCKETS_FILTER', () => {
    const reducedState = reducer(initialState, filterBuckets('newFilter'))
    expect(reducedState).toEqual(initialState)
  })
})
