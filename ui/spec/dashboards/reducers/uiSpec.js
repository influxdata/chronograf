import reducer from 'src/dashboards/reducers/ui'
import timeRanges from 'hson!src/shared/data/timeRanges.hson';

import {
  loadDashboards,
  setDashboard,
  setTimeRange,
  setEditMode,
  editCell,
} from 'src/dashboards/actions'

const noopAction = () => {
  return {type: 'NOOP'}
}

let state = undefined
const timeRange = timeRanges[1];
const d1 = {id: 1, cells: [], name: "d1"}
const d2 = {id: 2, cells: [], name: "d2"}
const dashboards = [d1, d2]

describe('DataExplorer.Reducers.UI', () => {
  it('can load the dashboards', () => {
    const actual = reducer(state, loadDashboards(dashboards, d1.id))
    const expected = {
      dashboards,
      dashboard: d1,
    }

    expect(actual.dashboards).to.deep.equal(expected.dashboards)
    expect(actual.dashboard).to.deep.equal(expected.dashboard)
  })

  it('can set a dashboard', () => {
    const loadedState = reducer(state, loadDashboards(dashboards, d1.id))
    const actual = reducer(loadedState, setDashboard(d2.id))

    expect(actual.dashboard).to.deep.equal(d2)
  })

  it('can set the time range', () => {
    const expected = {upper: null, lower: 'now() - 1h'}
    const actual = reducer(state, setTimeRange(expected))

    expect(actual.timeRange).to.deep.equal(expected)
  })

  it('can set edit mode', () => {
    const isEditMode = true
    const actual = reducer(state, setEditMode(isEditMode))
    expect(actual.isEditMode).to.equal(isEditMode)
  })

  it('can edit cell', () => {
    state = {
      dashboards: [{
        id: 1,
        cells: [{
          x: 0,
          y: 0,
          w: 4,
          h: 4,
          id: 1,
          isEditing: false,
        }]
      }]
    }

    const actual = reducer(state, editCell(1, 0, 0, true))
    expect(actual.dashboards[0].cells[0].isEditing).to.equal(true)
  })

  it('can rename cells', () => {
  })
})
