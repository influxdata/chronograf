import uuid from 'uuid'
import {getActiveKapacitor} from 'shared/apis'
import {notify} from 'shared/actions/notifications'
import {
  getRules,
  getRule as getRuleAJAX,
  deleteRule as deleteRuleAPI,
  updateRuleStatus as updateRuleStatusAPI,
  createTask as createTaskAJAX,
  updateTask as updateTaskAJAX,
} from 'src/kapacitor/apis'
import {
  updateFluxTaskStatus as updateFluxTaskStatusAPI,
  deleteFluxTask as deleteFluxTaskAPI,
} from 'src/kapacitor/apis/fluxTasks'

import {errorThrown} from 'shared/actions/errors'

import {
  notifyAlertRuleDeleted,
  notifyAlertRuleDeleteFailed,
  notifyAlertRuleStatusUpdated,
  notifyAlertRuleStatusUpdateFailed,
  notifyFluxTaskStatusUpdated,
  notifyFluxTaskStatusUpdateFailed,
  notifyTickScriptCreated,
  notifyTickscriptCreationFailed,
  notifyTickscriptUpdated,
  notifyTickscriptUpdateFailed,
} from 'shared/copy/notifications'

const loadQuery = query => ({
  type: 'KAPA_LOAD_QUERY',
  payload: {
    query,
  },
})

export function fetchRule(source, ruleID) {
  return dispatch => {
    getActiveKapacitor(source).then(kapacitor => {
      getRuleAJAX(kapacitor, ruleID).then(({data: rule}) => {
        if (rule.query) {
          rule = Object.assign(rule, {queryID: rule.query.id})
        }
        dispatch({
          type: 'LOAD_RULE',
          payload: {
            rule,
          },
        })
        if (rule.query) {
          dispatch(loadQuery(rule.query))
        }
      })
    })
  }
}

const addQuery = queryID => ({
  type: 'KAPA_ADD_QUERY',
  payload: {
    queryID,
  },
})

export const getRule = (kapacitor, ruleID) => async dispatch => {
  try {
    const {data: rule} = await getRuleAJAX(kapacitor, ruleID)

    dispatch({
      type: 'LOAD_RULE',
      payload: {
        rule: {...rule, queryID: rule.query && rule.query.id},
      },
    })

    if (rule.query) {
      dispatch({
        type: 'LOAD_KAPACITOR_QUERY',
        payload: {
          query: rule.query,
        },
      })
    }
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const loadDefaultRule = () => {
  return dispatch => {
    const queryID = uuid.v4()
    dispatch({
      type: 'LOAD_DEFAULT_RULE',
      payload: {
        queryID,
      },
    })
    dispatch(addQuery(queryID))
  }
}

export const fetchRules = kapacitor => async dispatch => {
  try {
    const {
      data: {rules},
    } = await getRules(kapacitor)
    dispatch({type: 'LOAD_RULES', payload: {rules}})
  } catch (error) {
    dispatch(errorThrown(error))
  }
}

export const chooseTrigger = (ruleID, trigger) => ({
  type: 'CHOOSE_TRIGGER',
  payload: {
    ruleID,
    trigger,
  },
})

export const addEvery = (ruleID, frequency) => ({
  type: 'ADD_EVERY',
  payload: {
    ruleID,
    frequency,
  },
})

export const removeEvery = ruleID => ({
  type: 'REMOVE_EVERY',
  payload: {
    ruleID,
  },
})

export const updateRuleValues = (ruleID, trigger, values) => ({
  type: 'UPDATE_RULE_VALUES',
  payload: {
    ruleID,
    trigger,
    values,
  },
})

export const updateNoRecoveries = (ruleID, noRecoveries) => ({
  type: 'UPDATE_RULE_NORECOVERIES',
  payload: {
    ruleID,
    noRecoveries,
  },
})

export const updateStateChangesOnly = (ruleID, stateChangesOnly) => ({
  type: 'UPDATE_RULE_STATECHANGESONLY',
  payload: {
    ruleID,
    stateChangesOnly,
  },
})

export const updateMessage = (ruleID, message) => ({
  type: 'UPDATE_RULE_MESSAGE',
  payload: {
    ruleID,
    message,
  },
})

export const updateDetails = (ruleID, details) => ({
  type: 'UPDATE_RULE_DETAILS',
  payload: {
    ruleID,
    details,
  },
})

export function updateAlertNodes(ruleID, alerts) {
  return {
    type: 'UPDATE_RULE_ALERT_NODES',
    payload: {ruleID, alerts},
  }
}

export const updateRuleName = (ruleID, name) => ({
  type: 'UPDATE_RULE_NAME',
  payload: {
    ruleID,
    name,
  },
})

export const deleteRuleSuccess = ruleID => ({
  type: 'DELETE_RULE_SUCCESS',
  payload: {
    ruleID,
  },
})

export const deleteFluxTaskSuccess = taskId => ({
  type: 'DELETE_FLUX_TASK_SUCCESS',
  payload: {
    taskId,
  },
})

export const updateRuleStatusSuccess = (ruleID, status) => ({
  type: 'UPDATE_RULE_STATUS_SUCCESS',
  payload: {
    ruleID,
    status,
  },
})

export const updateFluxTaskStatusSuccess = (task, status) => ({
  type: 'UPDATE_FLUX_TASK_STATUS_SUCCESS',
  payload: {
    task,
    status,
  },
})

export const deleteRule = rule => dispatch => {
  deleteRuleAPI(rule)
    .then(() => {
      dispatch(deleteRuleSuccess(rule.id))
      dispatch(notify(notifyAlertRuleDeleted(rule.name)))
    })
    .catch(() => {
      dispatch(notify(notifyAlertRuleDeleteFailed(rule.name)))
    })
}
export const deleteFluxTask = (kapacitor, task) => dispatch => {
  deleteFluxTaskAPI(kapacitor, task)
    .then(() => {
      dispatch(deleteFluxTaskSuccess(task.id))
      dispatch(notify(notifyAlertRuleDeleted(task.name)))
    })
    .catch(() => {
      dispatch(notify(notifyAlertRuleDeleteFailed(task.name)))
    })
}

export const updateRuleStatus = (rule, status) => dispatch => {
  updateRuleStatusAPI(rule, status)
    .then(() => {
      dispatch(notify(notifyAlertRuleStatusUpdated(rule.name, status)))
    })
    .catch(() => {
      dispatch(notify(notifyAlertRuleStatusUpdateFailed(rule.name, status)))
    })
}

export const updateFluxTaskStatus = (
  kapacitor,
  task,
  status,
  notifySuccess = true
) => dispatch => {
  return updateFluxTaskStatusAPI(kapacitor, task, status)
    .then(() => {
      dispatch(updateFluxTaskStatusSuccess(task, status))
      if (notifySuccess) {
        dispatch(notify(notifyFluxTaskStatusUpdated(task.name, status)))
      }
      return true
    })
    .catch(() => {
      dispatch(notify(notifyFluxTaskStatusUpdateFailed(task.name, status)))
      return false
    })
}

export const createTask = (kapacitor, task) => async dispatch => {
  try {
    const {data} = await createTaskAJAX(kapacitor, task)
    dispatch(notify(notifyTickScriptCreated()))
    return data
  } catch (error) {
    if (!error) {
      dispatch(errorThrown(notifyTickscriptCreationFailed()))
      return
    }

    return error.data
  }
}

export const updateTask = (
  kapacitor,
  task,
  ruleID,
  sourceID
) => async dispatch => {
  try {
    const {data} = await updateTaskAJAX(kapacitor, task, ruleID, sourceID)
    dispatch(notify(notifyTickscriptUpdated()))
    return data
  } catch (error) {
    if (!error) {
      dispatch(errorThrown(notifyTickscriptUpdateFailed()))
      return
    }
    return error.data
  }
}
