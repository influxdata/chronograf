import {createValuesQuery} from 'src/shared/components/TimeMachine/fluxQueryBuilder/apis/fluxQueries'
import {BuilderTagsType} from 'src/shared/components/TimeMachine/fluxQueryBuilder/types'

describe('createQuery', () => {
  ;[
    {
      name: 'query for v1 with no _field',
      searchTerm: '',
      dbVersion: '1.11.0',
      tagsSelections: [
        {
          tagKey: '_measurement',
          tagValues: ['win_cpu'],
        },
      ] as BuilderTagsType[],
      bucket: 'telegraf',
      timeRangeArguments: 'start: -6h',
      tagFilter: '\n  |> filter(fn: (r) => (r["_measurement"] == "win_cpu"))',
      key: '_measurement',
      limit: 200,
      query: `import "regexp"
  
from(bucket: "telegraf")
  |> range(start: -6h)
  |> filter(fn: (r) => (r["_measurement"] == "win_cpu"))
  |> keep(columns: ["_measurement"])
  |> group()
  |> distinct(column: "_measurement")
  |> sort()
  |> limit(n: 200)`,
    },
    {
      name: 'query for v1 with  _field',
      searchTerm: '',
      dbVersion: '1.11.0',
      tagsSelections: [
        {
          tagKey: '_measurement',
          tagValues: ['win_cpu'],
        },
        {
          tagKey: '_field',
          tagValues: ['Percent_Idle_Time'],
        },
      ] as BuilderTagsType[],
      bucket: 'telegraf',
      timeRangeArguments: 'start: -1h',
      tagFilter:
        '\n  |> filter(fn: (r) => (r["_measurement"] == "win_cpu") and (r["_field"] == "Percent_Idle_Time"))',
      key: 'host',
      limit: 200,
      query: `import "regexp"
  
from(bucket: "telegraf")
  |> range(start: -1h)
  |> filter(fn: (r) => (r["_measurement"] == "win_cpu") and (r["_field"] == "Percent_Idle_Time"))
  |> keep(columns: ["host", "_field"])
  |> group()
  |> distinct(column: "host")
  |> sort()
  |> limit(n: 200)`,
    },
    {
      name: 'query for ENT with  _field',
      searchTerm: '',
      dbVersion: 'ENT',
      tagsSelections: [
        {
          tagKey: '_measurement',
          tagValues: ['win_cpu'],
        },
        {
          tagKey: '_field',
          tagValues: ['Percent_Idle_Time'],
        },
      ] as BuilderTagsType[],
      bucket: 'telegraf',
      timeRangeArguments: 'start: -1h',
      tagFilter:
        '\n  |> filter(fn: (r) => (r["_measurement"] == "win_cpu") and (r["_field"] == "Percent_Idle_Time"))',
      key: 'host',
      limit: 200,
      query: `import "regexp"
  
from(bucket: "telegraf")
  |> range(start: -1h)
  |> filter(fn: (r) => (r["_measurement"] == "win_cpu") and (r["_field"] == "Percent_Idle_Time"))
  |> keep(columns: ["host", "_field"])
  |> group()
  |> distinct(column: "host")
  |> sort()
  |> limit(n: 200)`,
    },
    {
      name: 'query for v2 w/o  _field',
      searchTerm: '',
      dbVersion: '2.7.0',
      tagsSelections: [
        {
          tagKey: '_measurement',
          tagValues: ['win_cpu'],
        },
        {
          tagKey: '_field',
          tagValues: ['Percent_Idle_Time'],
        },
      ] as BuilderTagsType[],
      bucket: 'telegraf',
      timeRangeArguments: 'start: -1h',
      tagFilter:
        '\n  |> filter(fn: (r) => (r["_measurement"] == "win_cpu") and (r["_field"] == "Percent_Idle_Time"))',
      key: 'host',
      limit: 100,
      query: `import "regexp"
  
from(bucket: "telegraf")
  |> range(start: -1h)
  |> filter(fn: (r) => (r["_measurement"] == "win_cpu") and (r["_field"] == "Percent_Idle_Time"))
  |> keep(columns: ["host"])
  |> group()
  |> distinct(column: "host")
  |> sort()
  |> limit(n: 100)`,
    },
  ].forEach(x => {
    it('creates a query ' + x.name, () => {
      const query = createValuesQuery(
        x.searchTerm,
        x.dbVersion,
        x.tagsSelections,
        x.bucket,
        x.timeRangeArguments,
        x.tagFilter,
        x.key,
        x.limit
      )
      expect(query).toEqual(x.query)
    })
  })
})
