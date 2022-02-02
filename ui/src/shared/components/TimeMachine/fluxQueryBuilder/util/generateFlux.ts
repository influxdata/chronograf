import {TimeRange} from 'src/types'
import {BuilderTagsType, QueryBuilderState} from '../types'
import {AGG_WINDOW_AUTO, FUNCTIONS} from './constants'

export function formatTimeRangeArguments(timeRange: TimeRange): string {
  const start = timeRange.lowerFlux ? timeRange.lowerFlux : timeRange.lower
  return timeRange.upper
    ? `start: ${start}, stop: ${timeRange.upper}`
    : `start: ${start}`
}

export function tagToFlux(tag: BuilderTagsType) {
  return tag.tagValues
    .map(value => `r["${fluxString(tag.tagKey)}"] == "${fluxString(value)}"`)
    .join(' or ')
}
export function fluxString(s: string = '') {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export function buildQuery(state: QueryBuilderState): string | undefined {
  const bucket = state.buckets.selectedBucket
  if (!bucket) {
    return
  }
  let query = `from(bucket: "${fluxString(bucket)}")`
  query += '\n  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)'
  state.tags.forEach(tag => {
    query += formatTagSelectorFilter(tag)
  })

  const functions = state.aggregation.selectedFunctions
  if (functions.length === 0) {
    return query
  }
  const period = state.aggregation.period
  const fillMissing = state.aggregation.fillMissing
  return functions
    .map(fn => query + formatAggregationFunction(fn, period, fillMissing))
    .join('\n\n')
}

function formatTagSelectorFilter(tag: BuilderTagsType) {
  if (!tag.tagKey) {
    return ''
  }
  if (tag.aggregateFunctionType === 'filter') {
    if (!tag.tagValues.length) {
      return ''
    }
    return `\n  |> filter(fn: (r) => ${tagToFlux(tag)})`
  }

  if (tag.aggregateFunctionType === 'group') {
    if (!tag.tagValues?.length) {
      return '' // do not group when no values selected
    }
    return `\n  |> group(columns: [${tag.tagValues
      .map(x => `"${fluxString(x)}"`)
      .join(', ')}])`
  }
}

function formatAggregationFunction(
  fn: string,
  period: string,
  fillValues: boolean
) {
  const fnSpec = FUNCTIONS.find(spec => spec.name === fn)
  if (!fnSpec) {
    return '\n  |> yield(name: "${fn}")'
  }

  return `\n  ${fnSpec.flux(
    formatPeriod(period),
    fillValues
  )}\n  |> yield(name: "${fn}")`
}

const formatPeriod = (period: string): string => {
  if (period === AGG_WINDOW_AUTO || !period) {
    return `v.windowPeriod`
  }
  return period
}
