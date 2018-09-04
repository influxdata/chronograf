// libraries
import _ from 'lodash'
import uuid from 'uuid'

// actions
import {Action, ActionType} from 'src/data_explorer/actions/queries'

// utils
import defaultQueryConfig from 'src/utils/defaultQueryConfig'

// constants
import {timeRanges} from 'src/shared/data/timeRanges'
import {editor} from 'src/flux/constants'

// types
import {DEInitialState} from 'src/data_explorer/actions/queries'
import {CellQuery} from 'src/types/dashboards'

const {lower, upper} = timeRanges.find(tr => tr.lower === 'now() - 1h')

export const initialState: DEInitialState = {
  queryDrafts: null,
  timeRange: {lower, upper},
  queryStatus: {queryID: null, status: null},
  script: editor.DEFAULT_SCRIPT,
  sourceLink: '',
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

    case ActionType.UpdateQueryStatus: {
      const {queryID, status} = action.payload
      const queryStatus = {queryID, status}
      return {...state, queryStatus}
    }

    case ActionType.UpdateScript: {
      const {script} = action.payload

      return {...state, script}
    }

    case ActionType.UpdateSourceLink: {
      const {sourceLink} = action.payload

      return {...state, sourceLink}
    }
  }

  return state
}
