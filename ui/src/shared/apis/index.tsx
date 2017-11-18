import AJAX from 'utils/ajax'

import {Query, Source, Template} from 'src/types'

export const fetchLayouts = () =>
  AJAX({
    url: '/chronograf/v1/layouts',
    method: 'GET',
    resource: 'layouts',
  })

export const getMe = () =>
  AJAX({
    resource: 'me',
    method: 'GET',
  })

export const getSources = () =>
  AJAX({
    resource: 'sources',
  })

export const getSource = (id: string) =>
  AJAX({
    resource: 'sources',
    id,
  })

export const createSource = attributes =>
  AJAX({
    resource: 'sources',
    method: 'POST',
    data: attributes,
  })

export const updateSource = (newSource: Source) =>
  AJAX({
    url: newSource.links.self,
    method: 'PATCH',
    data: newSource,
  })

export const deleteSource = (source: Source) =>
  AJAX({
    url: source.links.self,
    method: 'DELETE',
  })

export const pingKapacitor = kapacitor =>
  AJAX({
    method: 'GET',
    url: kapacitor.links.ping,
  })

export const getKapacitor = (source: Source, kapacitorID: string) =>
  AJAX({
    url: `${source.links.kapacitors}/${kapacitorID}`,
    method: 'GET',
  }).then(({data}) => {
    return data
  })

export const getActiveKapacitor = async source => {
  try {
    const {data} = await AJAX({
      url: source.links.kapacitors,
      method: 'GET',
    })

    const activeKapacitor = data.kapacitors.find(k => k.active)
    return activeKapacitor || data.kapacitors[0]
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getKapacitors = async source => {
  try {
    return await AJAX({
      method: 'GET',
      url: source.links.kapacitors,
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const deleteKapacitor = async kapacitor => {
  try {
    return await AJAX({
      method: 'DELETE',
      url: kapacitor.links.self,
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const createKapacitor = (
  source: Source,
  {url, name = 'My Kapacitor', username, password}
) =>
  AJAX({
    url: source.links.kapacitors,
    method: 'POST',
    data: {
      name,
      url,
      username,
      password,
    },
  })

export const updateKapacitor = ({
  links,
  url,
  name = 'My Kapacitor',
  username,
  password,
  active,
}) =>
  AJAX({
    url: links.self,
    method: 'PATCH',
    data: {
      name,
      url,
      username,
      password,
      active,
    },
  })

export const getKapacitorConfig = async kapacitor => {
  return kapacitorProxy(kapacitor, 'GET', '/kapacitor/v1/config', '')
}

export const getKapacitorConfigSection = (kapacitor, section) => {
  return kapacitorProxy(kapacitor, 'GET', `/kapacitor/v1/config/${section}`, '')
}

export const updateKapacitorConfigSection = (kapacitor, section, properties) =>
  AJAX({
    method: 'POST',
    url: kapacitor.links.proxy,
    params: {
      path: `/kapacitor/v1/config/${section}/`,
    },
    data: {
      set: properties,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  })

export const testAlertOutput = (kapacitor, outputName, properties) =>
  kapacitorProxy(kapacitor, 'GET', '/kapacitor/v1/service-tests').then(
    ({data: {services}}) => {
      const service = services.find(s => s.name === outputName)
      return kapacitorProxy(kapacitor, 'POST', service.link.href, {
        ...service.options,
        ...properties,
      })
    }
  )

export const createKapacitorTask = (kapacitor, id, type, dbrps, script) =>
  kapacitorProxy(kapacitor, 'POST', '/kapacitor/v1/tasks', {
    id,
    type,
    dbrps,
    script,
    status: 'enabled',
  })

export const enableKapacitorTask = (kapacitor, id) =>
  kapacitorProxy(kapacitor, 'PATCH', `/kapacitor/v1/tasks/${id}`, {
    status: 'enabled',
  })

export const disableKapacitorTask = (kapacitor, id) =>
  kapacitorProxy(kapacitor, 'PATCH', `/kapacitor/v1/tasks/${id}`, {
    status: 'disabled',
  })

export const deleteKapacitorTask = (kapacitor, id) =>
  kapacitorProxy(kapacitor, 'DELETE', `/kapacitor/v1/tasks/${id}`, '')

export const kapacitorProxy = (kapacitor, method, path, body?) =>
  AJAX({
    method,
    url: kapacitor.links.proxy,
    params: {
      path,
    },
    data: body,
  })

export const getQueryConfig = (
  url: string,
  queries: Query[],
  tempVars?: Template[]
) =>
  AJAX({
    url,
    method: 'POST',
    data: {queries, tempVars},
  })
