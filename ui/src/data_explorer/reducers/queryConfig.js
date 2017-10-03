import defaultQueryConfig from 'src/utils/defaultQueryConfig'
import {
  editRawText,
  applyFuncsToField,
  chooseMeasurement,
  chooseNamespace,
  chooseTag,
  groupByTag,
  groupByTime,
  toggleField,
  toggleTagAcceptance,
  fill,
  updateRawQuery,
} from 'src/utils/queryTransitions'

const queryConfig = (state = defaultQueryConfig(), action) => {
  switch (action.type) {
    case 'DE_CHOOSE_NAMESPACE': {
      const {queryId, database, retentionPolicy} = action.payload
      const nextQueryConfig = chooseNamespace(state[queryId], {
        database,
        retentionPolicy,
      })

      return {
        ...state,
        [queryId]: {...nextQueryConfig, rawText: null},
      }
    }

    case 'DE_CHOOSE_MEASUREMENT': {
      const {queryId, measurement} = action.payload
      const nextQueryConfig = chooseMeasurement(state[queryId], measurement)

      return {
        ...state,
        [queryId]: {
          ...nextQueryConfig,
          rawText: state[queryId].rawText,
        },
      }
    }

    case 'DE_UPDATE_QUERY_CONFIG': {
      const {config} = action.payload
      return {...state, [config.id]: config}
    }

    case 'DE_EDIT_RAW_TEXT': {
      const {queryId, rawText} = action.payload
      const nextQueryConfig = editRawText(state[queryId], rawText)

      return {
        ...state,
        [queryId]: nextQueryConfig,
      }
    }

    case 'DE_GROUP_BY_TIME': {
      const {queryId, time} = action.payload
      const nextQueryConfig = groupByTime(state[queryId], time)

      return {
        ...state,
        [queryId]: nextQueryConfig,
      }
    }

    case 'DE_TOGGLE_TAG_ACCEPTANCE': {
      const {queryId} = action.payload
      const nextQueryConfig = toggleTagAcceptance(state[queryId])

      return {
        ...state,
        [queryId]: nextQueryConfig,
      }
    }

    case 'DE_TOGGLE_FIELD': {
      const {queryId, fieldFunc} = action.payload
      const nextQueryConfig = toggleField(state[queryId], fieldFunc)

      return {
        ...state,
        [queryId]: {...nextQueryConfig, rawText: null},
      }
    }

    case 'DE_APPLY_FUNCS_TO_FIELD': {
      const {queryId, fieldFunc} = action.payload
      const nextQueryConfig = applyFuncsToField(state[queryId], fieldFunc, {
        preventAutoGroupBy: true,
      })

      return {
        ...state,
        [queryId]: nextQueryConfig,
      }
    }

    case 'DE_CHOOSE_TAG': {
      const {queryId, tag} = action.payload
      const nextQueryConfig = chooseTag(state[queryId], tag)

      return {
        ...state,
        [queryId]: nextQueryConfig,
      }
    }

    case 'DE_GROUP_BY_TAG': {
      const {queryId, tagKey} = action.payload
      const nextQueryConfig = groupByTag(state[queryId], tagKey)
      return {
        ...state,
        [queryId]: nextQueryConfig,
      }
    }

    case 'DE_FILL': {
      const {queryId, value} = action.payload
      const nextQueryConfig = fill(state[queryId], value)

      return {
        ...state,
        [queryId]: nextQueryConfig,
      }
    }

    case 'DE_UPDATE_RAW_QUERY': {
      const {queryID, text} = action.payload
      const nextQueryConfig = updateRawQuery(state[queryID], text)
      return {
        ...state,
        [queryID]: nextQueryConfig,
      }
    }

    case 'DE_EDIT_QUERY_STATUS': {
      const {queryID, status} = action.payload
      const nextState = {
        [queryID]: {...state[queryID], status},
      }

      return {...state, ...nextState}
    }
  }
  return state
}

export default queryConfig
