import {getQueryConfig} from 'shared/apis'
import {errorThrown} from 'shared/actions/errors'
import {DEFAULT_DATA_EXPLORER_GROUP_BY_INTERVAL} from 'src/data_explorer/constants'

export const toggleField = fieldFunc => ({
  type: 'DE_TOGGLE_FIELD',
  payload: {
    fieldFunc,
  },
})

export const groupByTime = time => ({
  type: 'DE_GROUP_BY_TIME',
  payload: {
    time,
  },
})

export const fill = value => ({
  type: 'DE_FILL',
  payload: {
    value,
  },
})

// all fields implicitly have a function applied to them by default, unless
// it was explicitly removed previously, so set the auto group by time except
// under that removal condition
export const toggleFieldWithGroupByInterval = fieldFunc => (
  dispatch,
  getState
) => {
  dispatch(toggleField(fieldFunc))
  // toggleField determines whether to add a func, so now check state for funcs
  // presence, and if present then apply default group by time
  const updatedFieldFunc = getState().dataExplorerQueryConfig.fields.find(
    ({field}) => field === fieldFunc.field
  )
  // updatedFieldFunc could be undefined if it was toggled for removal
  if (updatedFieldFunc && updatedFieldFunc.funcs.length) {
    dispatch(groupByTime(DEFAULT_DATA_EXPLORER_GROUP_BY_INTERVAL))
  }
}

export const applyFuncsToField = fieldFunc => ({
  type: 'DE_APPLY_FUNCS_TO_FIELD',
  payload: {
    fieldFunc,
  },
})

export const chooseTag = tag => ({
  type: 'DE_CHOOSE_TAG',
  payload: {
    tag,
  },
})

export const chooseNamespace = ({database, retentionPolicy}) => ({
  type: 'DE_CHOOSE_NAMESPACE',
  payload: {
    database,
    retentionPolicy,
  },
})

export const chooseMeasurement = measurement => ({
  type: 'DE_CHOOSE_MEASUREMENT',
  payload: {
    measurement,
  },
})

export const editRawText = rawText => ({
  type: 'DE_EDIT_RAW_TEXT',
  payload: {
    rawText,
  },
})

export const setTimeRange = bounds => ({
  type: 'DE_SET_TIME_RANGE',
  payload: {
    bounds,
  },
})

export const groupByTag = tagKey => ({
  type: 'DE_GROUP_BY_TAG',
  payload: {
    tagKey,
  },
})

export const toggleTagAcceptance = () => ({
  type: 'DE_TOGGLE_TAG_ACCEPTANCE',
})

export const updateRawQuery = text => ({
  type: 'DE_UPDATE_RAW_QUERY',
  payload: {
    text,
  },
})

export const updateQueryConfig = config => ({
  type: 'DE_UPDATE_QUERY_CONFIG',
  payload: {
    config,
  },
})

export const editQueryStatus = status => ({
  type: 'DE_EDIT_QUERY_STATUS',
  payload: {
    status,
  },
})

// Async actions
export const editRawTextAsync = (url, id, text) => async dispatch => {
  try {
    const {data} = await getQueryConfig(url, [{query: text, id}])
    const config = data.queries.find(q => q.id === id)
    config.queryConfig.rawText = text
    dispatch(updateQueryConfig(config.queryConfig))
  } catch (error) {
    dispatch(errorThrown(error))
  }
}
