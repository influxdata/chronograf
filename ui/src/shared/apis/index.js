import AJAX from 'utils/ajax'

export function fetchLayouts() {
  return AJAX({
    url: `/chronograf/v1/layouts`,
    method: 'GET',
    resource: 'layouts',
  })
}

export function getMe() {
  return AJAX({
    resource: 'me',
    method: 'GET',
  })
}

export function getSources() {
  return AJAX({
    resource: 'sources',
  })
}

export function getSource(id) {
  return AJAX({
    resource: 'sources',
    id,
  })
}

export function createSource(attributes) {
  return AJAX({
    resource: 'sources',
    method: 'POST',
    data: attributes,
  })
}

export function updateSource(newSource) {
  return AJAX({
    url: newSource.links.self,
    method: 'PATCH',
    data: newSource,
  })
}

export function deleteSource(source) {
  return AJAX({
    url: source.links.self,
    method: 'DELETE',
  })
}

export function pingKapacitor(kapacitor) {
  return AJAX({
    method: 'GET',
    url: `${kapacitor.links.proxy}?path=/kapacitor/v1/ping`,
  })
}

export function getKapacitor(source) {
  return AJAX({
    url: source.links.kapacitors,
    method: 'GET',
  }).then(({data}) => {
    return data.kapacitors[0]
  })
}

export function createKapacitor(source, {url, name = 'My Kapacitor', username, password}) {
  return AJAX({
    url: source.links.kapacitors,
    method: 'POST',
    data: {
      name,
      url,
      username,
      password,
    },
  })
}

export function updateKapacitor({links, url, name = 'My Kapacitor', username, password}) {
  return AJAX({
    url: links.self,
    method: 'PATCH',
    data: {
      name,
      url,
      username,
      password,
    },
  })
}

export function getKapacitorConfig(kapacitor) {
  return kapacitorProxy(kapacitor, 'GET', '/kapacitor/v1/config', '')
}

export function getKapacitorConfigSection(kapacitor, section) {
  return kapacitorProxy(kapacitor, 'GET', `/kapacitor/v1/config/${section}`, '')
}

export function updateKapacitorConfigSection(kapacitor, section, properties) {
  return AJAX({
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
}

export function testAlertOutput(kapacitor, outputName, properties) {
  return kapacitorProxy(kapacitor, 'GET', '/kapacitor/v1/service-tests').then(({data: {services}}) => {
    const service = services.find(s => s.name === outputName)
    return kapacitorProxy(kapacitor, 'POST', service.link.href, Object.assign({}, service.options, properties))
  })
}

export function createKapacitorTask(kapacitor, id, type, dbrps, script) {
  return kapacitorProxy(kapacitor, 'POST', '/kapacitor/v1/tasks', {
    id,
    type,
    dbrps,
    script,
    status: 'enabled',
  })
}

export function enableKapacitorTask(kapacitor, id) {
  return kapacitorProxy(kapacitor, 'PATCH', `/kapacitor/v1/tasks/${id}`, {status: 'enabled'})
}

export function disableKapacitorTask(kapacitor, id) {
  return kapacitorProxy(kapacitor, 'PATCH', `/kapacitor/v1/tasks/${id}`, {status: 'disabled'})
}

export function deleteKapacitorTask(kapacitor, id) {
  return kapacitorProxy(kapacitor, 'DELETE', `/kapacitor/v1/tasks/${id}`, '')
}

export function kapacitorProxy(kapacitor, method, path, body) {
  return AJAX({
    method,
    url: kapacitor.links.proxy,
    params: {
      path,
    },
    data: body,
  })
}
