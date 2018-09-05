// Libraries
import reducer, {initialState} from 'src/dashboards/reducers/cellEditorOverlay'

// Actions
import {
  loadCEO,
  clearCEO,
  renameCell,
  Action,
} from 'src/dashboards/actions/cellEditorOverlay'
import {
  updateVisType,
  updateThresholdsListColors,
  updateThresholdsListType,
  updateGaugeColors,
  updateLineColors,
  updateAxes,
} from 'src/shared/actions/visualizations'
import {
  updateEditorTimeRange,
  updateQueryDrafts,
  QueryUpdateState,
} from 'src/shared/actions/queries'

// Constants
import {DEFAULT_TABLE_OPTIONS} from 'src/dashboards/constants'
import {
  validateGaugeColors,
  validateThresholdsListColors,
  getThresholdsListType,
} from 'src/shared/constants/thresholds'
import {validateLineColors} from 'src/shared/constants/graphColorPalettes'

// Fixtures
import {cell, axes, timeRange, query} from 'test/fixtures'

// Types
import {Cell} from 'src/types/dashboards'

const defaultCell = {
  ...cell,
}

const defaultThresholdsListType = getThresholdsListType(defaultCell.colors)
const defaultThresholdsListColors = validateThresholdsListColors(
  defaultCell.colors,
  defaultThresholdsListType
)
const defaultGaugeColors = validateGaugeColors(defaultCell.colors)
const defaultLineColors = validateLineColors(defaultCell.colors)

let state

describe('Dashboards.Reducers.cellEditorOverlay', () => {
  it('should show cell editor overlay', () => {
    const actual = reducer(initialState, loadCEO(defaultCell, timeRange))
    const expected = {
      cell: defaultCell,
      gaugeColors: defaultGaugeColors,
      thresholdsListColors: defaultThresholdsListColors,
      thresholdsListType: defaultThresholdsListType,
      tableOptions: DEFAULT_TABLE_OPTIONS,
      timeRange,
    }

    expect(actual.cell).toEqual(expected.cell)
    expect(actual.gaugeColors).toBe(expected.gaugeColors)
    expect(actual.thresholdsListColors).toBe(expected.thresholdsListColors)
    expect(actual.thresholdsListType).toBe(expected.thresholdsListType)
    expect(actual.timeRange).toBe(expected.timeRange)
  })

  it('should hide cell editor overlay', () => {
    const actual = reducer(initialState, clearCEO())
    const expected = null

    expect(actual.cell).toBe(expected)
    expect(actual.timeRange).toBe(expected)
  })

  it('should change the cell editor visualization type', () => {
    const action = updateVisType(
      defaultCell.type,
      QueryUpdateState.CEO
    ) as Action
    const actual = reducer(initialState, action)
    const expected = defaultCell.type

    expect(actual.cell.type).toBe(expected)
  })

  it('should change the name of the cell', () => {
    const actual = reducer(initialState, renameCell(defaultCell.name))
    const expected = defaultCell.name

    expect(actual.cell.name).toBe(expected)
  })

  it('should update the cell single stat colors', () => {
    const action = updateThresholdsListColors(
      defaultThresholdsListColors,
      QueryUpdateState.CEO
    ) as Action
    const actual = reducer(initialState, action)
    const expected = defaultThresholdsListColors

    expect(actual.thresholdsListColors).toBe(expected)
  })

  it('should toggle the single stat type', () => {
    const action = updateThresholdsListType(
      defaultThresholdsListType,
      QueryUpdateState.CEO
    ) as Action
    const actual = reducer(initialState, action)
    const expected = defaultThresholdsListType

    expect(actual.thresholdsListType).toBe(expected)
  })

  it('should update the cell gauge colors', () => {
    const action = updateGaugeColors(
      defaultGaugeColors,
      QueryUpdateState.CEO
    ) as Action
    const actual = reducer(initialState, action)
    const expected = defaultGaugeColors

    expect(actual.gaugeColors).toBe(expected)
  })

  it('should update the cell axes', () => {
    const action = updateAxes(axes, QueryUpdateState.CEO) as Action
    const actual = reducer(initialState, action)
    const expected = axes
    const actualCell = actual.cell as Cell

    expect(actualCell.axes).toBe(expected)
  })

  it('should update the cell line graph colors', () => {
    const action = updateLineColors(
      defaultLineColors,
      QueryUpdateState.CEO
    ) as Action
    const actual = reducer(initialState, action)
    const expected = defaultLineColors

    expect(actual.lineColors).toBe(expected)
  })

  it('it can update a query', () => {
    state = {queryDrafts: [query]}
    const updatedQuery = {...query, source: '/chronograf/v1/sources/12'}
    const queries = [updatedQuery]
    const action = updateQueryDrafts(queries, QueryUpdateState.CEO) as Action
    const actual = reducer(state, action)
    expect(actual.queryDrafts).toEqual([updatedQuery])
  })

  it('it can update a timeRange', () => {
    state = {timeRange}
    const updatedTimeRange = {...timeRange, lower: 'now() - 15m'}
    const action = updateEditorTimeRange(
      updatedTimeRange,
      QueryUpdateState.CEO
    ) as Action
    const actual = reducer(state, action)
    expect(actual.timeRange).toEqual(updatedTimeRange)
  })
})
