// APIs
import {runQuery, RunQueryResult} from 'src/shared/apis/flux/cancellableQuery'

// Types
import {TimeRange, Source} from 'src/types'
import {CancelBox} from 'src/types/promises'
import {parseResponse} from 'src/shared/parsing/flux/response'
import {BuilderTagsType} from '../types'
import {formatTimeRangeArguments, tagToFlux} from '../util/generateFlux'
import fluxString from 'src/flux/helpers/fluxString'

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
  const tagFilter = formatTagFilter(tagsSelections)
  const previousKeyFilter = formatTagKeyFilterCall(tagsSelections)
  const timeRangeArguments = formatTimeRangeArguments(timeRange)

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
  const tagFilter = formatTagFilter(tagsSelections)
  const timeRangeArguments = formatTimeRangeArguments(timeRange)

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
