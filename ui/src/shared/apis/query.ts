import {getDeep} from 'src/utils/wrappers'
import {analyzeQueries} from 'src/shared/apis'
import {DEFAULT_DURATION_MS} from 'src/shared/constants'
import replaceTemplates, {replaceInterval} from 'src/tempVars/utils/replace'
import {proxy} from 'src/utils/queryUrlGenerator'

import {Source, Status, Template} from 'src/types'
import {TimeSeriesResponse, TimeSeriesSeries} from 'src/types/series'

// REVIEW: why is this different than the `Query` in src/types?
interface Query {
  text: string
  database?: string
  db?: string
  rp?: string
  id: string
}

type EditQueryStatusFunction = (queryID: string, status: Status) => void

export const fetchTimeSeries = async (
  source: Source,
  queries: Query[],
  resolution: number,
  templates: Template[],
  uuid: string,
  editQueryStatus: EditQueryStatusFunction = editQueryStatusNoOp
) =>
  Promise.all(
    queries.map(query =>
      fetchSingleTimeSeries(
        source,
        query,
        resolution,
        templates,
        uuid,
        editQueryStatus
      )
    )
  )

const fetchSingleTimeSeries = async (
  source: Source,
  query: Query,
  resolution: number,
  templates: Template[],
  uuid: string,
  editQueryStatus: EditQueryStatusFunction
) => {
  const text = await replace(query.text, source, templates, resolution)

  editQueryStatus(query.id, {loading: true})

  try {
    const {data} = await proxy({
      source: source.links.proxy,
      rp: query.rp,
      query: text,
      db: query.db || query.database,
      uuid,
    })

    const warningMessage = extractWarningMessage(data)

    if (warningMessage) {
      editQueryStatus(query.id, {warn: warningMessage})
    } else {
      editQueryStatus(query.id, {success: 'Success!'})
    }

    return data
  } catch (error) {
    editQueryStatus(query.id, {error: extractErrorMessage(error)})

    throw error
  }
}

export const replace = async (
  query: string,
  source: Source,
  templates: Template[],
  resolution: number
): Promise<string> => {
  const templateReplacedQuery = replaceTemplates(query, templates)
  const durationMs = await duration(templateReplacedQuery, source)
  const replacedQuery = replaceInterval(
    query,
    Math.floor(resolution / 3),
    durationMs
  )

  return replacedQuery
}

export const duration = async (
  query: string,
  source: Source
): Promise<number> => {
  const analysis = await analyzeQueries(source.links.queries, [{query}])
  const queryDuration = getDeep<number>(
    analysis,
    '0.durationMs',
    DEFAULT_DURATION_MS
  )

  return queryDuration
}

const extractWarningMessage = (data: TimeSeriesResponse): string | null => {
  const error = getDeep<string>(data, 'results.0.error', null)
  const series = getDeep<TimeSeriesSeries>(data, 'results.0.series', null)

  if (error) {
    return error
  }

  if (!series) {
    return 'Your query is syntactically correct but returned no results'
  }

  return null
}

const extractErrorMessage = (errorMessage: string): string => {
  if (!errorMessage) {
    return 'Could not retrieve data'
  }

  const parseErrorMatch = errorMessage.match('error parsing query')

  if (parseErrorMatch) {
    return errorMessage.slice(parseErrorMatch.index)
  }

  return errorMessage
}

const editQueryStatusNoOp = () => ({
  type: 'NOOP',
  payload: {},
})
