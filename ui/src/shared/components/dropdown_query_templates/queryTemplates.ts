export enum QueryTemplateTypes {
  Template = 'template',
  Divider = 'divider',
}

export interface QueryTemplate {
  text: string
  key: string
  query: string
  type: QueryTemplateTypes
}

export const QUERY_TEMPLATES: QueryTemplate[] = [
  {
    text: 'Show Databases',
    key: 'Show Databases',
    query: 'SHOW DATABASES',
    type: QueryTemplateTypes.Template,
  },
  {
    text: 'Create Database',
    key: 'Create Database',
    query: 'CREATE DATABASE "db_name"',
    type: QueryTemplateTypes.Template,
  },
  {
    text: 'Drop Database',
    key: 'Drop Database',
    query: 'DROP DATABASE "db_name"',
    type: QueryTemplateTypes.Template,
  },
  {
    text: QueryTemplateTypes.Divider,
    key: 'divider-1',
    query: '',
    type: QueryTemplateTypes.Divider,
  },
  {
    text: 'Show Measurements',
    key: 'Show Measurements',
    query: 'SHOW MEASUREMENTS ON "db_name"',
    type: QueryTemplateTypes.Template,
  },
  {
    text: 'Show Tag Keys',
    key: 'Show Tag Keys',
    query: 'SHOW TAG KEYS ON "db_name" FROM "measurement_name"',
    type: QueryTemplateTypes.Template,
  },
  {
    text: 'Show Tag Values',
    key: 'Show Tag Values',
    query:
      'SHOW TAG VALUES ON "db_name" FROM "measurement_name" WITH KEY = "tag_key"',
    type: QueryTemplateTypes.Template,
  },
  {
    text: QueryTemplateTypes.Divider,
    key: 'divider-2',
    query: '',
    type: QueryTemplateTypes.Divider,
  },
  {
    text: 'Show Retention Policies',
    key: 'Show Retention Policies',
    query: 'SHOW RETENTION POLICIES on "db_name"',
    type: QueryTemplateTypes.Template,
  },
  {
    text: 'Create Retention Policy',
    key: 'Create Retention Policy',
    query:
      'CREATE RETENTION POLICY "rp_name" ON "db_name" DURATION 30d REPLICATION 1 DEFAULT',
    type: QueryTemplateTypes.Template,
  },
  {
    text: 'Drop Retention Policy',
    key: 'Drop Retention Policy',
    query: 'DROP RETENTION POLICY "rp_name" ON "db_name"',
    type: QueryTemplateTypes.Template,
  },
  {
    text: QueryTemplateTypes.Divider,
    key: 'divider-3',
    query: '',
    type: QueryTemplateTypes.Divider,
  },
  {
    text: 'Show Continuous Queries',
    key: 'Show Continuous Queries',
    query: 'SHOW CONTINUOUS QUERIES',
    type: QueryTemplateTypes.Template,
  },
  {
    text: 'Create Continuous Query',
    key: 'Create Continuous Query',
    query:
      'CREATE CONTINUOUS QUERY "cq_name" ON "db_name" BEGIN SELECT min("field") INTO "target_measurement" FROM "current_measurement" GROUP BY time(30m) END',
    type: QueryTemplateTypes.Template,
  },
  {
    text: 'Drop Continuous Query',
    key: 'Drop Continuous Query',
    query: 'DROP CONTINUOUS QUERY "cq_name" ON "db_name"',
    type: QueryTemplateTypes.Template,
  },
  {
    text: QueryTemplateTypes.Divider,
    key: 'divider-4',
    query: '',
    type: QueryTemplateTypes.Divider,
  },
  {
    text: 'Show Users',
    key: 'Show Users',
    query: 'SHOW USERS',
    type: QueryTemplateTypes.Template,
  },
  {
    text: 'Create User',
    key: 'Create User',
    query: 'CREATE USER "username" WITH PASSWORD \'password\'',
    type: QueryTemplateTypes.Template,
  },
  {
    text: 'Create Admin User',
    key: 'Create Admin User',
    query:
      'CREATE USER "username" WITH PASSWORD \'password\' WITH ALL PRIVILEGES',
    type: QueryTemplateTypes.Template,
  },
  {
    text: 'Drop User',
    key: 'Drop User',
    query: 'DROP USER "username"',
    type: QueryTemplateTypes.Template,
  },
  {
    text: QueryTemplateTypes.Divider,
    key: 'divider-5',
    query: '',
    type: QueryTemplateTypes.Divider,
  },
  {
    text: 'Show Stats',
    key: 'Show Stats',
    query: 'SHOW STATS',
    type: QueryTemplateTypes.Template,
  },
  {
    text: 'Show Diagnostics',
    key: 'Show Diagnostics',
    query: 'SHOW DIAGNOSTICS',
    type: QueryTemplateTypes.Template,
  },
]
