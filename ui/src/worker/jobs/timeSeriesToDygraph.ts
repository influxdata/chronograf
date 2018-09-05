import {fastMap, fastReduce} from 'src/utils/fast'
import {groupByTimeSeriesTransform} from 'src/utils/groupByTimeSeriesTransform'
import {TimeSeriesServerResponse, TimeSeries} from 'src/types/series'
import {DygraphSeries, DygraphValue} from 'src/types'
import {fetchData} from 'src/worker/utils'

interface Label {
  label: string
  seriesIndex: number
  responseIndex: number
}

export interface TimeSeriesToDyGraphReturnType {
  labels: string[]
  timeSeries: DygraphValue[][]
  dygraphSeries: DygraphSeries
}

export const timeSeriesToDygraphWork = (
  raw: TimeSeriesServerResponse[]
): TimeSeriesToDyGraphReturnType => {
  const isTable = false
  const {sortedLabels, sortedTimeSeries} = groupByTimeSeriesTransform(
    raw,
    isTable
  )

  const labels = [
    'time',
    ...fastMap<Label, string>(sortedLabels, ({label}) => label),
  ]

  const timeSeries = fastMap<TimeSeries, DygraphValue[]>(
    sortedTimeSeries,
    ({time, values}) => [new Date(time), ...values]
  )

  const dygraphSeries = fastReduce<Label, DygraphSeries>(
    sortedLabels,
    (acc, {label, responseIndex}) => {
      acc[label] = {
        axis: responseIndex === 0 ? 'y' : 'y2',
      }

      return acc
    },
    {}
  )

  return {labels, timeSeries, dygraphSeries}
}

const timeSeriesToDygraph = async msg => {
  const {raw} = await fetchData(msg)

  return timeSeriesToDygraphWork(raw)
}

export default timeSeriesToDygraph
