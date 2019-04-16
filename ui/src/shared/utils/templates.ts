import {TimeRange, Template, TemplateType, TemplateValueType} from 'src/types'

// Constants
import {
  TEMP_VAR_DASHBOARD_TIME,
  TEMP_VAR_UPPER_DASHBOARD_TIME,
} from 'src/shared/constants'

export const createTimeRangeTemplates = (
  timeRange: TimeRange,
  zoomedTimeRange: TimeRange = {lower: null}
): {
  dashboardTime: Template
  upperDashboardTime: Template
} => {
  const {upper: zoomedUpper, lower: zoomedLower} = zoomedTimeRange
  const {upper, lower} = timeRange
  const low = zoomedLower || lower
  const up = zoomedUpper || upper

  const lowerTemplateType =
    low && low.includes(':') ? TemplateType.TimeStamp : TemplateType.Constant
  const upperTemplateType =
    up && up.includes(':') ? TemplateType.TimeStamp : TemplateType.Constant
  const lowerTemplateValueType =
    low && low.includes(':')
      ? TemplateValueType.TimeStamp
      : TemplateValueType.Constant
  const upperTemplateValueType =
    up && up.includes(':')
      ? TemplateValueType.TimeStamp
      : TemplateValueType.Constant

  const dashboardTime: Template = {
    id: 'dashtime',
    tempVar: TEMP_VAR_DASHBOARD_TIME,
    type: lowerTemplateType,
    label: '',
    values: [
      {
        value: low,
        type: lowerTemplateValueType,
        selected: true,
        localSelected: true,
      },
    ],
  }

  const upperDashboardTime: Template = {
    id: 'upperdashtime',
    tempVar: TEMP_VAR_UPPER_DASHBOARD_TIME,
    type: upperTemplateType,
    label: '',
    values: [
      {
        value: up || 'now()',
        type: upperTemplateValueType,
        selected: true,
        localSelected: true,
      },
    ],
  }

  return {dashboardTime, upperDashboardTime}
}
