import _ from 'lodash'

import {Message} from 'src/worker/types'
import {fetchData} from 'src/worker/utils'
import {FluxTable, DygraphValue} from 'src/types'
import {parseTablesByTime} from 'src/shared/parsing/flux/parseTablesByTime'

export interface FluxTablesToDygraphResult {
  labels: string[]
  dygraphsData: DygraphValue[][]
  nonNumericColumns: string[]
}

export const fluxTablesToDygraphWork = (
  tables: FluxTable[]
): FluxTablesToDygraphResult => {
  const {tablesByTime, allColumnNames, nonNumericColumns} = parseTablesByTime(
    tables
  )

  const dygraphValuesByTime: {[k: string]: DygraphValue[]} = {}
  const DATE_INDEX = 0
  const DATE_INDEX_OFFSET = 1

  for (const table of tablesByTime) {
    for (const time of Object.keys(table)) {
      dygraphValuesByTime[time] = Array(
        allColumnNames.length + DATE_INDEX_OFFSET
      ).fill(null)
    }
  }

  for (const table of tablesByTime) {
    for (const [date, values] of Object.entries(table)) {
      dygraphValuesByTime[date][DATE_INDEX] = new Date(Number(date))

      for (const [seriesName, value] of Object.entries(values)) {
        const i = allColumnNames.indexOf(seriesName) + DATE_INDEX_OFFSET
        dygraphValuesByTime[date][i] = Number(value)
      }
    }
  }

  const dygraphsData = _.sortBy(Object.values(dygraphValuesByTime), ([date]) =>
    Date.parse(date as string)
  )

  return {
    labels: ['time', ...allColumnNames],
    dygraphsData,
    nonNumericColumns: _.uniq(nonNumericColumns),
  }
}

export default async (msg: Message): Promise<FluxTablesToDygraphResult> => {
  const {raw} = await fetchData(msg)

  return fluxTablesToDygraphWork(raw)
}
