import {TimeRange} from 'src/types'

export const addTemplatesToScript = (
  script: string,
  timeRange: TimeRange
): string => {
  // only support dash times for now
  let {lower: lowerTime} = timeRange
  let {upper: upperTime} = timeRange

  if (!upperTime) {
    const {lowerFlux = '-1h'} = timeRange
    lowerTime = lowerFlux
    upperTime = new Date().toISOString()
  }

  const tempVarScript = `dashboardTime = ${lowerTime}\n\nupperDashboardTime = ${upperTime}`

  return `${tempVarScript}\n\n${script}`
}
