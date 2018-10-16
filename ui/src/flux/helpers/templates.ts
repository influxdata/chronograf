import {TimeRange} from 'src/types'
import {getMinDuration} from 'src/shared/parsing/flux/durations'
import {
  DEFAULT_PIXELS,
  DEFAULT_DURATION_MS,
  RESOLUTION_SCALE_FACTOR,
} from 'src/shared/constants'

// For now we only support these template variables in Flux queries
const DASHBOARD_TIME = 'dashboardTime'
const UPPER_DASHBOARD_TIME = 'upperDashboardTime'
const INTERVAL = 'autoInterval'

const INTERVAL_REGEX = /autoInterval/g

export const renderTemplatesInScript = async (
  script: string,
  timeRange: TimeRange,
  astLink: string,
  maxSideLength: number = DEFAULT_PIXELS
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

  let rendered = `${DASHBOARD_TIME} = ${dashboardTime}\n\n${UPPER_DASHBOARD_TIME} = ${upperDashboardTime}\n\n${script}`

  if (!script.match(INTERVAL_REGEX)) {
    return rendered
  }

  let duration: number

  try {
    duration = await getMinDuration(astLink, rendered)
  } catch (error) {
    duration = DEFAULT_DURATION_MS
  }

  const interval = duration / (maxSideLength * RESOLUTION_SCALE_FACTOR)

  rendered = `${INTERVAL} = ${Math.floor(interval)}ms\n\n${rendered}`

  return rendered
}
