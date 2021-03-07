import {TimeRange} from 'src/types'
import {computeInterval} from 'src/tempVars/utils/replace'
import {DEFAULT_DURATION_MS} from 'src/shared/constants'
import {extractImports} from 'src/shared/parsing/flux/extractImports'
import {getMinDuration} from 'src/shared/parsing/flux/durations'

// template variables used since 1.9 (compatible with v2)
export const TIMERANGE_START = 'v.timeRangeStart'
export const TIMERANGE_STOP = 'v.timeRangeStop'
export const WINDOW_PERIOD = 'v.windowPeriod'

const INTERVAL_REGEX = /autoInterval|v\.windowPeriod/g

function fluxVariables(
  lower: string,
  upper: string,
  interval?: number
): string {
  // dashboardTime, upperDashboardTime and autoInterval are added for bacward compatibility with 1.8.x
  if (interval) {
    return `dashboardTime = ${lower}\nupperDashboardTime = ${upper}\nautoInterval = ${interval}ms\nv = { timeRangeStart: dashboardTime , timeRangeStop: upperDashboardTime , windowPeriod: autoInterval }`
  }
  return `dashboardTime = ${lower}\nupperDashboardTime = ${upper}\nv = { timeRangeStart: dashboardTime , timeRangeStop: upperDashboardTime }`
}

export const renderTemplatesInScript = async (
  script: string,
  timeRange: TimeRange,
  astLink: string
): Promise<string> => {
  let dashboardTime: string
  let upperDashboardTime: string

  if (timeRange.upper) {
    dashboardTime = timeRange.lower
    upperDashboardTime = timeRange.upper
  } else {
    dashboardTime = timeRange.lowerFlux || '1h'
    upperDashboardTime = new Date().toISOString()
  }

  const {imports, body} = await extractImports(astLink, script)

  let variables = fluxVariables(dashboardTime, upperDashboardTime)
  let rendered = `${variables}\n\n${body}`

  if (!script.match(INTERVAL_REGEX)) {
    return `${imports}\n\n${rendered}`
  }

  let duration: number

  try {
    duration = await getMinDuration(astLink, rendered)
  } catch (error) {
    console.error(error)
    duration = DEFAULT_DURATION_MS
  }

  const interval = computeInterval(duration)
  variables = fluxVariables(dashboardTime, upperDashboardTime, interval)

  rendered = `${imports}\n\n${variables}\n\n${body}`

  return rendered
}
