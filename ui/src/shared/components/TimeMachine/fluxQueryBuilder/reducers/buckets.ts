import {RemoteDataState} from 'src/types'
import {BucketSelectorAction} from '../actions/buckets'
import {BucketSelectorState} from '../types'

export const initialState: BucketSelectorState = {
  selectedBucket: '',
  buckets: [],
  status: RemoteDataState.Loading,
  searchTerm: '',
}

const filterBuckets = (buckets: string[], term: string): string[] => {
  const searchTerm = term.toLocaleLowerCase()
  let list = buckets.filter((bucket: string) =>
    bucket.toLocaleLowerCase().includes(searchTerm)
  )
  if (list.length > 200) {
    list = list.slice(0, 200)
  }

  return list
}

const bucketsReducer = (
  state = initialState,
  action: BucketSelectorAction
): BucketSelectorState => {
  switch (action.type) {
    case 'FQB_BUCKETS_CHANGE': {
      const buckets = action.payload.buckets
        ? filterBuckets(action.payload.buckets, state.searchTerm)
        : state.buckets
      const selectedBucket =
        action.payload.state !== RemoteDataState.Done ||
        buckets.includes(state.selectedBucket)
          ? state.selectedBucket
          : ''
      return {
        ...state,
        status: action.payload.state,
        selectedBucket,
        buckets,
      }
    }
    case 'FQB_BUCKETS_FILTER': {
      return {
        ...state,
        buckets: filterBuckets(state.buckets, action.payload.term),
      }
    }
    case 'FQB_BUCKETS_SELECT': {
      return {
        ...state,
        selectedBucket: action.payload.bucket,
      }
    }
  }

  return state
}

export default bucketsReducer
