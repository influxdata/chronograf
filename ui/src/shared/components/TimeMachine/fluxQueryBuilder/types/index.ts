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

export const AGG_WINDOW_AUTO = 'auto'

export interface TagSelectorState extends BuilderTagsType {
  tagIndex: number
  aggregateFunctionType: BuilderAggregateFunctionType

  keysStatus: RemoteDataState
  keys: string[]
  key: string
  keysSearchTerm: string

  valuesSearchTerm: string
  valuesStatus?: RemoteDataState
  values: string[]
  selectedValues: string[]
}

export interface BuilderTagsType {
  key: string
  values: string[]
  aggregateFunctionType: BuilderAggregateFunctionType
}

export interface QueryBuilderState {
  buckets: BucketSelectorState
  aggregation: AggregationSelectorState
  tags: TagSelectorState[]
}
