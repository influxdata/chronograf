// APIs
import {runQuery, RunQueryResult} from 'src/shared/apis/flux/cancellableQuery'

// Types
import {TimeRange, Source} from 'src/types'
import {CancelBox} from 'src/types/promises'
import {parseResponse} from 'src/shared/parsing/flux/response'
import {BuilderTagsType} from '../types'
import {tagToFlux} from '../util/generateFlux'
import fluxString from 'src/flux/helpers/fluxString'
import rangeArguments from 'src/flux/helpers/rangeArguments'

const DEFAULT_TIME_RANGE: TimeRange = {lower: 'now() - 30d', lowerFlux: '-30d'}
export const FQB_RESULTS_LIMIT = 200

export interface FindBucketsOptions {
  limit: number
}

export function findBuckets(
  source: Source,
  {limit}: FindBucketsOptions
): CancelBox<TruncatedResult<string[]>> {
  const query = `buckets()
  |> sort(columns: ["name"])${limit > 0 ? ` |> limit(n: ${limit})` : ''}`

  return extractBoxedCol(runQuery(source, query), 'name', limit)
}

export interface FindKeysOptions {
  source: Source
  bucket: string
  tagsSelections: BuilderTagsType[]
  searchTerm?: string
  timeRange?: TimeRange
  limit: number
}

export interface TruncatedResult<T> {
  result: T
  truncated: boolean
}

export function findKeys({
  source,
  bucket,
  tagsSelections,
  searchTerm = '',
  timeRange = DEFAULT_TIME_RANGE,
  limit = FQB_RESULTS_LIMIT,
}: FindKeysOptions): CancelBox<TruncatedResult<string[]>> {
  const tagFilter = formatTagFilter(tagsSelections)
  const previousKeyFilter = formatTagKeyFilterCall(tagsSelections)
  const timeRangeArguments = rangeArguments(timeRange)

  // requires Flux package to work which we will put in the query
  const searchFilter = !searchTerm
    ? ''
    : `\n  |> filter(fn: (r) => r._value =~ regexp.compile(v: "(?i:" + regexp.quoteMeta(v: "${searchTerm}") + ")"))`

  const query = `import "regexp"
  
from(bucket: "${bucket}")
  |> range(${timeRangeArguments})${tagFilter}
  |> keys()
  |> keep(columns: ["_value"])
  |> distinct()${searchFilter}${previousKeyFilter}
  |> filter(fn: (r) => r._value != "_time" and r._value != "_start" and r._value !=  "_stop" and r._value != "_value")
  |> sort()
  |> limit(n: ${limit})`

  return extractBoxedCol(runQuery(source, query), '_value', limit)
}

export interface FindValuesOptions {
  source: Source
  bucket: string
  tagsSelections: BuilderTagsType[]
  key: string
  searchTerm?: string
  timeRange?: TimeRange
  limit?: number
}

export function findValues({
  source,
  bucket,
  tagsSelections,
  key,
  searchTerm = '',
  timeRange = DEFAULT_TIME_RANGE,
  limit = FQB_RESULTS_LIMIT,
}: FindValuesOptions): CancelBox<TruncatedResult<string[]>> {
  const tagFilter = formatTagFilter(tagsSelections)
  const timeRangeArguments = rangeArguments(timeRange)

  // requires Flux package to work which we will put in the query
  const searchFilter = !searchTerm
    ? ''
    : `\n  |> filter(fn: (r) => r._value =~ regexp.compile(v: "(?i:" + regexp.quoteMeta(v: ${fluxString(
        searchTerm
      )}) + ")"))`

  // 1.x InfluxDB produce wrong results when _field tag is filtered,
  // experiments showed that keeping an extra column is a workaround
  const v1ExtraKeep =
    (source.version || '').startsWith('1.') &&
    tagsSelections.some(x => x.tagKey === '_field' && x.tagValues?.length)
      ? ', "_field"'
      : ''

  const query = `import "regexp"
  
from(bucket: ${fluxString(bucket)})
  |> range(${timeRangeArguments})${tagFilter}
  |> keep(columns: [${fluxString(key)}${v1ExtraKeep}])
  |> group()
  |> distinct(column: ${fluxString(key)})${searchFilter}
  |> sort()
  |> limit(n: ${limit})`

  return extractBoxedCol(runQuery(source, query), '_value', limit)
}

function extractBoxedCol(
  resp: CancelBox<RunQueryResult>,
  colName: string,
  limit: number
): CancelBox<TruncatedResult<string[]>> {
  const promise = resp.promise.then(({csv}) => {
    const result = extractCol(csv, colName)
    return {result, truncated: result.length === limit}
  })

  return {promise, cancel: resp.cancel}
}

function extractCol(csv: string, colName: string): string[] {
  const tables = parseResponse(csv)
  if (tables && tables.length > 0) {
    const data = tables[0].data
    if (data.length > 1) {
      const columnIndex = data[0].indexOf(colName)
      if (columnIndex > 0) {
        return data.slice(1).map(arr => arr[columnIndex] as string)
      }
    }
  }
  return []
}

export function formatTagFilter(tagsSelections: BuilderTagsType[]) {
  const validSelections = tagsSelections.filter(
    ({tagKey, tagValues}) => tagKey && tagValues.length
  )

  if (!validSelections.length) {
    return ''
  }

  const body = validSelections.map(tag => `(${tagToFlux(tag)})`).join(' and ')

  return `\n  |> filter(fn: (r) => ${body})`
}

export function formatTagKeyFilterCall(tagsSelections: BuilderTagsType[]) {
  const keys = tagsSelections.map(({tagKey: key}) => key)

  if (!keys.length) {
    return ''
  }

  const fnBody = keys.map(key => `r._value != ${fluxString(key)}`).join(' and ')

  return `\n  |> filter(fn: (r) => ${fnBody})`
}
