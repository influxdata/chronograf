import AJAX from 'src/utils/ajax'
import {AlertTypes} from 'src/kapacitor/constants'
import {Kapacitor, Source, Service, NewService, QueryConfig} from 'src/types'
import {SpecificConfigOptions} from 'src/types/kapacitor'

export const getSources = () => {
  return AJAX({
    url: null,
    resource: 'sources',
  })
}

export const getSource = async (id: string): Promise<Source> => {
  const {data: source} = await AJAX({
    url: null,
    resource: 'sources',
    id,
  })

  return source
}

export const createSource = async (
  attributes: Partial<Source>,
  params: Record<string, string> = {}
): Promise<Source> => {
  const {data: source} = await AJAX({
    url: null,
    resource: 'sources',
    method: 'POST',
    data: attributes,
    params,
  })

  return source
}

export const updateSource = async (
  newSource: Partial<Source>,
  params: Record<string, string> = {}
): Promise<Source> => {
  const {data: source} = await AJAX({
    url: newSource.links.self,
    method: 'PATCH',
    data: newSource,
    params,
  })

  return source
}

export const deleteSource = (source: Source) => {
  return AJAX({
    url: source.links.self,
    method: 'DELETE',
  })
}

export const pingKapacitor = async (kapacitor: Kapacitor): Promise<void> => {
  try {
    const data = await AJAX({
      method: 'GET',
      url: kapacitor.links.ping,
    })
    return data
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getKapacitor = async (
  source: Source,
  kapacitorID
): Promise<Kapacitor> => {
  try {
    const {data} = await AJAX({
      url: `${source.links.kapacitors}/${kapacitorID}`,
      method: 'GET',
    })

    return data
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getActiveKapacitor = async (
  source: Source
): Promise<Kapacitor> => {
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

export const getKapacitors = async (source: Source): Promise<Kapacitor[]> => {
  try {
    const {
      data: {kapacitors},
    } = await AJAX({
      method: 'GET',
      url: source.links.kapacitors,
    })

    return kapacitors
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const deleteKapacitor = async (kapacitor: Kapacitor): Promise<void> => {
  try {
    await AJAX({
      method: 'DELETE',
      url: kapacitor.links.self,
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const createKapacitor = (source: Source, kapacitor: Kapacitor) => {
  const {
    url,
    name = 'New Kapacitor',
    username,
    password,
    insecureSkipVerify,
  } = kapacitor
  return AJAX({
    url: source.links.kapacitors,
    method: 'POST',
    data: {
      name,
      url,
      username,
      password,
      insecureSkipVerify,
    },
  })
}

export const updateKapacitor = ({
  links,
  url,
  name = 'New Kapacitor',
  username,
  password,
  active,
  insecureSkipVerify,
}: Kapacitor) => {
  return AJAX({
    url: links.self,
    method: 'PATCH',
    data: {
      name,
      url,
      username,
      password,
      active,
      insecureSkipVerify,
    },
  })
}

export const getKapacitorConfig = async (kapacitor: Kapacitor) => {
  try {
    return await kapacitorProxy(kapacitor, 'GET', '/kapacitor/v1/config', '')
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getKapacitorConfigSection = (
  kapacitor: Kapacitor,
  section: string
) => {
  return kapacitorProxy(kapacitor, 'GET', `/kapacitor/v1/config/${section}`, '')
}

export const updateKapacitorConfigSection = (
  kapacitor: Kapacitor,
  section: string,
  properties,
  specificConfig: string
) => {
  const config = specificConfig || ''
  const path = `/kapacitor/v1/config/${section}/${config}`

  const params = {
    method: 'POST' as const,
    url: kapacitor.links.proxy,
    params: {
      path,
    },
    data: {
      set: properties,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  }

  return AJAX(params)
}

export const addKapacitorConfigInSection = (
  kapacitor: Kapacitor,
  section: string,
  properties
) => {
  return AJAX({
    method: 'POST',
    url: kapacitor.links.proxy,
    params: {
      path: `/kapacitor/v1/config/${section}/`,
    },
    data: {
      add: properties,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export const deleteKapacitorConfigInSection = (
  kapacitor: Kapacitor,
  section: string,
  specificConfig: string
) => {
  const path = `/kapacitor/v1/config/${section}`

  return AJAX({
    method: 'POST',
    url: kapacitor.links.proxy,
    params: {
      path,
    },
    data: {
      remove: [specificConfig],
    },
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export const testAlertOutput = async (
  kapacitor: Kapacitor,
  outputName: string,
  options: SpecificConfigOptions,
  specificConfigOptions: SpecificConfigOptions
) => {
  try {
    const {
      data: {services},
    } = await kapacitorProxy(kapacitor, 'GET', '/kapacitor/v1/service-tests')
    const service = services.find(s => s.name === outputName)

    let body = {}
    if (options) {
      body = options
    } else if (outputName === AlertTypes.slack) {
      body = specificConfigOptions
    }

    return kapacitorProxy(kapacitor, 'POST', service.link.href, body)
  } catch (error) {
    console.error(error)
  }
}

export const getAllServices = async (
  kapacitor: Kapacitor
): Promise<Service[]> => {
  try {
    const {
      data: {services},
    } = await kapacitorProxy(kapacitor, 'GET', '/kapacitor/v1/service-tests')
    return services
  } catch (error) {
    console.error(error)
  }
}

export const createKapacitorTask = (
  kapacitor: Kapacitor,
  id,
  type,
  dbrps,
  script
) => {
  return kapacitorProxy(kapacitor, 'POST', '/kapacitor/v1/tasks', {
    id,
    type,
    dbrps,
    script,
    status: 'enabled',
  })
}

export const enableKapacitorTask = (kapacitor: Kapacitor, id) => {
  return kapacitorProxy(kapacitor, 'PATCH', `/kapacitor/v1/tasks/${id}`, {
    status: 'enabled',
  })
}

export const disableKapacitorTask = (kapacitor: Kapacitor, id) => {
  return kapacitorProxy(kapacitor, 'PATCH', `/kapacitor/v1/tasks/${id}`, {
    status: 'disabled',
  })
}

export const deleteKapacitorTask = (kapacitor: Kapacitor, id) => {
  return kapacitorProxy(kapacitor, 'DELETE', `/kapacitor/v1/tasks/${id}`, '')
}

export const kapacitorProxy = (
  kapacitor: Kapacitor,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  path,
  body?
) => {
  return AJAX({
    method,
    url: kapacitor.links.proxy,
    params: {
      path,
    },
    data: body,
  })
}

export const getQueryConfigAndStatus = async (
  url,
  queries
): Promise<AnalyzeQueriesObject[]> => {
  try {
    const {data} = await AJAX({
      url,
      method: 'POST',
      data: {queries},
    })

    return data.queries
  } catch (error) {
    console.error(error)
    throw error
  }
}

interface AnalyzeQueriesObject {
  id: string
  query: string
  duration: string
  queryConfig?: QueryConfig
}

export const analyzeQueries = async (
  url: string,
  queries: Array<{query: string}>
): Promise<AnalyzeQueriesObject[]> => {
  try {
    const {data} = await AJAX({
      url,
      method: 'POST',
      data: {queries},
    })

    return data.queries
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getServices = async (url: string): Promise<Service[]> => {
  try {
    const {data} = await AJAX({
      url,
      method: 'GET',
    })

    return data.services
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getService = async (
  url: string,
  serviceID: string
): Promise<Service> => {
  try {
    const {data} = await AJAX({
      url: `${url}/${serviceID}`,
      method: 'GET',
    })

    return data
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const createService = async (
  source: Source,
  {
    url,
    name = 'My FluxD',
    type,
    username,
    password,
    insecureSkipVerify,
    metadata,
  }: NewService
): Promise<Service> => {
  try {
    const {data} = await AJAX({
      url: source.links.services,
      method: 'POST',
      data: {url, name, type, username, password, insecureSkipVerify, metadata},
    })

    return data
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const updateService = async (service: Service): Promise<Service> => {
  try {
    const {data} = await AJAX({
      url: service.links.self,
      method: 'PATCH',
      data: service,
    })

    return data
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const deleteService = async (service: Service): Promise<void> => {
  try {
    await AJAX({
      url: service.links.self,
      method: 'DELETE',
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}
