import {TimeRange} from 'src/types'
import {getMinDuration} from 'src/shared/parsing/flux/durations'
import {computeInterval} from 'src/tempVars/utils/replace'
import {DEFAULT_DURATION_MS} from 'src/shared/constants'

// For now we only support these template variables in Flux queries
export const DASHBOARD_TIME = 'dashboardTime'
export const UPPER_DASHBOARD_TIME = 'upperDashboardTime'
export const INTERVAL = 'autoInterval'

const INTERVAL_REGEX = /autoInterval/g

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

  let rendered = `\n${DASHBOARD_TIME} = ${dashboardTime}\n${UPPER_DASHBOARD_TIME} = ${upperDashboardTime}\n\n${script}`

  if (!script.match(INTERVAL_REGEX)) {
    return rendered
  }

  let duration: number

  try {
    duration = await getMinDuration(astLink, rendered)
  } catch (error) {
    console.error(error)
    duration = DEFAULT_DURATION_MS
  }

  const interval = computeInterval(duration)

  rendered = `${INTERVAL} = ${interval}ms\n${rendered}`

  return rendered
}
