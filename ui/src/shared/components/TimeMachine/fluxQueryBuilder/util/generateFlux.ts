import {TimeRange} from 'src/types'
import {BuilderTagsType} from '../types'

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
