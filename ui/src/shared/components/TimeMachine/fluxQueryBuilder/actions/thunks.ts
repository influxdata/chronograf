import {Dispatch} from 'react'
import {
  BuilderAggregateFunctionType,
  RemoteDataState,
  Source,
  TimeRange,
} from 'src/types'
import {isCancellationError} from 'src/types/promises'
import queryBuilderFetcher from '../apis/queryBuilderFetcher'
import {QueryBuilderState} from '../types'

import * as tagActions from './tags'
import * as bucketActions from './buckets'

type GetState = () => {fluxQueryBuilder: QueryBuilderState}

// We don't show these columns in results but they're able to be grouped on for most queries
const ADDITIONAL_GROUP_BY_COLUMNS = ['_start', '_stop', '_time']

export const removeTagSelectorThunk = (
  source: Source,
  timeRange: TimeRange,
  tagIndex: number
) => (
  dispatch: Dispatch<
    tagActions.TagSelectorAction | ReturnType<typeof loadTagSelectorThunk>
  >
) => {
  queryBuilderFetcher.cancelFindValues(tagIndex)
  queryBuilderFetcher.cancelFindKeys(tagIndex)

  dispatch(tagActions.removeTagSelector(tagIndex))
  dispatch(loadTagSelectorThunk(source, timeRange, tagIndex))
}

export const loadTagSelectorThunk = (
  source: Source,
  timeRange: TimeRange,
  tagIndex: number
) => async (
  dispatch: Dispatch<
    | ReturnType<typeof tagActions.setKeysStatus>
    | ReturnType<typeof tagActions.selectKey>
    | ReturnType<typeof tagActions.setKeys>
    | ReturnType<typeof loadTagSelectorValuesThunk>
  >,
  getState: GetState
) => {
  const {
    fluxQueryBuilder: {
      tags,
      buckets: {selectedBucket},
    },
  } = getState()

  if (tagIndex < 0 || !tags[tagIndex] || !selectedBucket) {
    return
  }
  const tagState = tags[tagIndex]

  try {
    if (tagState.aggregateFunctionType === 'filter') {
      const searchTerm = tagState.keysSearchTerm
      dispatch(tagActions.setKeysStatus(tagIndex, RemoteDataState.Loading))
      const {result: keys, truncated} = await queryBuilderFetcher.findKeys(
        tagIndex,
        {
          source,
          bucket: selectedBucket,
          searchTerm,
          timeRange,
          tagsSelections: tags
            .slice(0, tagIndex)
            .filter(x => x.aggregateFunctionType === 'filter'),
        }
      )

      const {tagKey: key} = tagState

      if (!key) {
        let defaultKey: string

        if (tagIndex === 0 && keys.includes('_measurement')) {
          defaultKey = '_measurement'
        } else {
          defaultKey = keys[0]
          // auto-select _field as the last option, older InfluxDB v1
          // will returns tags values with preceeding _field tag selector
          if (defaultKey === '_field' && keys.length > 1) {
            defaultKey = keys[1]
          }
        }

        dispatch(tagActions.selectKey(tagIndex, defaultKey))
      } else if (!keys.includes(key)) {
        // Even if the selected key didn't come back in the results, let it be
        // selected anyway
        keys.unshift(key)
      }

      dispatch(tagActions.setKeys(tagIndex, keys, truncated))
    }
    dispatch(loadTagSelectorValuesThunk(source, timeRange, tagIndex))
  } catch (e) {
    if (isCancellationError(e)) {
      return
    }

    console.error(e)
    dispatch(tagActions.setKeysStatus(tagIndex, RemoteDataState.Error))
  }
}

const loadTagSelectorValuesThunk = (
  source: Source,
  timeRange: TimeRange,
  tagIndex: number
) => async (
  dispatch: Dispatch<
    | ReturnType<typeof tagActions.setValuesStatus>
    | ReturnType<typeof tagActions.setValues>
    | ReturnType<typeof tagActions.selectValues>
    | ReturnType<typeof loadTagSelectorValuesThunk>
  >,
  getState: GetState
) => {
  const {
    fluxQueryBuilder: {
      tags,
      buckets: {selectedBucket},
    },
  } = getState()

  if (tagIndex < 0 || !tags[tagIndex] || !selectedBucket) {
    return
  }

  const tagState = tags[tagIndex]

  try {
    let values: string[]
    const originalSelected = tagState.tagValues || []
    let selectedValues = originalSelected
    if (tagState.aggregateFunctionType === 'filter') {
      dispatch(tagActions.setValuesStatus(tagIndex, RemoteDataState.Loading))
      if (tagState.tagKey) {
        const data = await queryBuilderFetcher.findValues(tagIndex, {
          source,
          bucket: selectedBucket,
          tagsSelections: tags
            .slice(0, tagIndex)
            .filter(x => x.aggregateFunctionType === 'filter'),
          key: tagState.tagKey,
          searchTerm: tagState.valuesSearchTerm,
          timeRange,
        })
        values = data.result
        for (const selectedValue of tagState.tagValues) {
          // Even if the selected values didn't come back in the results, let them
          // be selected anyway
          if (!values.includes(selectedValue)) {
            values.unshift(selectedValue)
          }
        }
      } else {
        values = []
        selectedValues = originalSelected.length ? [] : originalSelected
      }
    } else {
      values = tags.slice(0, tagIndex).reduce((acc, tag) => {
        if (tag.aggregateFunctionType === 'filter' && tag.tagKey) {
          acc.push(tag.tagKey)
        }
        return acc
      }, [])
      values = [...values, ...ADDITIONAL_GROUP_BY_COLUMNS]
      const valuesSearchTerm = (tagState.valuesSearchTerm || '').toLowerCase()
      values = values.filter(x => x.includes(valuesSearchTerm))
      selectedValues = tagState.tagValues.filter(x => values.includes(x))
    }

    dispatch(tagActions.setValues(tagIndex, values))
    if (selectedValues !== originalSelected) {
      dispatch(tagActions.selectValues(tagIndex, selectedValues))
    }
    dispatch(loadTagSelectorThunk(source, timeRange, tagIndex + 1))
  } catch (e) {
    if (isCancellationError(e)) {
      return
    }

    console.error(e)
    dispatch(tagActions.setValuesStatus(tagIndex, RemoteDataState.Error))
  }
}

export const loadBucketsThunk = (
  source: Source,
  timeRange: TimeRange
) => async (
  dispatch: Dispatch<
    | ReturnType<typeof bucketActions.setBucketsStatus>
    | ReturnType<typeof bucketActions.selectBucket>
    | ReturnType<typeof bucketActions.setBuckets>
    | ReturnType<typeof selectBucketThunk>
  >,
  getState: GetState
) => {
  dispatch(bucketActions.setBucketsStatus(RemoteDataState.Loading))

  try {
    const {result: allBuckets} = await queryBuilderFetcher.findBuckets(source, {
      limit: -1,
    })

    const systemBuckets = allBuckets.filter(b => b.startsWith('_'))
    const userBuckets = allBuckets.filter(b => !b.startsWith('_'))
    const buckets = [...userBuckets, ...systemBuckets]

    dispatch(bucketActions.setBuckets(buckets))
    dispatch(bucketActions.setBucketsStatus(RemoteDataState.Done))

    const {
      fluxQueryBuilder: {
        buckets: {selectedBucket},
      },
    } = getState()
    if (selectedBucket && buckets.includes(selectedBucket)) {
      dispatch(selectBucketThunk(source, timeRange, selectedBucket))
    } else {
      dispatch(selectBucketThunk(source, timeRange, buckets[0], true))
    }
  } catch (e) {
    if (e.name === 'CancellationError') {
      return
    }

    console.error(e)
    dispatch(bucketActions.setBucketsStatus(RemoteDataState.Error))
  }
}

export const selectBucketThunk = (
  source: Source,
  timeRange: TimeRange,
  bucket: string,
  resetSelections: boolean = false
) => (
  dispatch: Dispatch<
    | ReturnType<typeof bucketActions.selectBucket>
    | ReturnType<typeof tagActions.reset>
    | ReturnType<typeof loadTagSelectorThunk>
  >
) => {
  dispatch(bucketActions.selectBucket(bucket))
  if (resetSelections) {
    queryBuilderFetcher.cancelPendingQueries()
    dispatch(tagActions.reset())
  }
  dispatch(loadTagSelectorThunk(source, timeRange, 0))
}

export const selectTagKeyThunk = (
  source: Source,
  timeRange: TimeRange,
  tagIndex: number,
  key: string
) => (
  dispatch: Dispatch<
    | ReturnType<typeof tagActions.selectKey>
    | ReturnType<typeof loadTagSelectorValuesThunk>
  >
) => {
  dispatch(tagActions.selectKey(tagIndex, key))
  dispatch(loadTagSelectorValuesThunk(source, timeRange, tagIndex))
}

export const selectTagValuesThunk = (
  source: Source,
  timeRange: TimeRange,
  tagIndex: number,
  values: string[]
) => (
  dispatch: Dispatch<
    | ReturnType<typeof tagActions.selectValues>
    | ReturnType<typeof addTagSelectorThunk>
    | ReturnType<typeof loadTagSelectorThunk>
  >,
  getState: GetState
) => {
  const {
    fluxQueryBuilder: {tags},
  } = getState()
  const currentTag = tags[tagIndex]
  if (!currentTag) {
    return
  }
  dispatch(tagActions.selectValues(tagIndex, values))

  // don't add a new tag filter if we're grouping
  if (currentTag.aggregateFunctionType === 'group') {
    return
  }

  if (tagIndex === tags.length - 1 && values.length) {
    dispatch(addTagSelectorThunk(source, timeRange))
  } else {
    dispatch(loadTagSelectorThunk(source, timeRange, tagIndex + 1))
  }
}
export const addTagSelectorThunk = (source: Source, timeRange: TimeRange) => (
  dispatch: Dispatch<
    | ReturnType<typeof tagActions.addTagSelector>
    | ReturnType<typeof loadTagSelectorThunk>
  >,
  getState: GetState
) => {
  dispatch(tagActions.addTagSelector())
  const {
    fluxQueryBuilder: {tags},
  } = getState()
  dispatch(
    loadTagSelectorThunk(source, timeRange, tags[tags.length - 1].tagIndex)
  )
}

export const searchTagValuesThunk = (
  source: Source,
  timeRange: TimeRange,
  tagIndex: number
) => (dispatch: Dispatch<ReturnType<typeof loadTagSelectorValuesThunk>>) => {
  dispatch(loadTagSelectorValuesThunk(source, timeRange, tagIndex))
}

export const searchTagKeysThunk = (
  source: Source,
  timeRange: TimeRange,
  tagIndex: number
) => (dispatch: Dispatch<ReturnType<typeof loadTagSelectorThunk>>) => {
  dispatch(loadTagSelectorThunk(source, timeRange, tagIndex))
}

export const changeFunctionTypeThunk = (
  source: Source,
  timeRange: TimeRange,
  tagIndex: number,
  type: BuilderAggregateFunctionType
) => (
  dispatch: Dispatch<
    | ReturnType<typeof loadTagSelectorThunk>
    | ReturnType<typeof tagActions.changeFunctionType>
  >
) => {
  dispatch(tagActions.changeFunctionType(tagIndex, type))
  dispatch(loadTagSelectorThunk(source, timeRange, tagIndex))
}
