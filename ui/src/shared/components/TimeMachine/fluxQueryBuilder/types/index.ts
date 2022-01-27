import {RemoteDataState} from 'src/types'

export interface BucketSelectorState {
  selectedBucket?: string
  buckets: string[]
  status: RemoteDataState
  searchTerm: string
}
