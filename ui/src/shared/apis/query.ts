import _ from 'lodash'
import {getDeep} from 'src/utils/wrappers'
import {analyzeQueries} from 'src/shared/apis'
import {DEFAULT_DURATION_MS} from 'src/shared/constants'
import replaceTemplates, {replaceInterval} from 'src/tempVars/utils/replace'
import {proxy} from 'src/utils/queryUrlGenerator'

import {Source, Status, Template} from 'src/types'
import {TimeSeriesResponse, TimeSeriesSeries} from 'src/types/series'

const noop = () => ({
  type: 'NOOP',
  payload: {},
})

interface Query {
  text: string
  database?: string
  db?: string
  rp?: string
  id: string
}

export const fetchTimeSeries = async (
  source: Source,
  queries: Query[],
  resolution: number,
  templates: Template[],
  uuid: string,
  editQueryStatus: () => any = noop
) => {
  const timeSeriesPromises = queries.map(async query => {
    try {
      const text = await replace(query.text, source, templates, resolution)
      return handleQueryFetchStatus(
        {...query, text},
        source,
        uuid,
        editQueryStatus
      )
    } catch (error) {
      console.error(error)
      throw error
    }
  })

  return Promise.all(timeSeriesPromises)
}

const handleQueryFetchStatus = async (
  query: Query,
  source: Source,
  uuid: string,
  editQueryStatus: () => any
) => {
  const {database, rp} = query
  const db = _.get(query, 'db', database)

  try {
    handleLoading(query, editQueryStatus)

    const payload = {
      source: source.links.proxy,
      db,
      rp,
      uuid,
      query: query.text,
    }

    const {data} = await proxy(payload)

    return handleSuccess(data, query, editQueryStatus)
  } catch (error) {
    console.error(error)
    handleError(error, query, editQueryStatus)
    throw error
  }
}

export const replace = async (
  query: string,
  source: Source,
  templates: Template[],
  resolution: number
): Promise<string> => {
  try {
    query = replaceTemplates(query, templates)
    const durationMs = await duration(query, source)
    return replaceInterval(query, Math.floor(resolution / 3), durationMs)
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const duration = async (
  query: string,
  source: Source
): Promise<number> => {
  try {
    const analysis = await analyzeQueries(source.links.queries, [{query}])
    return getDeep<number>(analysis, '0.durationMs', DEFAULT_DURATION_MS)
  } catch (error) {
    console.error(error)
    throw error
  }
}

type EditQueryStatusFunction = (queryID: string, status: Status) => void

const handleLoading = (
  query: Query,
  editQueryStatus: EditQueryStatusFunction
): void =>
  editQueryStatus(query.id, {
    loading: true,
  })

const handleSuccess = (
  data: TimeSeriesResponse,
  query: Query,
  editQueryStatus: EditQueryStatusFunction
): TimeSeriesResponse => {
  const {results} = data
  const error = getDeep<string>(results, '0.error', null)
  const series = getDeep<TimeSeriesSeries>(results, '0.series', null)
  // 200 from server and no results = warn
  if (!series && !error) {
    editQueryStatus(query.id, {
      warn: 'Your query is syntactically correct but returned no results',
    })
    return data
  }

  // 200 from chrono server but influx returns an "error" = warning
  if (error) {
    editQueryStatus(query.id, {
      warn: error,
    })
    return data
  }

  // 200 from server and results contains data = success
  editQueryStatus(query.id, {
    success: 'Success!',
  })
  return data
}

const handleError = (
  error,
  query: Query,
  editQueryStatus: EditQueryStatusFunction
): void => {
  const message =
    getDeep<string>(error, 'data.message', '') ||
    getDeep<string>(error, 'message', 'Could not retrieve data')

  // 400 from chrono server = fail
  editQueryStatus(query.id, {
    error: message,
  })
}
