import AJAX from 'utils/ajax'
import _, {cloneDeep, get, values} from 'lodash'

const outRule = rule => {
  // fit into range
  const {value, rangeValue, operator} = rule.values

  if (operator === 'inside range' || operator === 'outside range') {
    rule.values.value = Math.min(value, rangeValue).toString()
    rule.values.rangeValue = Math.max(value, rangeValue).toString()
  }
  // remap serviceNow from '_type' back to 'type', see getRule/getRules
  if (Array.isArray(get(rule, ['alertNodes', 'serviceNow']))) {
    rule = cloneDeep(rule)
    rule.alertNodes.serviceNow = rule.alertNodes.serviceNow.map(val => ({
      ...val,
      type: val._type,
      _type: undefined,
    }))
  }
  // remap zenoss from '_type' back to 'type', see getRule/getRules
  if (Array.isArray(get(rule, ['alertNodes', 'zenoss']))) {
    rule = cloneDeep(rule)
    rule.alertNodes.zenoss = rule.alertNodes.zenoss.map(val => ({
      ...val,
      type: val._type,
      _type: undefined,
    }))
  }

  return rule
}

export const createRule = (kapacitor, rule) => {
  return AJAX({
    method: 'POST',
    url: kapacitor.links.rules,
    data: outRule(rule),
  })
}

function addUnderscoreType(alertArray) {
  // rename 'type' to '_type' property, because `type` conflicts with existing UI property
  if (Array.isArray(alertArray)) {
    alertArray.forEach(x => {
      if (x.type !== undefined) {
        x._type = x.type
      }
    })
  }
}

export const getRules = kapacitor => {
  return AJAX({
    method: 'GET',
    url: kapacitor.links.rules,
  }).then(response => {
    const rules = get(response, ['data', 'rules'])
    if (Array.isArray(rules)) {
      rules.forEach(rule => {
        addUnderscoreType(rule.alertNodes.serviceNow)
        addUnderscoreType(rule.alertNodes.zenoss)
      })
    }
    return response
  })
}

export const getFluxTasks = async kapacitor => {
  const taskIds = {}
  let lastID = ''
  for (;;) {
    const {
      data: {tasks},
    } = await AJAX({
      method: 'GET',
      url:
        kapacitor.links.proxy +
        `?path=/kapacitor/v1/api/v2/tasks?limit=500&after=${lastID}`,
    })
    if (!tasks || !tasks.length) {
      break
    }
    lastID = tasks[tasks.length - 1].id
    let noNewData = true
    tasks.forEach(x => {
      if (taskIds[x.id]) {
        return
      }
      noNewData = false
      taskIds[x.id] = x
    })
    if (noNewData) {
      break
    }
  }
  return values(taskIds).sort((a, b) => a.name.localeCompare(b.name))
}

export const getFluxTask = async (kapacitor, taskID) => {
  const {data} = await AJAX({
    method: 'GET',
    url: kapacitor.links.proxy + `?path=/kapacitor/v1/api/v2/tasks/${taskID}`,
  })
  return data
}

export const getFluxTaskLogs = async (kapacitor, taskID, maxItems) => {
  const {data} = await AJAX({
    method: 'GET',
    url:
      kapacitor.links.proxy + `?path=/kapacitor/v1/api/v2/tasks/${taskID}/logs`,
  })
  const logs = _.get(data, ['events'], [])
  logs.sort((a, b) => b.time.localeCompare(a.time))
  return logs.slice(0, maxItems).map(x => ({
    id: `${x.runID}-${x.time}`,
    key: `${x.runID}-${x.time}`,
    service: 'flux_task',
    lvl: 'info',
    ts: x.time,
    msg: x.message,
    tags: x.runID,
  }))
}

export const getRule = async (kapacitor, ruleID) => {
  try {
    const response = await AJAX({
      method: 'GET',
      url: `${kapacitor.links.rules}/${ruleID}`,
    })
    const alertNodes = get(response, ['data', 'alertNodes'])
    if (alertNodes) {
      addUnderscoreType(alertNodes.serviceNow)
      addUnderscoreType(alertNodes.zenoss)
    }
    return response
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const editRule = rule => {
  return AJAX({
    method: 'PUT',
    url: rule.links.self,
    data: outRule(rule),
  })
}

export const deleteRule = rule => {
  return AJAX({
    method: 'DELETE',
    url: rule.links.self,
  })
}

export const updateRuleStatus = (rule, status) => {
  return AJAX({
    method: 'PATCH',
    url: rule.links.self,
    data: {status},
  })
}

export const updateFluxTaskStatus = (kapacitor, task, status) => {
  return AJAX({
    method: 'PATCH',
    url: kapacitor.links.proxy + '?path=' + task.links.self,
    data: {status},
  })
}

export const deleteFluxTask = (kapacitor, task) => {
  return AJAX({
    method: 'DELETE',
    url: kapacitor.links.proxy + '?path=' + task.links.self,
  })
}

export const createTask = async (kapacitor, {id, dbrps, tickscript, type}) => {
  try {
    return await AJAX({
      method: 'POST',
      url: kapacitor.links.rules,
      data: {
        id,
        type,
        dbrps,
        tickscript,
      },
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const updateTask = async (
  kapacitor,
  {id, dbrps, tickscript, type},
  ruleID
) => {
  try {
    return await AJAX({
      method: 'PUT',
      url: `${kapacitor.links.rules}/${ruleID}`,
      data: {
        id,
        type,
        dbrps,
        tickscript,
      },
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

const kapacitorLogHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

export const getLogStreamByRuleID = (kapacitor, ruleID, signal) => {
  // axios doesn't support the chunked transfer encoding response kapacitor uses for logs
  // AJAX adds basepath, but we need to supply it directly to fetch
  const url = `${kapacitor.links.proxy}?path=/kapacitor/v1preview/logs?task=${ruleID}`
  const basepath = window.basepath || ''

  return fetch(`${basepath}${url}`, {
    method: 'GET',
    headers: kapacitorLogHeaders,
    credentials: 'include',
    signal,
  })
}

export const pingKapacitorVersion = async kapacitor => {
  try {
    const result = await AJAX({
      method: 'GET',
      url: `${kapacitor.links.proxy}?path=/kapacitor/v1preview/ping`,
      headers: kapacitorLogHeaders,
      credentials: 'include',
    })
    const kapVersion = result.headers['x-kapacitor-version']
    return kapVersion === '' ? null : kapVersion
  } catch (error) {
    console.error(error)
    throw error
  }
}
