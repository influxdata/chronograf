// Libraries
import moment from 'moment'
import {unparse} from 'papaparse'
import uuid from 'uuid'

// Utils
import {timeSeriesToTableGraph} from 'src/utils/timeSeriesTransformers'
import {executeQuery as executeInfluxQLQuery} from 'src/shared/apis/query'
import {getRawTimeSeries as executeFluxQuery} from 'src/shared/apis/flux/query'

// Constants
import {DEFAULT_PIXELS} from 'src/shared/constants'

// Types
import {Query, Template, Source, TimeRange} from 'src/types'
import {TimeSeriesResponse} from 'src/types/series'

export const downloadInfluxQLCSV = async (
  queries: Query[],
  templates: Template[]
): Promise<void> => {
  const responses = await Promise.all(
    queries.map(query =>
      executeInfluxQLQuery(query.queryConfig.source, query, templates)
    )
  )

  const csv = await timeseriesToCSV(responses)

  downloadCSV(csv, csvName())
}

export const downloadFluxCSV = async (
  source: Source,
  script: string,
  timeRange: TimeRange,
  fluxASTLink: string
): Promise<{didTruncate: boolean}> => {
  const {csv, didTruncate} = await executeFluxQuery(
    source,
    script,
    uuid.v4(),
    timeRange,
    fluxASTLink,
    DEFAULT_PIXELS
  )

  downloadCSV(csv, csvName())

  return {didTruncate}
}

const timeseriesToCSV = async (
  responses: TimeSeriesResponse[]
): Promise<string> => {
  const wrapped = responses.map(response => ({response}))
  const tableResponse = await timeSeriesToTableGraph(wrapped)
  const table = tableResponse.data

  if (!table.length) {
    throw new Error('no results')
  }

  const header = table[0]
  const timeIndex = header.indexOf('time')

  if (timeIndex < 0) {
    throw new Error('could not find time index')
  }

  for (let i = 1; i < table.length; i++) {
    // Convert times to a (somewhat) human readable ISO8601 string
    table[i][timeIndex] = new Date(table[i][timeIndex]).toISOString()
  }

  return unparse(table)
}

const csvName = () => {
  // Strange time format since `:` can't be used in a filename
  const now = moment().format('YYYY-MM-DD-HH-mm')

  return `${now} Chronograf Data.csv`
}

const downloadCSV = (csv: string, title: string) => {
  const blob = new Blob([csv], {type: 'text/csv'})
  const a = document.createElement('a')

  a.href = window.URL.createObjectURL(blob)
  a.target = '_blank'
  a.download = title

  document.body.appendChild(a)
  a.click()
  a.parentNode.removeChild(a)
}
