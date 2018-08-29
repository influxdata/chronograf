import reducer from 'src/data_explorer/reducers/queries'

import {
  updateQueryDrafts,
  updateEditorTimeRange,
  QueryUpdateState,
} from 'src/shared/actions/queries'
import {loadDE, Action} from 'src/data_explorer/actions/queries'

import {query, timeRange} from 'test/fixtures'

let state

describe('DataExplorer.Reducers.Queries', () => {
  it('loads the timeRange and queries', () => {
    const actual = reducer(state, loadDE([query], timeRange))
    expect(actual.queryDrafts).toEqual([query])
    expect(actual.timeRange).toEqual(timeRange)
  })

  it('it can update a query', () => {
    state = {queryDrafts: [query]}
    const updatedQuery = {...query, source: '/chronograf/v1/sources/12'}
    const queries = [updatedQuery]
    const action = updateQueryDrafts(queries, QueryUpdateState.DE) as Action
    const actual = reducer(state, action)
    expect(actual.queryDrafts).toEqual([updatedQuery])
  })

  it('it can update a timeRange', () => {
    state = {timeRange}
    const updatedTimeRange = {...timeRange, lower: 'now() - 15m'}
    const action = updateEditorTimeRange(
      updatedTimeRange,
      QueryUpdateState.DE
    ) as Action
    const actual = reducer(state, action)
    expect(actual.timeRange).toEqual(updatedTimeRange)
  })
})
