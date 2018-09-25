// Libraries
import reducer, {initialState} from 'src/dashboards/reducers/cellEditorOverlay'

// Actions
import {clearCEO, renameCell} from 'src/dashboards/actions/cellEditorOverlay'

// Fixtures
import {cell} from 'test/fixtures'

const defaultCell = {
  ...cell,
}

describe('Dashboards.Reducers.cellEditorOverlay', () => {
  it('should hide cell editor overlay', () => {
    const actual = reducer(initialState, clearCEO())
    const expected = null

    expect(actual.cell).toBe(expected)
    expect(actual.timeRange).toBe(expected)
  })

  it('should change the name of the cell', () => {
    const actual = reducer(initialState, renameCell(defaultCell.name))
    const expected = defaultCell.name

    expect(actual.cell.name).toBe(expected)
  })
})
