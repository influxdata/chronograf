import {initialSelectorState as initialTagState} from 'src/shared/components/TimeMachine/fluxQueryBuilder/reducers/tags'
import {initialState as initialBucketsState} from 'src/shared/components/TimeMachine/fluxQueryBuilder/reducers/buckets'
import {initialState as initialAggState} from 'src/shared/components/TimeMachine/fluxQueryBuilder/reducers/aggregation'
import {QueryBuilderState} from 'src/shared/components/TimeMachine/fluxQueryBuilder/types'
import {
  buildQuery,
  formatTimeRangeArguments,
  tagToFlux,
} from 'src/shared/components/TimeMachine/fluxQueryBuilder/util/generateFlux'

describe('fluxQueryBuilder/util/generateFlux', () => {
  test('formatTimeRangeArguments', () => {
    expect(formatTimeRangeArguments({lower: 'xyz', lowerFlux: '-10s'})).toBe(
      'start: -10s'
    )
    expect(formatTimeRangeArguments({lower: 'a', upper: 'b'})).toBe(
      'start: a, stop: b'
    )
  })
  test('tagToFlux', () => {
    expect(
      tagToFlux({
        tagKey: 'a',
        tagValues: ['v1'],
        aggregateFunctionType: 'filter',
      })
    ).toBe('r["a"] == "v1"')
    expect(
      tagToFlux({
        tagKey: 'a',
        tagValues: ['x', 'y', 'z'],
        aggregateFunctionType: 'group', // type of aggregation does no matter
      })
    ).toBe('r["a"] == "x" or r["a"] == "y" or r["a"] == "z"')
    expect(
      tagToFlux({
        tagKey: 'a"', // key name must be escaped
        tagValues: ['x"'], // key value must be escaped
        aggregateFunctionType: 'filter',
      })
    ).toBe('r["a\\""] == "x\\""')
  })
  test('buildQuery', () => {
    expect(buildQuery({buckets: {}} as QueryBuilderState)).toBeUndefined()
    expect(
      buildQuery({
        buckets: {...initialBucketsState, selectedBucket: 'b"'},
        tags: [{...initialTagState(0), tagKey: 'tk"', tagValues: ['tv"']}],
        aggregation: {...initialAggState, selectedFunctions: []},
      })
    ).toBe(`from(bucket: "b\\"")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["tk\\""] == "tv\\"")`)
    expect(
      buildQuery({
        buckets: {...initialBucketsState, selectedBucket: 'b"'},
        tags: [
          {...initialTagState(0), tagKey: 'tk1', tagValues: ['tv1']},
          {...initialTagState(0), tagKey: 'tk2', tagValues: ['tv2']},
        ],
        aggregation: {...initialAggState, selectedFunctions: ['notExists']},
      })
    ).toBe(`from(bucket: "b\\"")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["tk1"] == "tv1")
  |> filter(fn: (r) => r["tk2"] == "tv2")
  |> yield(name: "notExists")`)
    expect(
      buildQuery({
        buckets: {...initialBucketsState, selectedBucket: 'b"'},
        tags: [
          {...initialTagState(0), tagKey: 'tk1', tagValues: ['tv1']},
          {...initialTagState(0), tagKey: 'tk2', tagValues: ['tv2']},
        ],
        aggregation: {
          ...initialAggState,
          selectedFunctions: ['sum'],
          fillMissing: true,
        },
      })
    ).toBe(`from(bucket: "b\\"")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["tk1"] == "tv1")
  |> filter(fn: (r) => r["tk2"] == "tv2")
  |> aggregateWindow(every: v.windowPeriod, fn: sum, createEmpty: true)
  |> yield(name: "sum")`)
    expect(
      buildQuery({
        buckets: {...initialBucketsState, selectedBucket: 'b"'},
        tags: [
          {...initialTagState(0), tagKey: 'tk1', tagValues: ['tv1']},
          {
            ...initialTagState(0),
            tagKey: 'tk2',
            tagValues: ['tv2'],
            aggregateFunctionType: 'group',
          },
        ],
        aggregation: {
          ...initialAggState,
        },
      })
    ).toBe(`from(bucket: "b\\"")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["tk1"] == "tv1")
  |> group(columns: ["tv2"])
  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)
  |> yield(name: "mean")`)
    expect(
      buildQuery({
        buckets: {...initialBucketsState, selectedBucket: 'b'},
        tags: [{...initialTagState(0), tagKey: 'tk1', tagValues: ['tv1']}],
        aggregation: {
          ...initialAggState,
          selectedFunctions: ['mean', 'last'],
        },
      })
    ).toBe(`from(bucket: "b")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["tk1"] == "tv1")
  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)
  |> yield(name: "mean")

from(bucket: "b")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["tk1"] == "tv1")
  |> aggregateWindow(every: v.windowPeriod, fn: last, createEmpty: false)
  |> yield(name: "last")`)
  })
})
