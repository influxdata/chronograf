import AJAX from 'src/utils/ajax'
import {cloneDeep, get} from 'lodash'
import {AlertRule, Kapacitor} from 'src/types'

function outRule(rule: AlertRule): AlertRule {
  // fit into range
  const {value, rangeValue, operator} = rule.values

  if (operator === 'inside range' || operator === 'outside range') {
    rule.values.value = Math.min(Number(value), Number(rangeValue)).toString()
    rule.values.rangeValue = Math.max(
      Number(value),
      Number(rangeValue)
    ).toString()
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

export async function createRule(
  kapacitor: Kapacitor,
  rule: AlertRule
): Promise<void> {
  await AJAX({
    method: 'POST',
    url: kapacitor.links.rules,
    data: outRule(rule),
  })
}

function addUnderscoreType(alertArray: any[]): void {
  // rename 'type' to '_type' property, because `type` conflicts with existing UI property
  if (Array.isArray(alertArray)) {
    alertArray.forEach(x => {
      if (x.type !== undefined) {
        x._type = x.type
      }
    })
  }
}

export async function getRules(
  kapacitor: Kapacitor,
  opts?: {params?: Record<string, string>; signal?: AbortSignal}
): Promise<{data: {rules: AlertRule[]}}> {
  const response = await AJAX({
    method: 'GET',
    url: kapacitor.links.rules,
    ...opts,
  })
  const rules = get(response, ['data', 'rules'])
  if (Array.isArray(rules)) {
    rules.forEach(rule => {
      addUnderscoreType(rule.alertNodes.serviceNow)
      addUnderscoreType(rule.alertNodes.zenoss)
    })
  }
  return response
}

export async function getRule(
  kapacitor: Kapacitor,
  ruleID: string
): Promise<{data: AlertRule}> {
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

export async function editRule(rule: AlertRule): Promise<void> {
  await AJAX({
    method: 'PUT',
    url: rule.links.self,
    data: outRule(rule),
  })
}

export async function deleteRule(rule: AlertRule): Promise<void> {
  await AJAX({
    method: 'DELETE',
    url: rule.links.self,
  })
}

export async function updateRuleStatus(
  rule: AlertRule,
  status: string
): Promise<void> {
  await AJAX({
    method: 'PATCH',
    url: rule.links.self,
    data: {status},
  })
}

const kapacitorLogHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

export const getLogStreamByRuleID = (kapacitor, ruleID, signal) => {
  const url = `${kapacitor.links.proxy}?path=/kapacitor/v1preview/logs?task=${ruleID}`
  const basepath = window.basepath || ''

  return fetch(`${basepath}${url}`, {
    method: 'GET',
    headers: kapacitorLogHeaders,
    credentials: 'include',
    signal,
  })
}

export async function pingKapacitorVersion(
  kapacitor: Kapacitor
): Promise<string | null> {
  try {
    const result = await AJAX({
      method: 'GET',
      url: `${kapacitor.links.proxy}?path=/kapacitor/v1preview/ping`,
      headers: kapacitorLogHeaders,
    })
    const kapVersion = result.headers['x-kapacitor-version']
    return kapVersion === '' ? null : kapVersion
  } catch (error) {
    console.error(error)
    throw error
  }
}
