import {renderTemplatesInScript} from 'src/flux/helpers/templates'
import {Template, TemplateType, TemplateValueType} from 'src/types'

const allTemplateTypes: Template[] = [
  {
    tempVar: ':databaseVar:',
    values: [
      {
        value: '_internal',
        type: TemplateValueType.Database,
        selected: true,
        localSelected: false,
      },
    ],
    id: '90786cdf-235f-4c28-a124-b4b475fc6c0e',
    type: TemplateType.Databases,
    label: '',
    query: {
      influxql: 'SHOW DATABASES',
      measurement: '',
      tagKey: '',
      fieldKey: '',
    },
    sourceID: 'dynamic',
  },
  {
    tempVar: ':measurements:',
    values: [
      {
        value: 'test',
        type: TemplateValueType.Measurement,
        selected: true,
        localSelected: true,
      },
    ],
    id: '59d7d37b-d2de-44ad-8de7-45631368cc00',
    type: TemplateType.Measurements,
    label: '',
    query: {
      influxql: 'SHOW MEASUREMENTS ON :database:',
      db: 'chronograf',
      measurement: '',
      tagKey: '',
      fieldKey: '',
    },
    sourceID: 'dynamic',
  },
  {
    tempVar: ':fieldKeys:',
    values: [
      {
        value: 'val',
        type: TemplateValueType.FieldKey,
        selected: true,
        localSelected: true,
      },
    ],
    id: '36ae5289-7a69-4a3a-839f-63eaabd87e71',
    type: TemplateType.FieldKeys,
    label: '',
    query: {
      influxql: 'SHOW FIELD KEYS ON :database: FROM :measurement:',
      db: 'my-bucket',
      measurement: 'test',
      tagKey: '',
      fieldKey: '',
    },
    sourceID: 'dynamic',
  },
  {
    tempVar: ':tagKeys:',
    values: [
      {
        value: 'hostname',
        type: TemplateValueType.TagKey,
        localSelected: false,
        selected: true,
      },
    ],
    id: '066a4995-2f01-466e-902a-50a78483eaa1',
    type: TemplateType.TagKeys,
    label: '',
    query: {
      influxql: 'SHOW TAG KEYS ON :database: FROM :measurement:',
      db: '_internal',
      measurement: 'cq',
      tagKey: '',
      fieldKey: '',
    },
    sourceID: 'dynamic',
  },
  {
    tempVar: ':tagVals:',
    values: [
      {
        value: '692282f44bd3',
        type: TemplateValueType.TagValue,
        localSelected: false,
        selected: true,
      },
    ],
    id: 'ce943748-bda5-4d89-846c-8f1387e4f080',
    type: TemplateType.TagValues,
    label: '',
    query: {
      influxql:
        'SHOW TAG VALUES ON :database: FROM :measurement: WITH KEY=:tagKey:',
      db: '_internal',
      measurement: 'cq',
      tagKey: 'hostname',
      fieldKey: '',
    },
    sourceID: 'dynamic',
  },
  {
    tempVar: ':csv:',
    values: [
      {
        value: '1',
        type: TemplateValueType.CSV,
        localSelected: false,
        selected: true,
      },
      {
        value: '2',
        type: TemplateValueType.CSV,
        localSelected: false,
        selected: false,
      },
      {
        value: 'b',
        type: TemplateValueType.CSV,
        localSelected: true,
        selected: false,
      },
    ],
    id: '7fe58a75-68a4-4636-93ce-e80c71653bb7',
    type: TemplateType.CSV,
    label: '',
    query: {
      influxql: '',
      measurement: '',
      tagKey: '',
      fieldKey: '',
    },
    sourceID: 'dynamic',
  },
  {
    tempVar: ':map:',
    values: [
      {
        value: '1',
        type: TemplateValueType.Map,
        selected: true,
        localSelected: false,
        key: 'a',
      },
      {
        value: '2',
        type: TemplateValueType.Map,
        localSelected: true,
        selected: false,
        key: 'b',
      },
    ],
    id: 'bcadb9fc-5b17-4f0c-b75f-634b9de375dd',
    type: TemplateType.Map,
    label: '',
    query: {
      influxql: '',
      measurement: '',
      tagKey: '',
      fieldKey: '',
    },
    sourceID: 'dynamic',
  },
  {
    tempVar: ':customMetaQuery:',
    values: [
      {
        value: '_internal',
        type: TemplateValueType.MetaQuery,
        localSelected: false,
        selected: true,
      },
    ],
    id: '1a2edf13-39fd-41fe-8f22-65fc9267bc11',
    type: TemplateType.MetaQuery,
    label: '',
    query: {
      influxql: 'show databases',
      measurement: '',
      tagKey: '',
      fieldKey: '',
    },
    sourceID: 'dynamic',
  },
  {
    tempVar: ':text:',
    values: [
      {
        value: '${"',
        type: TemplateValueType.Constant,
        localSelected: false,
        selected: true,
      },
    ],
    id: 'ce304477-4dde-486b-a4c0-fc01c7e1e7ae',
    type: TemplateType.Text,
    label: '',
    sourceID: 'dynamic',
  },
  {
    id: 'dashtime',
    tempVar: ':dashboardTime:',
    type: TemplateType.Constant,
    label: '',
    values: [
      {
        value: 'now() - 15m',
        type: TemplateValueType.Constant,
        selected: true,
        localSelected: true,
      },
    ],
  },
  {
    id: 'upperdashtime',
    tempVar: ':upperDashboardTime:',
    type: TemplateType.Constant,
    label: '',
    values: [
      {
        value: 'now()',
        type: TemplateValueType.Constant,
        selected: true,
        localSelected: true,
      },
    ],
  },
  {
    id: 'interval',
    type: TemplateType.AutoGroupBy,
    tempVar: ':interval:',
    label: 'automatically determine the best group by time',
    values: [
      {
        value: '700',
        type: TemplateValueType.Points,
        selected: true,
        localSelected: true,
      },
    ],
  },
]

describe('Flux.helpers.renderTemplatesInScript', () => {
  it('renders all variables without interval', async () => {
    const actual = await renderTemplatesInScript(
      `buckets()`,
      {lower: '-1h', upper: '2021-03-08T06:32:31.335Z'},
      allTemplateTypes,
      ''
    )
    let expected =
      '\n\ndashboardTime = -1h\nupperDashboardTime = 2021-03-08T06:32:31.335Z\n'
    expected +=
      'v = { "databaseVar" : "_internal" , "measurements" : "test" , "fieldKeys" : "val" , "tagKeys" : "hostname" , "tagVals" : "692282f44bd3" , "csv" : "b" , "map" : "2" , "customMetaQuery" : "_internal" , "text" : "\\${\\""  , timeRangeStart: dashboardTime , timeRangeStop: upperDashboardTime }'
    expected += '\n\nbuckets()'
    expect(actual).toEqual(expected)
  })
  it('renders all variables with interval', async () => {
    const actual = await renderTemplatesInScript(
      `from(bucket: "a") |> range(start: 0) |> aggregateWindow(every: v.windowPeriod, fn: mean)`,
      {lower: '-1h', upper: '2021-03-08T06:32:31.335Z'},
      allTemplateTypes,
      ''
    )
    let expected =
      '\n\ndashboardTime = -1h\nupperDashboardTime = 2021-03-08T06:32:31.335Z\nautoInterval = 1667ms\n'
    expected +=
      'v = { "databaseVar" : "_internal" , "measurements" : "test" , "fieldKeys" : "val" , "tagKeys" : "hostname" , "tagVals" : "692282f44bd3" , "csv" : "b" , "map" : "2" , "customMetaQuery" : "_internal" , "text" : "\\${\\""  , timeRangeStart: dashboardTime , timeRangeStop: upperDashboardTime , windowPeriod: autoInterval }'
    expected +=
      '\n\nfrom(bucket: "a") |> range(start: 0) |> aggregateWindow(every: v.windowPeriod, fn: mean)'
    expect(actual).toEqual(expected)
  })
})
