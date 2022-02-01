import moment from 'moment'
import {fluxPeriodFromRangeSeconds} from 'src/tempVars/utils/replace'
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

export default timeRangeWindowPeriod
