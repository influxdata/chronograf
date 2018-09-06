// Libraries
import moment from 'moment'
import {unparse} from 'papaparse'

// Utils
import {timeSeriesToTableGraph} from 'src/utils/timeSeriesTransformers'
import {executeQuery} from 'src/shared/apis/query'

// Types
import {Query, Template} from 'src/types'
import {TimeSeriesResponse} from 'src/types/series'

type CSV = Array<Array<number | string>>

const downloadTimeseriesCSV = async (
  queries: Query[],
  templates: Template[]
): Promise<void> => {
  const responses = await Promise.all(
    queries.map(query =>
      executeQuery(query.queryConfig.source, query, templates)
    )
  )

  const csv = await timeseriesToCSV(responses)

  downloadCSV(csv, csvName())
}

const timeseriesToCSV = async (
  responses: TimeSeriesResponse[]
): Promise<CSV> => {
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

  return table
}

const csvName = () => {
  // Strange time format since `:` can't be used in a filename
  const now = moment().format('YYYY-MM-DD-HH-mm')

  return `${now} Chronograf Data.csv`
}

const downloadCSV = (csv: CSV, title: string) => {
  const text = unparse(csv)
  const blob = new Blob([text], {type: 'text/csv'})
  const a = document.createElement('a')

  a.href = window.URL.createObjectURL(blob)
  a.target = '_blank'
  a.download = title

  document.body.appendChild(a)
  a.click()
  a.parentNode.removeChild(a)
}

export default downloadTimeseriesCSV
