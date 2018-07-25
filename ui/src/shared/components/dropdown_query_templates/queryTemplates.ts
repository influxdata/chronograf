export interface QueryTemplate {
  text: string
  key: string
  query: string
}

export const DIVIDER: string = 'DIVIDER'

export const QUERY_TEMPLATES: QueryTemplate[] = [
  {
    text: 'Show Databases',
    key: 'Show Databases',
    query: 'SHOW DATABASES',
  },
  {
    text: 'Create Database',
    key: 'Create Database',
    query: 'CREATE DATABASE "db_name"',
  },
  {
    text: 'Drop Database',
    key: 'Drop Database',
    query: 'DROP DATABASE "db_name"',
  },
  {
    text: `${DIVIDER}`,
    key: 'divider-1',
    query: '',
  },
  {
    text: 'Show Measurements',
    key: 'Show Measurements',
    query: 'SHOW MEASUREMENTS ON "db_name"',
  },
  {
    text: 'Show Tag Keys',
    key: 'Show Tag Keys',
    query: 'SHOW TAG KEYS ON "db_name" FROM "measurement_name"',
  },
  {
    text: 'Show Tag Values',
    key: 'Show Tag Values',
    query:
      'SHOW TAG VALUES ON "db_name" FROM "measurement_name" WITH KEY = "tag_key"',
  },
  {
    text: `${DIVIDER}`,
    key: 'divider-2',
    query: '',
  },
  {
    text: 'Show Retention Policies',
    key: 'Show Retention Policies',
    query: 'SHOW RETENTION POLICIES on "db_name"',
  },
  {
    text: 'Create Retention Policy',
    key: 'Create Retention Policy',
    query:
      'CREATE RETENTION POLICY "rp_name" ON "db_name" DURATION 30d REPLICATION 1 DEFAULT',
  },
  {
    text: 'Drop Retention Policy',
    key: 'Drop Retention Policy',
    query: 'DROP RETENTION POLICY "rp_name" ON "db_name"',
  },
  {
    text: `${DIVIDER}`,
    key: 'divider-3',
    query: '',
  },
  {
    text: 'Show Continuous Queries',
    key: 'Show Continuous Queries',
    query: 'SHOW CONTINUOUS QUERIES',
  },
  {
    text: 'Create Continuous Query',
    key: 'Create Continuous Query',
    query:
      'CREATE CONTINUOUS QUERY "cq_name" ON "db_name" BEGIN SELECT min("field") INTO "target_measurement" FROM "current_measurement" GROUP BY time(30m) END',
  },
  {
    text: 'Drop Continuous Query',
    key: 'Drop Continuous Query',
    query: 'DROP CONTINUOUS QUERY "cq_name" ON "db_name"',
  },
  {
    text: `${DIVIDER}`,
    key: 'divider-4',
    query: '',
  },
  {
    text: 'Show Users',
    key: 'Show Users',
    query: 'SHOW USERS',
  },
  {
    text: 'Create User',
    key: 'Create User',
    query: 'CREATE USER "username" WITH PASSWORD \'password\'',
  },
  {
    text: 'Create Admin User',
    key: 'Create Admin User',
    query:
      'CREATE USER "username" WITH PASSWORD \'password\' WITH ALL PRIVILEGES',
  },
  {
    text: 'Drop User',
    key: 'Drop User',
    query: 'DROP USER "username"',
  },
  {
    text: `${DIVIDER}`,
    key: 'divider-5',
    query: '',
  },
  {
    text: 'Show Stats',
    key: 'Show Stats',
    query: 'SHOW STATS',
  },
  {
    text: 'Show Diagnostics',
    key: 'Show Diagnostics',
    query: 'SHOW DIAGNOSTICS',
  },
]
