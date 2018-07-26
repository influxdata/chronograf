import moment from 'moment'

export const dateFormat = 'YYYY-MM-DD HH:mm'

export const formatTimeStamp = (timeStamp: string): string => {
  return moment(timeStamp).format(dateFormat)
}

export const formatTimeRange = (timeRange: string | null): string => {
  if (!timeRange) {
    return ''
  }

  if (timeRange === 'now()') {
    return moment(new Date()).format(dateFormat)
  }

  if (timeRange.match(/^now/)) {
    const [, duration, unitOfTime] = timeRange.match(/(\d+)(\w+)/)
    const d = duration as moment.unitOfTime.DurationConstructor

    moment().subtract(d, unitOfTime)
  }

  return moment(timeRange.replace(/\'/g, '')).format(dateFormat)
}
