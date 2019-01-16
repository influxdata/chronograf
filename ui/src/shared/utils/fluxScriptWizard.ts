import {isEmpty} from 'lodash'

import {DASHBOARD_TIME, INTERVAL} from 'src/flux/helpers/templates'

import {proxy} from 'src/utils/queryUrlGenerator'
import {parseMetaQuery} from 'src/tempVars/parsing'

import {RemoteDataState} from 'src/types'
import {ComponentStatus} from 'src/reusable_ui'

export interface DBsToRPs {
  [databaseName: string]: string[]
}

export async function fetchDBsToRPs(proxyLink: string): Promise<DBsToRPs> {
  const dbsQuery = 'SHOW DATABASES'
  const dbsResp = await proxy({source: proxyLink, query: dbsQuery})
  const dbs = parseMetaQuery(dbsQuery, dbsResp.data).sort()

  const rpsQuery = dbs
    .map(db => `SHOW RETENTION POLICIES ON "${db}"`)
    .join('; ')

  const rpsResp = await proxy({source: proxyLink, query: rpsQuery})

  const dbsToRPs: DBsToRPs = dbs.reduce((acc, db, i) => {
    const series = rpsResp.data.results[i].series[0]
    const namesIndex = series.columns.indexOf('name')
    const rpNames = series.values.map(row => row[namesIndex])

    return {...acc, [db]: rpNames}
  }, {})

  return dbsToRPs
}

export async function fetchMeasurements(
  proxyLink: string,
  database: string
): Promise<string[]> {
  const query = `SHOW MEASUREMENTS ON "${database}"`
  const resp = await proxy({source: proxyLink, query})
  const measurements = parseMetaQuery(query, resp.data)

  measurements.sort()

  return measurements
}

export async function fetchFields(
  proxyLink: string,
  database: string,
  measurement: string
): Promise<string[]> {
  const query = `SHOW FIELD KEYS ON "${database}" FROM "${measurement}"`
  const resp = await proxy({source: proxyLink, query})
  const fields = parseMetaQuery(query, resp.data)

  fields.sort()

  return fields
}

export function formatDBwithRP(db: string, rp: string): string {
  return `${db}/${rp}`
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
  const range = `|> range(start: ${DASHBOARD_TIME})`
  const filter = `|> filter(fn: (r) => ${filterPredicate})`

  let script = [from, range, filter].join('\n  ')

  if (!aggFunction) {
    return script
  }

  const window = `|> window(every: ${INTERVAL})`
  const group =
    '|> group(columns: ["_time", "_start", "_stop", "_value"], mode: "except")'

  script = [script, window, aggFunction, group].join('\n  ')

  return script
}
