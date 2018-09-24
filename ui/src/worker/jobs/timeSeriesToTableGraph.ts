import {fastMap} from 'src/utils/fast'
import {groupByTimeSeriesTransform} from 'src/utils/groupByTimeSeriesTransform'
import {
  TimeSeriesServerResponse,
  TimeSeries,
  TimeSeriesValue,
  InfluxQLQueryType,
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

const timeSeriesToTableData = (
  timeSeries: TimeSeries[],
  queryType: InfluxQLQueryType
): TimeSeriesValue[][] => {
  switch (queryType) {
    case InfluxQLQueryType.MetaQuery:
      return fastMap<TimeSeries, TimeSeriesValue[]>(
        timeSeries,
        ({values}) => values
      )
    case InfluxQLQueryType.DataQuery:
      return fastMap<TimeSeries, TimeSeriesValue[]>(
        timeSeries,
        ({time, values}) => [time, ...values]
      )
    case InfluxQLQueryType.ComboQuery:
      throw new Error('Cannot display meta and data query')
  }
}

export const timeSeriesToTableGraphWork = (
  raw: TimeSeriesServerResponse[]
): TimeSeriesToTableGraphReturnType => {
  const isTable = true
  const {
    sortedLabels,
    sortedTimeSeries,
    queryType,
  } = groupByTimeSeriesTransform(raw, isTable)

  let labels = fastMap<Label, string>(sortedLabels, ({label}) => label)

  if (queryType === InfluxQLQueryType.DataQuery) {
    labels = ['time', ...labels]
  }

  const tableData = timeSeriesToTableData(sortedTimeSeries, queryType)

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
