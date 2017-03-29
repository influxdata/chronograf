import uuid from 'node-uuid'
import {getKapacitor} from 'src/shared/apis'
import {publishNotification} from 'src/shared/actions/notifications'
import {
  getRules,
  getRule,
  deleteRule as deleteRuleAPI,
  updateRuleStatus as updateRuleStatusAPI,
} from 'src/kapacitor/apis'

export function fetchRule(source, ruleID) {
  return (dispatch) => {
    getKapacitor(source).then((kapacitor) => {
      getRule(kapacitor, ruleID).then(({data: rule}) => {
        dispatch({
          type: 'LOAD_RULE',
          payload: {
            rule: Object.assign(rule, {queryID: rule.query.id}),
          },
        })

        dispatch({
          type: 'LOAD_KAPACITOR_QUERY',
          payload: {
            query: rule.query,
          },
        })
      })
    })
  }
}

export function loadDefaultRule() {
  return (dispatch) => {
    const queryID = uuid.v4()
    dispatch({
      type: 'LOAD_DEFAULT_RULE',
      payload: {
        queryID,
      },
    })
    dispatch({
      type: 'ADD_KAPACITOR_QUERY',
      payload: {
        queryID,
      },
    })
  }
}

export function fetchRules(kapacitor) {
  return (dispatch) => {
    getRules(kapacitor).then(({data: {rules}}) => {
      dispatch({
        type: 'LOAD_RULES',
        payload: {
          rules,
        },
      })
    })
  }
}

export function chooseTrigger(ruleID, trigger) {
  return {
    type: 'CHOOSE_TRIGGER',
    payload: {
      ruleID,
      trigger,
    },
  }
}

export function updateRuleValues(ruleID, trigger, values) {
  return {
    type: 'UPDATE_RULE_VALUES',
    payload: {
      ruleID,
      trigger,
      values,
    },
  }
}

export function updateMessage(ruleID, message) {
  return {
    type: 'UPDATE_RULE_MESSAGE',
    payload: {
      ruleID,
      message,
    },
  }
}

export function updateDetails(ruleID, details) {
  return {
    type: 'UPDATE_RULE_DETAILS',
    payload: {
      ruleID,
      details,
    },
  }
}

export function updateAlerts(ruleID, alerts) {
  return {
    type: 'UPDATE_RULE_ALERTS',
    payload: {
      ruleID,
      alerts,
    },
  }
}

export function updateAlertNodes(ruleID, alertType, alertNodesText) {
  return {
    type: 'UPDATE_RULE_ALERT_NODES',
    payload: {
      ruleID,
      alertType,
      alertNodesText,
    },
  }
}

export function updateRuleName(ruleID, name) {
  return {
    type: 'UPDATE_RULE_NAME',
    payload: {
      ruleID,
      name,
    },
  }
}

export function deleteRuleSuccess(ruleID) {
  return {
    type: 'DELETE_RULE_SUCCESS',
    payload: {
      ruleID,
    },
  }
}

export function updateRuleStatusSuccess(ruleID, status) {
  return {
    type: 'UPDATE_RULE_STATUS_SUCCESS',
    payload: {
      ruleID,
      status,
    },
  }
}

export function deleteRule(rule) {
  return (dispatch) => {
    deleteRuleAPI(rule).then(() => {
      dispatch(deleteRuleSuccess(rule.id))
      dispatch(publishNotification('success', `${rule.name} deleted successfully`))
    }).catch(() => {
      dispatch(publishNotification('error', `${rule.name} could not be deleted`))
    })
  }
}

export function updateRuleStatus(rule, status) {
  return (dispatch) => {
    updateRuleStatusAPI(rule, status).then(() => {
      dispatch(publishNotification('success', `${rule.name} ${status} successfully`))
    }).catch(() => {
      dispatch(publishNotification('error', `${rule.name} could not be ${status}`))
    })
  }
}
