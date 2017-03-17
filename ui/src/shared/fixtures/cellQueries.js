const fixture = [{
  queryConfig: {
    id: '96b3fbf0-c4aa-413a-865b-a4b7fc0ac54b',
    database: 'telegraf',
    measurement: 'cpu',
    retentionPolicy: 'autogen',
    fields: [
      {
        field: 'usage_idle',
        funcs: []
      }
    ],
    tags: {},
    groupBy: {
      time: null,
      tags: []
    },
    areTagsAccepted: true,
    rawText: null
  },
  queryString: 'SELECT "usage_idle" FROM "telegraf"."autogen"."cpu" WHERE time > now() - 15m',
},
{
  queryConfig: {
    id: 'd9f17d62-2a89-4d95-85fb-595c7ed7b44e',
    database: 'telegraf',
    measurement: 'cpu',
    retentionPolicy: 'autogen',
    fields: [
      {
        field: 'usage_user',
        funcs: []
      }
    ],
    tags: {},
    groupBy: {
      time: null,
      tags: []
    },
    areTagsAccepted: true,
    rawText: null
  },
  queryString: 'SELECT "usage_user" FROM "telegraf"."autogen"."cpu" WHERE time > now() - 15m',
},
{
  queryConfig: {
    id: 'd1831052-167b-471b-8073-fac5ea2a9103',
    database: 'telegraf',
    measurement: 'cpu',
    retentionPolicy: 'autogen',
    fields: [
      {
        field: 'usage_system',
        funcs: []
      }
    ],
    tags: {},
    groupBy: {
      time: null,
      tags: []
    },
    areTagsAccepted: true,
    rawText: null
  },
  queryString: 'SELECT "usage_system" FROM "telegraf"."autogen"."cpu" WHERE time > now() - 15m',
}]

export default fixture
