import {CancellationError} from 'src/types/promises'

/* eslint-disable @typescript-eslint/ban-types */
let links
export const setAJAXLinks = ({updatedLinks}): void => {
  links = updatedLinks
}

// do not prefix route with basepath, ex. for external links
const addBasepath = (url, excludeBasepath): string => {
  const basepath = window.basepath || ''

  return excludeBasepath ? url : `${basepath}${url}`
}

interface AJAXResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: any
}
interface Links {
  auth: object
  logoutLink: object
  external: object
  users: object
  allUsers: object
  organizations: object
  meLink: object
  config: object
  environment: object
  flux: object
}

interface LinksInputs {
  auth: object
  logout: object
  external: object
  users: object
  allUsers: object
  organizations: object
  me: object
  config: object
  environment: object
  flux: object
}

function generateResponseWithLinks<T extends object>(
  response: T,
  newLinks: LinksInputs
): T & Links {
  const {
    auth,
    logout,
    external,
    users,
    allUsers,
    organizations,
    me: meLink,
    config,
    environment,
    flux,
  } = newLinks

  const linksObj = {
    auth: {links: auth},
    logoutLink: logout,
    external,
    users,
    allUsers,
    organizations,
    meLink,
    config,
    environment,
    flux,
  }

  return Object.assign({}, response, linksObj)
}

interface RequestParams {
  url?: string | string[]
  resource?: string
  id?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: object | string
  params?: Record<string, string>
  headers?: Record<string, string>
  signal?: AbortSignal
}

async function AJAX<T = any>(
  {
    url,
    resource = null,
    id = null,
    method = 'GET',
    data: requestData,
    params,
    headers: requestHeaders,
    signal,
  }: RequestParams,
  excludeBasepath = false
): Promise<AJAXResponse<T> & Partial<Links>> {
  url = addBasepath(url, excludeBasepath)
  let body: string | undefined

  if (resource && links) {
    url = id
      ? addBasepath(`${links[resource]}/${id}`, excludeBasepath)
      : addBasepath(`${links[resource]}`, excludeBasepath)
  }
  if (params) {
    const queryString = new URLSearchParams(params)
    if (queryString) {
      url += `?` + queryString
    }
  }
  if (requestData) {
    body =
      typeof requestData === 'string'
        ? requestData
        : JSON.stringify(requestData)
  }

  const fetchResponse = await fetch(url, {
    method: method as string,
    body,
    headers: requestHeaders,
    signal,
  }).catch(e =>
    e.name === 'AbortError'
      ? Promise.reject(new CancellationError())
      : Promise.reject(e)
  )
  let data: string | T
  if (fetchResponse.status === 204) {
    data = ''
  } else {
    const isText = (fetchResponse.headers.get('content-type') || '').includes(
      'text/'
    )
    data = isText ? await fetchResponse.text() : await fetchResponse.json()
  }
  const headers = {}
  fetchResponse.headers.forEach((v, k) => (headers[k] = v))

  const response = {
    status: fetchResponse.status,
    statusText: fetchResponse.statusText,
    data: data as T,
    headers,
  }

  const retVal = links ? generateResponseWithLinks(response, links) : response
  if (!fetchResponse.ok) {
    throw retVal // eslint-disable-line no-throw-literal
  }
  return retVal
}

export async function getAJAX<T = any>(url: string): Promise<{data: T}> {
  try {
    const response = await fetch(addBasepath(url, false), {
      method: 'GET',
    })
    if (response.ok) {
      const isText = (response.headers.get('content-type') || '').includes(
        'text/'
      )
      const responseData =
        isText || response.status === 204
          ? await response.text()
          : await response.json()
      return {data: responseData as T}
    }
    const data = await response.text()
    console.error(
      'failed to GET url:',
      url,
      'status:',
      response.statusText,
      'response:',
      data
    )
    Promise.reject(new Error(response.statusText || `error ${response.status}`))
  } catch (e) {
    console.error('failed to GET url:', url, 'error:', e)
    return Promise.reject(e)
  }
}

export default AJAX
