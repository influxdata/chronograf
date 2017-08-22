import _ from 'lodash'

export default function(timeSeriesResponse) {
  const values = _.get(
    timeSeriesResponse,
    ['0', 'response', 'results', '0', 'series', '0', 'values'],
    [['', '']]
  )
  const sum = values.reduce((acc, val) => acc + (val[1] || 0), 0)
  const mean = sum / values.length

  return mean
}
