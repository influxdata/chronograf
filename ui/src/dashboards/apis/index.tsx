import AJAX from 'utils/ajax'
import {proxy} from 'utils/queryUrlGenerator'

export function getDashboards() {
  return AJAX({
    method: 'GET',
    resource: 'dashboards',
  })
}

export function updateDashboard(dashboard) {
  return AJAX({
    method: 'PUT',
    url: dashboard.links.self,
    data: dashboard,
  })
}

export function updateDashboardCell(cell) {
  return AJAX({
    method: 'PUT',
    url: cell.links.self,
    data: cell,
  })
}

export const createDashboard = async dashboard => {
  try {
    return await AJAX({
      method: 'POST',
      resource: 'dashboards',
      data: dashboard,
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const deleteDashboard = async dashboard => {
  try {
    return await AJAX({
      method: 'DELETE',
      url: dashboard.links.self,
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const addDashboardCell = async (dashboard, cell) => {
  try {
    return await AJAX({
      method: 'POST',
      url: dashboard.links.cells,
      data: cell,
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const deleteDashboardCell = async cell => {
  try {
    return await AJAX({
      method: 'DELETE',
      url: cell.links.self,
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const editTemplateVariables = async templateVariable => {
  try {
    return await AJAX({
      method: 'PUT',
      url: templateVariable.links.self,
      data: templateVariable,
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const runTemplateVariableQuery = async (
  source,
  {
    query,
    db,
    // rp, TODO
    tempVars,
  }
) => {
  try {
    // TODO: add rp as argument to proxy
    return await proxy({source: source.links.proxy, query, db, tempVars})
  } catch (error) {
    console.error(error)
    throw error
  }
}
