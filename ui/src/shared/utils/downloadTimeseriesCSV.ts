// Libraries
import moment from 'moment'
import {unparse} from 'papaparse'

// Utils
import {timeSeriesToTableGraph} from 'src/utils/timeSeriesTransformers'
import {executeQuery as executeInfluxQLQuery} from 'src/shared/apis/query'
import {getRawTimeSeries as executeFluxQuery} from 'src/flux/apis/index'

// Types
import {Query, Template, Service} from 'src/types'
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
  service: Service,
  script: string
): Promise<{didTruncate: boolean}> => {
  const {csv, didTruncate} = await executeFluxQuery(service, script)

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
