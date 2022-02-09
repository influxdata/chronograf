import {RemoteDataState} from 'src/types'
import {BucketSelectorAction} from '../actions/buckets'
import {BucketSelectorState} from '../types'

export const initialState: BucketSelectorState = {
  selectedBucket: '',
  buckets: [],
  status: RemoteDataState.NotStarted,
  searchTerm: '',
}

const bucketsReducer = (
  state = initialState,
  action: BucketSelectorAction
): BucketSelectorState => {
  switch (action.type) {
    case 'FQB_BUCKETS_SEARCH_TERM': {
      return {
        ...state,
        searchTerm: action.payload.term,
      }
    }
    case 'FQB_BUCKETS_SELECT': {
      return {
        ...state,
        selectedBucket: action.payload.bucket,
      }
    }
    case 'FQB_BUCKETS_STATUS': {
      return {
        ...state,
        status: action.payload.status,
      }
    }
    case 'FQB_BUCKETS_BUCKETS': {
      return {
        ...state,
        buckets: action.payload.buckets,
      }
    }
  }

  return state
}

export default bucketsReducer
