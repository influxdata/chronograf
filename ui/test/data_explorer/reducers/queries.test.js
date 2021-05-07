import reducer from 'src/data_explorer/reducers/queries'

import {
  editQueryStatus,
  resetQueryStatuses,
  updateSourceLink,
} from 'src/data_explorer/actions/queries'

describe('DataExplorer.Reducers.queries', () => {
  it('it sets the default query statuses', () => {
    const state = reducer(undefined, {type: 'NOOP'})

    expect(state.queryStatuses).toEqual({})
  })

  it('updates query status', () => {
    const state = reducer(undefined, editQueryStatus('q1', {success: 'ok'}))

    expect(state.queryStatuses).toEqual({q1: {success: 'ok'}})
  })
  it('updates multiple query statuses', () => {
    let state = reducer(undefined, editQueryStatus('q1', {success: 'ok'}))
    state = reducer(state, editQueryStatus('q1', {warn: 'ok'}))
    state = reducer(state, editQueryStatus('q2', {error: 'no'}))

    expect(state.queryStatuses).toEqual({q1: {warn: 'ok'}, q2: {error: 'no'}})
  })
  it('resets query statuses', () => {
    let state = reducer(undefined, editQueryStatus('q1', {success: 'ok'}))
    state = reducer(state, resetQueryStatuses())

    expect(state.queryStatuses).toEqual({})
  })
  it('updates source link', () => {
    let state = reducer(undefined, {type: 'NOOP'})
    expect(state.sourceLink).toEqual('')
    state = reducer(state, updateSourceLink('newLink'))

    expect(state.sourceLink).toEqual('newLink')
  })
})
