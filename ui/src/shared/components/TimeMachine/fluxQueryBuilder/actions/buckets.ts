import {RemoteDataState} from 'src/types'

export type BucketSelectorAction =
  | ReturnType<typeof changeBucketsState>
  | ReturnType<typeof selectBucket>
  | ReturnType<typeof filterBuckets>

export function changeBucketsState(state: RemoteDataState, buckets?: string[]) {
  return {
    type: 'FQB_BUCKETS_CHANGE' as const,
    payload: {
      state,
      buckets,
    },
  }
}

export function selectBucket(bucket: string) {
  return {
    type: 'FQB_BUCKETS_SELECT' as const,
    payload: {
      bucket,
    },
  }
}

export function filterBuckets(term: string) {
  return {
    type: 'FQB_BUCKETS_FILTER' as const,
    payload: {
      term,
    },
  }
}
