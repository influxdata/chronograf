import {getDeep} from 'src/utils/wrappers'
import {analyzeQueries} from 'src/shared/apis'
import {TEMP_VAR_INTERVAL, DEFAULT_DURATION_MS} from 'src/shared/constants'
import replaceTemplates, {replaceInterval} from 'src/tempVars/utils/replace'
import {proxy} from 'src/utils/queryUrlGenerator'

import {Source, Template} from 'src/types'
import {TimeSeriesResponse} from 'src/types/series'

// REVIEW: why is this different than the `Query` in src/types?
interface Query {
  text: string
  id: string
  database?: string
  db?: string
  rp?: string
}

interface QueryResult {
  value: TimeSeriesResponse | null
  error: any | null
}

export function executeQueries(
  source: Source,
  queries: Query[],
  templates: Template[],
  uuid?: string
): Promise<QueryResult[]> {
  return new Promise(resolve => {
    const results = []

    let counter = queries.length

    for (let i = 0; i < queries.length; i++) {
      executeQuery(source, queries[i], templates, uuid)
        .then(result => (results[i] = {value: result, error: null}))
        .catch(result => (results[i] = {value: null, error: result}))
        // eslint-disable-next-line no-loop-func
        .then(() => {
          counter -= 1

          if (counter === 0) {
            resolve(results)
          }
        })
    }
  })
}

export const executeQuery = async (
  source: Source,
  query: Query,
  templates: Template[],
  uuid?: string
): Promise<TimeSeriesResponse> => {
  const text = await replace(query.text, source, templates)

  const {data} = await proxy({
    source: source.links.proxy,
    rp: query.rp,
    query: text,
    db: query.db || query.database,
    uuid,
  })

  return data
}

const replace = async (
  query: string,
  source: Source,
  templates: Template[]
): Promise<string> => {
  const templateReplacedQuery = replaceTemplates(query, templates)

  if (!templateReplacedQuery.includes(TEMP_VAR_INTERVAL)) {
    return templateReplacedQuery
  }

  const durationMs = await duration(templateReplacedQuery, source)
  const replacedQuery = replaceInterval(templateReplacedQuery, durationMs)

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
