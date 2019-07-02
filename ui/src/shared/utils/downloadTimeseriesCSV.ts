// Libraries
import moment from 'moment'
import {unparse} from 'papaparse'

// Utils
import {timeSeriesToTableGraph} from 'src/utils/timeSeriesTransformers'
import {executeQuery as executeInfluxQLQuery} from 'src/shared/apis/query'
import {executeQuery as executeFluxQuery} from 'src/shared/apis/flux/query'
import {renderTemplatesInScript} from 'src/flux/helpers/templates'

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
): Promise<{didTruncate: boolean; rowCount: number}> => {
  const renderedScript = await renderTemplatesInScript(
    script,
    timeRange,
    fluxASTLink
  )

  const {csv, didTruncate, rowCount} = await executeFluxQuery(
    source,
    renderedScript
  )

  downloadCSV(csv, csvName())

  return {didTruncate, rowCount}
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

  const tableHeader = table[0]
  const tableData = table.slice(1)

  const timeIndex = tableHeader.indexOf('time')

  if (timeIndex > -1) {
    for (let i = 0; i < tableData.length; i++) {
      // Convert times to a (somewhat) human readable ISO8601 string
      tableData[i][timeIndex] = new Date(tableData[i][timeIndex]).toISOString()
    }
  }

  return unparse({data: tableData, fields: tableHeader}, {quotes: true})
}

const csvName = () => {
  // Strange time format since `:` can't be used in a filename
  const now = moment().format('YYYY-MM-DD-HH-mm')

  return `${now} Chronograf Data.csv`
}

export const downloadCSV = (csv: string, title: string) => {
  const blob = new Blob([csv], {type: 'text/csv'})
  const a = document.createElement('a')

  a.href = window.URL.createObjectURL(blob)
  a.target = '_blank'
  a.download = title

  document.body.appendChild(a)
  a.click()
  a.parentNode.removeChild(a)
}
