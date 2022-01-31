// APIs
import {runQuery, RunQueryResult} from 'src/shared/apis/flux/cancellableQuery'

// Types
import {TimeRange, Source} from 'src/types'
import {CancelBox} from 'src/types/promises'
import {parseResponse} from 'src/shared/parsing/flux/response'
import {BuilderTagsType} from '../types'

const DEFAULT_TIME_RANGE: TimeRange = {lower: 'now() - 30d', lowerFlux: '-30d'}
const DEFAULT_LIMIT = 200

export interface FindBucketsOptions {
  url: string
  orgID: string
}

export function findBuckets(source: Source): CancelBox<string[]> {
  const query = `buckets()
  |> sort(columns: ["name"])
  |> limit(n: ${DEFAULT_LIMIT})`

  return extractBoxedCol(runQuery(source, query), 'name')
}

export interface FindKeysOptions {
  source: Source
  bucket: string
  tagsSelections: BuilderTagsType[]
  searchTerm?: string
  timeRange?: TimeRange
  limit?: number
}

export function findKeys({
  source,
  bucket,
  tagsSelections,
  searchTerm = '',
  timeRange = DEFAULT_TIME_RANGE,
  limit = DEFAULT_LIMIT,
}: FindKeysOptions): CancelBox<string[]> {
  const tagFilters = formatTagFilterPredicate(tagsSelections)
  const previousKeyFilter = formatTagKeyFilterCall(tagsSelections)
  const timeRangeArguments = formatTimeRangeArguments(timeRange)

  // requires Flux package to work which we will put in the query
  const searchFilter = !searchTerm
    ? ''
    : `\n  |> filter(fn: (r) => r._value =~ regexp.compile(v: "(?i:" + regexp.quoteMeta(v: "${searchTerm}") + ")"))`

  const query = `import "regexp"
  
  from(bucket: "${bucket}")
  |> range(${timeRangeArguments})
  |> filter(fn: ${tagFilters})
  |> keys()
  |> keep(columns: ["_value"])
  |> distinct()${searchFilter}${previousKeyFilter}
  |> filter(fn: (r) => r._value != "_time" and r._value != "_start" and r._value !=  "_stop" and r._value != "_value")
  |> sort()
  |> limit(n: ${limit})`

  return extractBoxedCol(runQuery(source, query), '_value')
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
  limit = DEFAULT_LIMIT,
}: FindValuesOptions): CancelBox<string[]> {
  const tagFilters = formatTagFilterPredicate(tagsSelections)
  const timeRangeArguments = formatTimeRangeArguments(timeRange)

  // requires Flux package to work which we will put in the query
  const searchFilter = !searchTerm
    ? ''
    : `\n  |> filter(fn: (r) => r._value =~ regexp.compile(v: "(?i:" + regexp.quoteMeta(v: "${searchTerm}") + ")"))`

  // TODO: Use the `v1.tagValues` function from the Flux standard library once
  // this issue is resolved: https://github.com/influxdata/flux/issues/1071
  const query = `import "regexp"
  
  from(bucket: "${bucket}")
  |> range(${timeRangeArguments})
  |> filter(fn: ${tagFilters})
  |> keep(columns: ["${key}"])
  |> group()
  |> distinct(column: "${key}")${searchFilter}
  |> limit(n: ${limit})
  |> sort()`

  return extractBoxedCol(runQuery(source, query), '_value')
}

export function extractBoxedCol(
  resp: CancelBox<RunQueryResult>,
  colName: string
): CancelBox<string[]> {
  const promise = resp.promise.then<string[]>(result => {
    return extractCol(result.csv, colName)
  })

  return {promise, cancel: resp.cancel}
}

export function extractCol(csv: string, colName: string): string[] {
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

export function formatTagFilterPredicate(tagsSelections: BuilderTagsType[]) {
  const validSelections = tagsSelections.filter(
    ({tagKey: key, values}) => key && values.length
  )

  if (!validSelections.length) {
    return '(r) => true'
  }

  const calls = validSelections.map(tag => `(${tagToFlux(tag)})`).join(' and ')

  return `(r) => ${calls}`
}

export function formatTagKeyFilterCall(tagsSelections: BuilderTagsType[]) {
  const keys = tagsSelections.map(({tagKey: key}) => key)

  if (!keys.length) {
    return ''
  }

  const fnBody = keys.map(key => `r._value != "${key}"`).join(' and ')

  return `\n  |> filter(fn: (r) => ${fnBody})`
}

export function formatTimeRangeArguments(timeRange: TimeRange): string {
  const start = timeRange.lowerFlux ? timeRange.lowerFlux : timeRange.lower
  return timeRange.upper
    ? `start: ${start}, stop: ${timeRange.upper}`
    : `start: ${start}`
}

export function tagToFlux(tag: BuilderTagsType) {
  return tag.values
    .map(
      value =>
        `r["${tag.tagKey}"] == "${value
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')}"`
    )
    .join(' or ')
}
