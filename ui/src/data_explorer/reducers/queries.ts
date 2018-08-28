// libraries
import _ from 'lodash'
import uuid from 'uuid'

// actions
import {Action, ActionType} from 'src/data_explorer/actions/queries'

// utils
import defaultQueryConfig from 'src/utils/defaultQueryConfig'

// types
import {TimeRange} from 'src/types'
import {CellQuery} from 'src/types/dashboards'

export interface DEInitialState {
  queryDrafts: CellQuery[]
  timeRange: TimeRange
}

export const initialState = {
  queryDrafts: null,
  timeRange: null,
}

export default (state = initialState, action: Action): DEInitialState => {
  switch (action.type) {
    case ActionType.LoadDE: {
      const {timeRange, queries} = action.payload

      let queryDrafts: CellQuery[] = queries.map(q => {
        const id = _.get(q, 'queryConfig.id')
        return {...q, id}
      })

      if (_.isEmpty(queryDrafts)) {
        const id = uuid.v4()
        const newQueryConfig = {
          ...defaultQueryConfig({id}),
        }
        const newQueryDraft: CellQuery = {
          query: '',
          queryConfig: newQueryConfig,
          source: '',
          id,
        }
        queryDrafts = [newQueryDraft]
      }

      return {
        ...state,
        queryDrafts,
        timeRange,
      }
    }

    case ActionType.UpdateQueryDrafts: {
      const {queryDrafts} = action.payload

      return {...state, queryDrafts}
    }

    case ActionType.UpdateEditorTimeRange: {
      const {timeRange} = action.payload

      return {...state, timeRange}
    }
  }

  return state
}
