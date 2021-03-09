import moment from 'moment'

import {
  SECONDS_TO_MS,
  HISTOGRAM_CENTRAL_REGION,
  HISTOGRAM_SHIFT,
} from 'src/logs/constants'

import {TimeBounds} from 'src/types/logs'

export const computeTimeBounds = (
  extentTimes: number[],
  timeOption: string,
  seconds: number
): TimeBounds => {
  const numberTimeOption = new Date(timeOption).valueOf()
  const period = seconds * SECONDS_TO_MS
  const [lowerExtent] = extentTimes

  if (!isValidExtent(numberTimeOption, extentTimes, period)) {
    return centerTimeBounds(numberTimeOption, period)
  }
  return offsetTimeBounds(lowerExtent, numberTimeOption, period)
}

export const isValidExtent = (
  numberTimeOption: number,
  [t0, t1]: number[],
  period: number
): boolean => {
  return t1 - t0 < period && t0 <= numberTimeOption && t1 >= numberTimeOption
}

const centerTimeBounds = (center: number, period: number): TimeBounds => {
  const halfPeriod = Math.floor(period / 2)
  const lower = moment(center - halfPeriod).toISOString()
  const upper = moment(center + halfPeriod).toISOString()

  return {lower, upper}
}

const offsetTimeBounds = (
  lowerExtent: number,
  numberTimeOption: number,
  period: number
): TimeBounds => {
  const offset = doubleStepOffset({
    maxOffset: period * HISTOGRAM_SHIFT,
    center: lowerExtent + period / 2,
    numberTimeOption,
    period,
  })

  const lower = moment(lowerExtent + offset).toISOString()
  const upper = moment(lowerExtent + period + offset).toISOString()

  return {lower, upper}
}

interface OffsetParams {
  numberTimeOption: number
  period: number
  maxOffset: number
  center: number
}

const doubleStepOffset = ({
  numberTimeOption,
  period,
  maxOffset,
  center,
}: OffsetParams): number => {
  const x = (numberTimeOption - center) / period

  if (Math.abs(x) < HISTOGRAM_CENTRAL_REGION / 2) {
    return 0
  }
  return maxOffset * Math.sign(x)
}
