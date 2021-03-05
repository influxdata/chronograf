import {timeRanges} from 'src/shared/data/timeRanges'

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
    query: 'SHOW DATABASES',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Create Database',
    text: 'Create Database',
    query: 'CREATE DATABASE "db_name"',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Drop Database',
    text: 'Drop Database',
    query: 'DROP DATABASE "db_name"',
    type: DropdownChildTypes.Item,
  },
  {
    id: `mqtd-divider-1`,
    type: DropdownChildTypes.Divider,
  },
  {
    id: 'Show Measurements',
    text: 'Show Measurements',
    query: 'SHOW MEASUREMENTS ON "db_name"',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Show Tag Keys',
    text: 'Show Tag Keys',
    query: 'SHOW TAG KEYS ON "db_name" FROM "measurement_name"',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Show Tag Values',
    text: 'Show Tag Values',
    query:
      'SHOW TAG VALUES ON "db_name" FROM "measurement_name" WITH KEY = "tag_key"',
    type: DropdownChildTypes.Item,
  },
  {
    id: `mqtd-divider-2`,
    type: DropdownChildTypes.Divider,
  },
  {
    id: 'Show Field Keys',
    text: 'Show Field Keys',
    query: 'SHOW FIELD KEYS ON "db_name"',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Show Field Key Cardinality',
    text: 'Show Field Key Cardinality',
    query: 'SHOW FIELD KEY CARDINALITY ON "db_name"',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Show Measurement Cardinality',
    text: 'Show Measurement Cardinality',
    query: 'SHOW MEASUREMENT CARDINALITY ON "db_name"',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Show Series Cardinality',
    text: 'Show Series Cardinality',
    query: 'SHOW SERIES CARDINALITY ON "db_name"',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Show Tag Key Cardinality',
    text: 'Show Tag Key Cardinality',
    query: 'SHOW TAG KEY CARDINALITY ON "db_name"',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Show Tag Values Cardinality',
    text: 'Show Tag Values Cardinality',
    query: 'SHOW TAG VALUES CARDINALITY ON "db_name" WITH KEY = "tag_key"',
    type: DropdownChildTypes.Item,
  },
  {
    id: `mqtd-divider-3`,
    type: DropdownChildTypes.Divider,
  },
  {
    id: 'Show Retention Policies',
    text: 'Show Retention Policies',
    query: 'SHOW RETENTION POLICIES on "db_name"',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Create Retention Policy',
    text: 'Create Retention Policy',
    query:
      'CREATE RETENTION POLICY "rp_name" ON "db_name" DURATION 30d REPLICATION 1 DEFAULT',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Drop Retention Policy',
    text: 'Drop Retention Policy',
    query: 'DROP RETENTION POLICY "rp_name" ON "db_name"',
    type: DropdownChildTypes.Item,
  },
  {
    id: `mqtd-divider-4`,
    type: DropdownChildTypes.Divider,
  },
  {
    id: 'Show Continuous Queries',
    text: 'Show Continuous Queries',
    query: 'SHOW CONTINUOUS QUERIES',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Create Continuous Query',
    text: 'Create Continuous Query',
    query:
      'CREATE CONTINUOUS QUERY "cq_name" ON "db_name" BEGIN SELECT min("field") INTO "target_measurement" FROM "current_measurement" GROUP BY time(30m) END',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Drop Continuous Query',
    text: 'Drop Continuous Query',
    query: 'DROP CONTINUOUS QUERY "cq_name" ON "db_name"',
    type: DropdownChildTypes.Item,
  },
  {
    id: `mqtd-divider-5`,
    type: DropdownChildTypes.Divider,
  },
  {
    id: 'Show Users',
    text: 'Show Users',
    query: 'SHOW USERS',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Show Grants',
    text: 'Show Grants',
    query: 'SHOW GRANTS FOR "username"',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Create User',
    text: 'Create User',
    query: 'CREATE USER "username" WITH PASSWORD \'password\'',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Create Admin User',
    text: 'Create Admin User',
    query:
      'CREATE USER "username" WITH PASSWORD \'password\' WITH ALL PRIVILEGES',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Drop User',
    text: 'Drop User',
    query: 'DROP USER "username"',
    type: DropdownChildTypes.Item,
  },
  {
    id: `mqtd-divider-6`,
    type: DropdownChildTypes.Divider,
  },
  {
    id: 'Drop Measurement',
    text: 'Drop Measurement',
    query: 'USE "db_name"; DROP MEASUREMENT "measurement_name"',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Drop Series',
    text: 'Drop Series',
    query:
      'USE "db_name"; DROP SERIES FROM "measurement_name" WHERE "tag" = \'value\'',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Delete',
    text: 'Delete',
    query:
      'USE "db_name"; DELETE FROM "measurement_name" WHERE "tag" = \'value\' AND time < \'2020-01-01\'',
    type: DropdownChildTypes.Item,
  },
  {
    id: `mqtd-divider-7`,
    type: DropdownChildTypes.Divider,
  },
  {
    id: 'Explain',
    text: 'Explain',
    query: 'EXPLAIN SELECT * FROM "db_name"."rp_name"."measurement"',
    type: DropdownChildTypes.Item,
  },
  {
    id: `mqtd-divider-8`,
    type: DropdownChildTypes.Divider,
  },
  {
    id: 'Show Stats',
    text: 'Show Stats',
    query: 'SHOW STATS',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Show Diagnostics',
    text: 'Show Diagnostics',
    query: 'SHOW DIAGNOSTICS',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Show Subscriptions',
    text: 'Show Subscriptions',
    query: 'SHOW SUBSCRIPTIONS',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Show Queries',
    text: 'Show Queries',
    query: 'SHOW QUERIES',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Show Shards',
    text: 'Show Shards',
    query: 'SHOW SHARDS',
    type: DropdownChildTypes.Item,
  },
  {
    id: 'Show Shard Groups',
    text: 'Show Shard Groups',
    query: 'SHOW SHARD GROUPS',
    type: DropdownChildTypes.Item,
  },
]

export const WRITE_DATA_DOCS_LINK =
  'https://docs.influxdata.com/influxdb/latest/write_protocols/line_protocol_tutorial/'

export const DEFAULT_TIME_RANGE = timeRanges.find(
  tr => tr.lower === 'now() - 1h'
)
