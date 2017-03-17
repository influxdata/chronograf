const fixture = [
  {
    queryConfig: {
      id: '96b3fbf0-c4aa-413a-865b-a4b7fc0ac54b',
      database: 'telegraf',
      measurement: 'cpu',
      retentionPolicy: 'autogen',
      fields: [
        {
          field: 'usage_idle',
          funcs: [],
        },
      ],
      tags: {},
      groupBy: {
        time: null,
        tags: [],
      },
      areTagsAccepted: true,
      rawText: null,
    },
    queryString: {
      db: "telegraf",
      label: "THREE",
      query: 'SELECT "usage_idle" FROM "cpu"',
    },
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
          funcs: [],
        },
      ],
      tags: {},
      groupBy: {
        time: null,
        tags: [],
      },
      areTagsAccepted: true,
      rawText: null,
    },
    queryString: {
      db: "telegraf",
      label: "TWO",
      query: 'SELECT "usage_user" FROM "cpu"',
    },
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
          funcs: [],
        },
      ],
      tags: {},
      groupBy: {
        time: null,
        tags: [],
      },
      areTagsAccepted: true,
      rawText: null,
    },
    queryString: {
      db: "telegraf",
      label: "ONE",
      query: 'SELECT "usage_system" FROM "cpu"',
    },
  },
]

export default fixture
