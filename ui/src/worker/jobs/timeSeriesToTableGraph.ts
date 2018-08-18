import {fastMap} from 'src/utils/fast'
import {groupByTimeSeriesTransform} from 'src/utils/groupByTimeSeriesTransform'
import {
  TimeSeriesServerResponse,
  TimeSeries,
  TimeSeriesValue,
} from 'src/types/series'
import {fetchData} from 'src/worker/utils'

interface Label {
  label: string
  seriesIndex: number
  responseIndex: number
}

export interface TimeSeriesToTableGraphReturnType {
  data: TimeSeriesValue[][]
  sortedLabels: Label[]
}

export const timeSeriesToTableGraphWork = (
  raw: TimeSeriesServerResponse[]
): TimeSeriesToTableGraphReturnType => {
  const isTable = true
  const {sortedLabels, sortedTimeSeries} = groupByTimeSeriesTransform(
    raw,
    isTable
  )

  const labels = [
    'time',
    ...fastMap<Label, string>(sortedLabels, ({label}) => label),
  ]

  const tableData = fastMap<TimeSeries, TimeSeriesValue[]>(
    sortedTimeSeries,
    ({time, values}) => [time, ...values]
  )
  const data = tableData.length ? [labels, ...tableData] : [[]]
  return {
    data,
    sortedLabels,
  }
}

const timeSeriesToTableGraph = async msg => {
  const {raw} = await fetchData(msg)
  return timeSeriesToTableGraphWork(raw)
}

export default timeSeriesToTableGraph
