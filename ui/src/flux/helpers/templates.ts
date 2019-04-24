import {TimeRange} from 'src/types'
import {computeInterval} from 'src/tempVars/utils/replace'
import {DEFAULT_DURATION_MS} from 'src/shared/constants'
import {extractImports} from 'src/shared/parsing/flux/extractImports'
import {getMinDuration} from 'src/shared/parsing/flux/durations'

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

  const {imports, body} = await extractImports(astLink, script)

  let variables = `${DASHBOARD_TIME} = ${dashboardTime}\n${UPPER_DASHBOARD_TIME} = ${upperDashboardTime}`
  let rendered = `${variables}\n\n${body}`

  if (!script.match(INTERVAL_REGEX)) {
    return `${imports}\n${rendered}`
  }

  let duration: number

  try {
    duration = await getMinDuration(astLink, rendered)
  } catch (error) {
    console.error(error)
    duration = DEFAULT_DURATION_MS
  }

  const interval = computeInterval(duration)
  variables += `\n${INTERVAL} = ${interval}ms`

  rendered = `${imports}\n${variables}\n${body}`

  return rendered
}
