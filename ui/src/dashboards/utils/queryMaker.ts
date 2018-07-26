import {buildQuery} from 'src/utils/influxql'
import {TYPE_QUERY_CONFIG} from 'src/dashboards/constants'
import {TEMPLATE_RANGE} from 'src/tempVars/constants'

import {QueryConfig, Source} from 'src/types'

export const rawTextBinder = (
  source: Source,
  id: string,
  action: (source: Source, id: string, text: string) => void
) => (text: string) => action(source, id, text)

export const buildText = (q: QueryConfig): string =>
  q.rawText || buildQuery(TYPE_QUERY_CONFIG, q.range || TEMPLATE_RANGE, q) || ''
