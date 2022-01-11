import {isEmpty} from 'lodash'

import {TIMERANGE_START, WINDOW_PERIOD} from 'src/flux/helpers/templates'

import {RemoteDataState} from 'src/types'
import {ComponentStatus} from 'src/reusable_ui'

export interface DBsToRPs {
  [databaseName: string]: string[]
}

export function formatDBwithRP(db: string, rp: string): string {
  return rp ? `${db}/${rp}` : `${db}`
}

export function toComponentStatus(
  data: any,
  state: RemoteDataState
): ComponentStatus {
  if (isEmpty(data) && state === RemoteDataState.Done) {
    return ComponentStatus.Disabled
  }

  switch (state) {
    case RemoteDataState.NotStarted:
      return ComponentStatus.Disabled
    case RemoteDataState.Loading:
      return ComponentStatus.Loading
    case RemoteDataState.Error:
      return ComponentStatus.Error
    case RemoteDataState.Done:
      return ComponentStatus.Default
  }
}

export function getDefaultDBandRP(
  dbsToRPs: DBsToRPs
): [string, string] | [null, null] {
  const dbs = Object.keys(dbsToRPs)

  // Pick telegraf if it exists
  if (dbs.includes('telegraf')) {
    return ['telegraf', dbsToRPs.telegraf[0]]
  }

  // Pick nothing if nothing exists
  if (!dbs.length || !dbsToRPs[dbs[0][0]]) {
    return [null, null]
  }

  // Otherwise pick the first available DB and RP
  return [dbs[0], dbsToRPs[dbs[0]][0]]
}

export function renderScript(
  selectedBucket: string,
  selectedMeasurement: string,
  selectedFields: string[],
  aggFunction: string
): string {
  let filterPredicate = `r._measurement == "${selectedMeasurement}"`

  if (selectedFields.length) {
    const fieldsPredicate = selectedFields
      .map(f => `r._field == "${f}"`)
      .join(' or ')

    filterPredicate += ` and (${fieldsPredicate})`
  }

  const from = `from(bucket: "${selectedBucket}")`
  const range = `|> range(start: ${TIMERANGE_START})`
  const filter = `|> filter(fn: (r) => ${filterPredicate})`

  let script = [from, range, filter].join('\n  ')

  if (!aggFunction) {
    return script
  }

  const window = `|> window(every: ${WINDOW_PERIOD})`
  const group =
    '|> group(columns: ["_time", "_start", "_stop", "_value"], mode: "except")'

  script = [script, window, aggFunction, group].join('\n  ')

  return script
}
