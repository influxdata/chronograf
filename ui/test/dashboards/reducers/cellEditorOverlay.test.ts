// Libraries
import reducer, {initialState} from 'src/dashboards/reducers/cellEditorOverlay'

// Actions
import {clearCEO} from 'src/dashboards/actions/cellEditorOverlay'

describe('Dashboards.Reducers.cellEditorOverlay', () => {
  it('should hide cell editor overlay', () => {
    const actual = reducer(initialState, clearCEO())
    const expected = null

    expect(actual.cell).toBe(expected)
    expect(actual.timeRange).toBe(expected)
  })
})
