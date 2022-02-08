import moment from 'moment'
import {DESIRED_POINTS_PER_GRAPH} from 'src/tempVars/utils/replace'
import {TimeRange} from 'src/types'

function timeRangeWindowPeriod(timeRange: TimeRange | undefined) {
  if (timeRange) {
    if (timeRange.seconds) {
      return fluxPeriodFromRangeSeconds(timeRange.seconds)
    }
    // calculate from upper / lower
    const seconds = Math.round(
      moment(timeRange.upper).diff(moment(timeRange.lower)) / 1000
    )
    return fluxPeriodFromRangeSeconds(seconds)
  }
}

export function fluxPeriodFromRangeSeconds(seconds: number) {
  seconds = Math.round(seconds / DESIRED_POINTS_PER_GRAPH)
  if (!(seconds > 1)) {
    return '1s'
  }
  let retVal = ''
  if (seconds >= 86400) {
    retVal += `${Math.trunc(seconds / 86400)}d`
    seconds %= 86400
  }
  if (seconds >= 3600) {
    retVal += `${Math.trunc(seconds / 3600)}h`
    seconds %= 3600
  }
  if (seconds >= 60) {
    retVal += `${Math.trunc(seconds / 60)}m`
    seconds %= 60
    return seconds === 0 ? retVal : `${retVal}${seconds}s`
  }
  if (seconds > 0) {
    retVal += `${seconds}s`
  }
  return retVal
}

export default timeRangeWindowPeriod
