import {TimeRange} from 'src/types'

export default function rangeArguments(timeRange: TimeRange): string {
  const start = timeRange.lowerFlux ? timeRange.lowerFlux : timeRange.lower
  return timeRange.upper && timeRange.upper !== 'now()'
    ? `start: ${start}, stop: ${timeRange.upper}`
    : `start: ${start}`
}
