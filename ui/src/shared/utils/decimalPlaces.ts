import {DecimalPlaces} from 'src/types/dashboards'
import {isNumerical} from 'src/dashboards/utils/tableGraph'
import {isFinite} from 'lodash'

export const isTruncatedNumber = <T>(
  value: T | number,
  decimalPlaces: DecimalPlaces
): value is number => isFinite(value) && decimalPlaces.isEnforced

export const toFixed = (
  value: number,
  decimalPlaces: DecimalPlaces
): string => {
  const {digits} = decimalPlaces

  if (!isFinite(digits)) {
    return `${value}`
  } else if (digits < 0) {
    return value.toFixed(0)
  } else if (digits > 20) {
    return value.toFixed(20)
  }

  return value.toFixed(digits)
}

export const toValueInRange = (
  stringValue: string,
  min: string,
  max: string
): string => {
  if (!isNumerical(stringValue)) {
    return min
  }

  const value = +parseFloat(stringValue).toFixed(0)

  if (value < +min) {
    return min
  } else if (value > +max) {
    return max
  } else {
    return `${value}`
  }
}
