export const INFLUXQL_FUNCTIONS: string[] = [
  'mean',
  'median',
  'count',
  'min',
  'max',
  'sum',
  'first',
  'last',
  'spread',
  'stddev',
]

interface MinHeights {
  queryMaker: number
  visualization: number
}

export const MINIMUM_HEIGHTS: MinHeights = {
  queryMaker: 350,
  visualization: 200,
}

interface InitialHeights {
  queryMaker: '66.666%'
  visualization: '33.334%'
}

export const INITIAL_HEIGHTS: InitialHeights = {
  queryMaker: '66.666%',
  visualization: '33.334%',
}

const knownMetaQueries = {
  showDatabases: 'SHOW DATABASES',
  createDatabase: 'CREATE DATABASE "db_name"',
  dropDatabase: 'DROP DATABASE "db_name"',
  showMeasurements: 'SHOW MEASUREMENTS ON "db_name"',
  showTagKeys: 'SHOW TAG KEYS ON "db_name" FROM "measurement_name"',
  showTagValues:
    'SHOW TAG VALUES ON "db_name" FROM "measurement_name" WITH KEY = "tag_key"',
  showRetentionPolicies: 'SHOW RETENTION POLICIES on "db_name"',
  createRetentionPolicy:
    'CREATE RETENTION POLICY "rp_name" ON "db_name" DURATION 30d REPLICATION 1 DEFAULT',
  dropRetentionPolicy: 'DROP RETENTION POLICY "rp_name" ON "db_name"',
  showContinuousQueries: 'SHOW CONTINUOUS QUERIES',
  createContinuousQuery:
    'CREATE CONTINUOUS QUERY "cq_name" ON "db_name" BEGIN SELECT min("field") INTO "target_measurement" FROM "current_measurement" GROUP BY time(30m) END',
  dropContinuousQuery: 'DROP CONTINUOUS QUERY "cq_name" ON "db_name"',
  showUsers: 'SHOW USERS',
  createUser: 'CREATE USER "username" WITH PASSWORD \'password\'',
  createUserWithAllPrivileges:
    'CREATE USER "username" WITH PASSWORD \'password\' WITH ALL PRIVILEGES',
  dropUser: 'DROP USER "username"',
  showStats: 'SHOW STATS',
  showDiagnostics: 'SHOW DIAGNOSTICS',
}

export const knownMetaQueriesAsArray = Object.values(knownMetaQueries)

export interface MetaQueryTemplateOption {
  id: string
  text: string
  query: string
  type: DropdownChildTypes
}

export interface Divider {
  id: string
  type: DropdownChildTypes
}

export enum DropdownChildTypes {
  Item = 'item',
  Divider = 'divider',
}

export const METAQUERY_TEMPLATE_OPTIONS: Array<
  MetaQueryTemplateOption | Divider
> = [
  {
    id: 'Show Databases',
    text: 'Show Databases',
    query: knownMetaQueries.showDatabases,
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Create Database',
    text: 'Create Database',
    query: knownMetaQueries.createDatabase,
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Drop Database',
    text: 'Drop Database',
    query: knownMetaQueries.dropDatabase,
    type: DropdownChildTypes.Item,
  },
  {
    id: `mqtd-divider-1`,
    type: DropdownChildTypes.Divider,
  },
  {
    id: 'Show Measurements',
    text: 'Show Measurements',
    query: knownMetaQueries.showMeasurements,
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Show Tag Keys',
    text: 'Show Tag Keys',
    query: knownMetaQueries.showTagKeys,
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Show Tag Values',
    text: 'Show Tag Values',
    query: knownMetaQueries.showTagValues,
    type: DropdownChildTypes.Item,
  },
  {
    id: `mqtd-divider-2`,
    type: DropdownChildTypes.Divider,
  },
  {
    id: 'Show Retention Policies',
    text: 'Show Retention Policies',
    query: knownMetaQueries.showRetentionPolicies,
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Create Retention Policy',
    text: 'Create Retention Policy',
    query: knownMetaQueries.createRetentionPolicy,
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Drop Retention Policy',
    text: 'Drop Retention Policy',
    query: knownMetaQueries.dropRetentionPolicy,
    type: DropdownChildTypes.Item,
  },
  {
    id: `mqtd-divider-3`,
    type: DropdownChildTypes.Divider,
  },
  {
    id: 'Show Continuous Queries',
    text: 'Show Continuous Queries',
    query: knownMetaQueries.showContinuousQueries,
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Create Continuous Query',
    text: 'Create Continuous Query',
    query: knownMetaQueries.createContinuousQuery,
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Drop Continuous Query',
    text: 'Drop Continuous Query',
    query: knownMetaQueries.dropContinuousQuery,
    type: DropdownChildTypes.Item,
  },
  {
    id: `mqtd-divider-4`,
    type: DropdownChildTypes.Divider,
  },
  {
    id: 'Show Users',
    text: 'Show Users',
    query: knownMetaQueries.showUsers,
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Create User',
    text: 'Create User',
    query: knownMetaQueries.createUser,
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Create Admin User',
    text: 'Create Admin User',
    query: knownMetaQueries.createUserWithAllPrivileges,
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Drop User',
    text: 'Drop User',
    query: knownMetaQueries.dropUser,
    type: DropdownChildTypes.Item,
  },
  {
    id: `mqtd-divider-5`,
    type: DropdownChildTypes.Divider,
  },
  {
    id: 'Show Stats',
    text: 'Show Stats',
    query: knownMetaQueries.showStats,
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Show Diagnostics',
    text: 'Show Diagnostics',
    query: knownMetaQueries.showDiagnostics,
    type: DropdownChildTypes.Item,
  },
]

export const WRITE_DATA_DOCS_LINK =
  'https://docs.influxdata.com/influxdb/latest/write_protocols/line_protocol_tutorial/'
