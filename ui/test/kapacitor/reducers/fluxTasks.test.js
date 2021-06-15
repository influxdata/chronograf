import reducer from 'src/kapacitor/reducers/fluxTasks'

import {
  deleteFluxTaskSuccess,
  updateFluxTaskStatusSuccess,
} from 'src/kapacitor/actions/view'

describe('Kapacitor.Reducers.fluxTasks', () => {
  it('creates a default state', () => {
    const state = reducer(undefined, {type: '@@INIT'})
    expect(state).toEqual([])
  })
  it('it can delete a task', () => {
    const initialState = [
      {
        id: 'a',
      },
      {
        id: 'b',
      },
    ]

    const newState = reducer(initialState, deleteFluxTaskSuccess('b'))
    expect(newState).toEqual([{id: 'a'}])
  })

  it('it updates task status', () => {
    const initialState = [
      {
        id: 'a',
      },
      {
        id: 'b',
      },
    ]

    const newState = reducer(
      initialState,
      updateFluxTaskStatusSuccess({id: 'b', status: 'active'}, 'inactive')
    )
    expect(newState).toEqual([{id: 'a'}, {id: 'b', status: 'inactive'}])
  })
})
