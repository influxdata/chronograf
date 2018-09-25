import {fastMap} from 'src/utils/fast'
import {manager} from 'src/worker/JobManager'

import {
  TimeSeriesServerResponse,
  TimeSeriesToTableGraphReturnType,
} from 'src/types/series'
import {DygraphSeries, DygraphValue} from 'src/types'

export interface TimeSeriesToDyGraphReturnType {
  labels: string[]
  timeSeries: DygraphValue[][]
  dygraphSeries: DygraphSeries
}

export const timeSeriesToDygraph = async (
  raw: TimeSeriesServerResponse[],
  pathname: string = ''
): Promise<TimeSeriesToDyGraphReturnType> => {
  const result = await manager.timeSeriesToDygraph(raw, pathname)
  const {timeSeries} = result
  const newTimeSeries = fastMap<DygraphValue[], DygraphValue[]>(
    timeSeries,
    ([time, ...values]) => [new Date(time), ...values]
  )

  return {...result, timeSeries: newTimeSeries}
}

export const timeSeriesToTableGraph = async (
  raw: TimeSeriesServerResponse[]
): Promise<TimeSeriesToTableGraphReturnType> => {
  return await manager.timeSeriesToTableGraph(raw)
}
