// Libraries
import moment from 'moment'
import {unparse} from 'papaparse'

// Utils
import {proxy} from 'src/utils/queryUrlGenerator'
import {duration} from 'src/shared/apis/query'
import replaceTemplates, {replaceInterval} from 'src/tempVars/utils/replace'
import {timeSeriesToTableGraph} from 'src/utils/timeSeriesTransformers'

// Types
import {Query, Template} from 'src/types'
import {TimeSeriesServerResponse} from 'src/types/series'

type CSV = Array<Array<number | string>>

const downloadTimeseriesCSV = async (
  queries: Query[],
  templates: Template[]
): Promise<void> => {
  const responses = await Promise.all(
    queries.map(query => fetchTimeseries(query, templates))
  )

  const csv = await timeseriesToCSV(responses)

  downloadCSV(csv, csvName())
}

const fetchTimeseries = async (
  query: Query,
  templates: Template[]
): Promise<TimeSeriesServerResponse> => {
  const source = query.queryConfig.source

  let queryString = replaceTemplates(query.text, templates)

  if (queryString.includes(':interval:')) {
    const queryDuration = await duration(query.text, source)

    queryString = replaceInterval(query.text, null, queryDuration)
  }

  const resp = await proxy({source: source.links.proxy, query: queryString})

  return {response: resp.data}
}

const timeseriesToCSV = async (
  responses: TimeSeriesServerResponse[]
): Promise<CSV> => {
  const tableResponse = await timeSeriesToTableGraph(responses)
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
