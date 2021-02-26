import AJAX from 'utils/ajax'
import {cloneDeep, get} from 'lodash'

const outRule = rule => {
  // fit into range
  const {value, rangeValue, operator} = rule.values

  if (operator === 'inside range' || operator === 'outside range') {
    rule.values.value = Math.min(value, rangeValue).toString()
    rule.values.rangeValue = Math.max(value, rangeValue).toString()
  }
  // remap serviceNow '_type' to 'type' that could not be used
  if (Array.isArray(get(rule, ['alertNodes', 'serviceNow']))) {
    rule = cloneDeep(rule)
    rule.alertNodes.serviceNow = rule.alertNodes.serviceNow.map(
      val => ({...val, type: val._type, _type: undefined})
    )
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

export const getRules = kapacitor => {
  return AJAX({
    method: 'GET',
    url: kapacitor.links.rules,
  }).then(response => {
    // remap serviceNow 'type' to '_type', it conflicts with UI property
    const rules = get(response, ['data', 'rules'])
    if (Array.isArray(rules)) {
      rules.forEach(rule => {
        if (Array.isArray(rule.alertNodes.serviceNow)) {
          rule.alertNodes.serviceNow = rule.alertNodes.serviceNow.map(
            val => ({...val, _type: val.type, type: undefined})
          )
        }
      })
    }
    return response
  })
}

export const getRule = async (kapacitor, ruleID) => {
  try {
    const response = await AJAX({
      method: 'GET',
      url: `${kapacitor.links.rules}/${ruleID}`,
    })
    // remap serviceNow 'type' to '_type', it conflicts with UI property
    const serviceNow = get(response, ['data', 'alertNodes', 'serviceNow'])
    if (Array.isArray(serviceNow)) {
      serviceNow.forEach(x => {
        if (x.type !== undefined) {
          x._type = x.type
        }
      })
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

export const getLogStream = kapacitor => {
  // axios doesn't support the chunked transfer encoding response kapacitor uses for logs
  // AJAX adds basepath, but we need to supply it directly to fetch
  const url = `${kapacitor.links.proxy}?path=/kapacitor/v1preview/logs`
  const basepath = window.basepath || ''

  return fetch(`${basepath}${url}`, {
    method: 'GET',
    headers: kapacitorLogHeaders,
    credentials: 'include',
  })
}

export const getLogStreamByRuleID = (kapacitor, ruleID) => {
  // axios doesn't support the chunked transfer encoding response kapacitor uses for logs
  // AJAX adds basepath, but we need to supply it directly to fetch
  const url = `${kapacitor.links.proxy}?path=/kapacitor/v1preview/logs?task=${ruleID}`
  const basepath = window.basepath || ''

  return fetch(`${basepath}${url}`, {
    method: 'GET',
    headers: kapacitorLogHeaders,
    credentials: 'include',
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
