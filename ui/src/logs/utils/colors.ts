import {color} from 'd3-color'

import {SeverityColorValues, DEFAULT_SEVERITY_LEVELS} from 'src/logs/constants'

import {ColorScale} from 'src/types/histogram'

const DEFAULT_COLOR_VALUE = SeverityColorValues.star

export const colorForSeverity: ColorScale = (
  colorName,
  severityLevel
): string => {
  return (
    SeverityColorValues[colorName] ||
    SeverityColorValues[DEFAULT_SEVERITY_LEVELS[severityLevel]] ||
    DEFAULT_COLOR_VALUE
  )
}

export const getBrighterColor = (factor: number, value?: string) => {
  const colorValue = color(value)

  if (!!colorValue) {
    return colorValue.brighter(factor).hex()
  }

  return DEFAULT_COLOR_VALUE
}
