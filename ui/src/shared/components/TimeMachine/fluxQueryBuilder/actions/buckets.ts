import {RemoteDataState} from 'src/types'

export type BucketSelectorAction =
  | ReturnType<typeof changeBucketsState>
  | ReturnType<typeof selectBucket>
  | ReturnType<typeof filterBuckets>

export function changeBucketsState(state: RemoteDataState, buckets?: string[]) {
  return {
    type: 'FQB_BUCKETS_CHANGE',
    payload: {
      state,
      buckets,
    },
  }
}

export function selectBucket(bucket: string) {
  return {
    type: 'FQB_BUCKETS_SELECT',
    payload: {
      bucket,
    },
  }
}

export function filterBuckets(term: string) {
  return {
    type: 'FQB_BUCKETS_FILTER',
    payload: {
      term,
    },
  }
}
