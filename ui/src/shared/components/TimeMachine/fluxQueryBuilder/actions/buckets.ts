import {RemoteDataState} from 'src/types'

export type BucketSelectorAction =
  | ReturnType<typeof changeBucketsState>
  | ReturnType<typeof selectBucket>
  | ReturnType<typeof setBuckets>
  | ReturnType<typeof setBucketsStatus>
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

export function setBucketsStatus(status: RemoteDataState) {
  return {
    type: 'FQB_BUCKETS_STATUS' as const,
    payload: {
      status,
    },
  }
}

export function setBuckets(buckets: string[]) {
  return {
    type: 'FQB_BUCKETS_BUCKETS' as const,
    payload: {
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
