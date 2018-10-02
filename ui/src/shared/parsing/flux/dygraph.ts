import {manager} from 'src/worker/JobManager'
import {fastMap} from 'src/utils/fast'

import {FluxTable, DygraphValue} from 'src/types'
import {TimeSeriesToDyGraphReturnType} from 'src/worker/jobs/timeSeriesToDygraph'

export const fluxTablesToDygraph = async (
  tables: FluxTable[]
): Promise<TimeSeriesToDyGraphReturnType> => {
  const {labels, dygraphsData} = await manager.fluxTablesToDygraph(tables)

  const timeSeries = fastMap<DygraphValue[], DygraphValue[]>(
    dygraphsData,
    ([time, ...values]) => [new Date(time), ...values]
  )

  const dygraphSeries = labels.reduce(
    (acc, label) => ({
      ...acc,
      [label]: {axis: 'y'},
    }),
    {}
  )

  return {labels, dygraphSeries, timeSeries}
}
