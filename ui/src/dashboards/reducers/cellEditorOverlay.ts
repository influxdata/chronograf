// libraries
import _ from 'lodash'

// actions
import {Action, ActionType} from 'src/dashboards/actions/cellEditorOverlay'

// types
import {Cell, TimeRange} from 'src/types'
import {NewDefaultCell} from 'src/types/dashboards'

export interface CEOInitialState {
  cell: Cell | NewDefaultCell | null
  timeRange: TimeRange
}

export const initialState = {
  cell: null,
  timeRange: null,
}

export default (state = initialState, action: Action): CEOInitialState => {
  switch (action.type) {
    case ActionType.ClearCEO: {
      const cell = null
      const timeRange = null

      return {...state, cell, timeRange}
    }

    case ActionType.UpdateEditorTimeRange: {
      const {timeRange} = action.payload

      return {...state, timeRange}
    }
  }

  return state
}
