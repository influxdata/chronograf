import * as uuidv4 from 'uuid/v4'
import {History} from 'history'

import {getActiveKapacitor} from 'shared/apis'
import {publishNotification} from 'shared/actions/notifications'
import {
  getRules,
  getRule as getRuleAJAX,
  deleteRule as deleteRuleAPI,
  updateRuleStatus as updateRuleStatusAPI,
  createTask as createTaskAJAX,
  updateTask as updateTaskAJAX,
} from 'kapacitor/apis'
import {errorThrown} from 'shared/actions/errors'

import {Kapacitor, Query, Rule, Source, Task} from 'src/types'

const loadQuery = (query: Query) => ({
  type: 'KAPA_LOAD_QUERY',
  payload: {
    query,
  },
})

export function fetchRule(source: Source, ruleID: string) {
  return dispatch => {
    getActiveKapacitor(source).then(kapacitor => {
      getRuleAJAX(kapacitor, ruleID).then(({data: rule}) => {
        dispatch({
          type: 'LOAD_RULE',
          payload: {
            rule: {...rule, queryID: rule.query.id},
          },
        })
        dispatch(loadQuery(rule.query))
      })
    })
  }
}

const addQuery = (queryID: string) => ({
  type: 'KAPA_ADD_QUERY',
  payload: {
    queryID,
  },
})

export const getRule = (
  kapacitor: Kapacitor,
  ruleID: string
) => async dispatch => {
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

export const loadDefaultRule = () => dispatch => {
  const queryID = uuidv4()
  dispatch({
    type: 'LOAD_DEFAULT_RULE',
    payload: {
      queryID,
    },
  })
  dispatch(addQuery(queryID))
}

export const fetchRules = (kapacitor: Kapacitor) => async dispatch => {
  try {
    const {data: {rules}} = await getRules(kapacitor)
    dispatch({type: 'LOAD_RULES', payload: {rules}})
  } catch (error) {
    dispatch(errorThrown(error))
  }
}

export function chooseTrigger(ruleID: string, trigger: string) {
  return {
    type: 'CHOOSE_TRIGGER',
    payload: {
      ruleID,
      trigger,
    },
  }
}

export const addEvery = (ruleID: string, frequency: string) => ({
  type: 'ADD_EVERY',
  payload: {
    ruleID,
    frequency,
  },
})

export const removeEvery = (ruleID: string) => ({
  type: 'REMOVE_EVERY',
  payload: {
    ruleID,
  },
})

export function updateRuleValues(
  ruleID: string,
  trigger: string,
  values: string[]
) {
  return {
    type: 'UPDATE_RULE_VALUES',
    payload: {
      ruleID,
      trigger,
      values,
    },
  }
}

export function updateMessage(ruleID: string, message: string) {
  return {
    type: 'UPDATE_RULE_MESSAGE',
    payload: {
      ruleID,
      message,
    },
  }
}

export function updateDetails(ruleID: string, details: string) {
  return {
    type: 'UPDATE_RULE_DETAILS',
    payload: {
      ruleID,
      details,
    },
  }
}

export const updateAlertProperty = (
  ruleID: string,
  alertNodeName: string,
  alertProperty: string
) => ({
  type: 'UPDATE_RULE_ALERT_PROPERTY',
  payload: {
    ruleID,
    alertNodeName,
    alertProperty,
  },
})

export function updateAlerts(ruleID: string, alerts: string[]) {
  return {
    type: 'UPDATE_RULE_ALERTS',
    payload: {
      ruleID,
      alerts,
    },
  }
}

export function updateAlertNodes(
  ruleID: string,
  alertNodeName: string,
  alertNodesText: string
) {
  return {
    type: 'UPDATE_RULE_ALERT_NODES',
    payload: {
      ruleID,
      alertNodeName,
      alertNodesText,
    },
  }
}

export function updateRuleName(ruleID: string, name: string) {
  return {
    type: 'UPDATE_RULE_NAME',
    payload: {
      ruleID,
      name,
    },
  }
}

export function deleteRuleSuccess(ruleID: string) {
  return {
    type: 'DELETE_RULE_SUCCESS',
    payload: {
      ruleID,
    },
  }
}

export function updateRuleStatusSuccess(ruleID: string, status: string) {
  return {
    type: 'UPDATE_RULE_STATUS_SUCCESS',
    payload: {
      ruleID,
      status,
    },
  }
}

export function deleteRule(rule: Rule) {
  return dispatch => {
    deleteRuleAPI(rule)
      .then(() => {
        dispatch(deleteRuleSuccess(rule.id))
        dispatch(
          publishNotification({
            type: 'success',
            message: `${rule.name} deleted successfully`,
          })
        )
      })
      .catch(() => {
        dispatch(
          publishNotification({
            type: 'error',
            message: `${rule.name} could not be deleted`,
          })
        )
      })
  }
}

export function updateRuleStatus(rule: Rule, status: string) {
  return dispatch => {
    updateRuleStatusAPI(rule, status)
      .then(() => {
        dispatch(
          publishNotification({
            type: 'success',
            message: `${rule.name} ${status} successfully`,
          })
        )
      })
      .catch(() => {
        dispatch(
          publishNotification({
            type: 'error',
            message: `${rule.name} could not be ${status}`,
          })
        )
      })
  }
}

export const createTask = (
  kapacitor: Kapacitor,
  task: Task,
  history: History,
  sourceID: string
) => async dispatch => {
  try {
    const {data} = await createTaskAJAX(kapacitor, task)
    history.push(`/sources/${sourceID}/alert-rules`)
    dispatch(
      publishNotification({type: 'success', message: 'You made a TICKscript!'})
    )
    return data
  } catch (error) {
    if (!error) {
      dispatch(errorThrown('Could not communicate with server'))
      return
    }

    return error.data
  }
}

export const updateTask = (
  kapacitor: Kapacitor,
  task: Task,
  ruleID: string,
  history: History,
  sourceID: string
) => async dispatch => {
  try {
    const {data} = await updateTaskAJAX(kapacitor, task, ruleID)
    history.push(`/sources/${sourceID}/alert-rules`)
    dispatch(
      publishNotification({
        type: 'success',
        message: 'TICKscript updated successully',
      })
    )
    return data
  } catch (error) {
    if (!error) {
      dispatch(errorThrown('Could not communicate with server'))
      return
    }

    return error.data
  }
}
