import * as _ from 'lodash'
import {proxy} from 'utils/queryUrlGenerator'

export const showDatabases = (source: string) =>
  proxy({source, query: 'SHOW DATABASES'})

export const showRetentionPolicies = (source: string, databases: string[]) => {
  let query
  if (Array.isArray(databases)) {
    query = databases.map(db => `SHOW RETENTION POLICIES ON "${db}"`).join(';')
  } else {
    query = `SHOW RETENTION POLICIES ON "${databases}"`
  }

  return proxy({source, query})
}

export const showQueries = (source: string, db: string): Promise<{data: {}}> =>
  proxy({source, query: 'SHOW QUERIES', db})

export const killQuery = (source: string, queryID: string) =>
  proxy({source, query: `KILL QUERY ${queryID}`})

export const showMeasurements = (source: string, db: string) =>
  proxy({source, db, query: 'SHOW MEASUREMENTS'})

export const showTagKeys = ({
  source,
  database,
  retentionPolicy,
  measurement,
}: {
  source: string
  database: string
  retentionPolicy: string
  measurement: string
}) => {
  const rp = _.toString(retentionPolicy)
  const query = `SHOW TAG KEYS FROM "${rp}"."${measurement}"`
  return proxy({source, db: database, rp: retentionPolicy, query})
}

export const showTagValues = ({
  source,
  database,
  retentionPolicy,
  measurement,
  tagKeys,
}: {
  source: string
  database: string
  retentionPolicy: string
  measurement: string
  tagKeys: string[]
}) => {
  const keys = tagKeys
    .sort()
    .map(k => `"${k}"`)
    .join(', ')
  const rp = _.toString(retentionPolicy)
  const query = `SHOW TAG VALUES FROM "${rp}"."${measurement}" WITH KEY IN (${
    keys
  })`

  return proxy({source, db: database, rp: retentionPolicy, query})
}
