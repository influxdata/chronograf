import {RemoteDataState} from 'src/types'

export type BucketSelectorAction =
  | ActionChangeBucketsState
  | ActionSelectBucket
  | ActionFilterBuckets

export interface ActionChangeBucketsState {
  type: 'FQB_BUCKETS_CHANGE'
  payload: {
    state: RemoteDataState
    buckets?: string[]
  }
}
export function changeBucketsState(
  state: RemoteDataState,
  buckets?: string[]
): ActionChangeBucketsState {
  return {
    type: 'FQB_BUCKETS_CHANGE',
    payload: {
      state,
      buckets,
    },
  }
}

export interface ActionSelectBucket {
  type: 'FQB_BUCKETS_SELECT'
  payload: {
    bucket: string
  }
}
export function selectBucket(bucket: string): ActionSelectBucket {
  return {
    type: 'FQB_BUCKETS_SELECT',
    payload: {
      bucket,
    },
  }
}

export interface ActionFilterBuckets {
  type: 'FQB_BUCKETS_FILTER'
  payload: {
    term: string
  }
}
export function filterBuckets(term: string): ActionFilterBuckets {
  return {
    type: 'FQB_BUCKETS_FILTER',
    payload: {
      term,
    },
  }
}
