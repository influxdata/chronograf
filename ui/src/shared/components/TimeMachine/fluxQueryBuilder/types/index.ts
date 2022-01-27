import {BuilderAggregateFunctionType, RemoteDataState} from 'src/types'

export interface BucketSelectorState {
  selectedBucket?: string
  buckets: string[]
  status: RemoteDataState
  searchTerm: string
}

export interface AggregationSelectorState {
  period: string
  fillMissing: boolean
  selectedFunctions: string[]
}

export interface TagSelectorState {
  index: number
  aggregateFunctionType: BuilderAggregateFunctionType

  keysStatus: RemoteDataState
  keys: string[]
  selectedKey: string
  keysSearchTerm: string

  valuesSearchTerm: string
  valuesStatus: RemoteDataState
  values: string[]
  selectedValues: string[]
}
