/* eslint-disable @typescript-eslint/ban-types */
import axios, {AxiosResponse} from 'axios'

let links
export const setAJAXLinks = ({updatedLinks}): void => {
  links = updatedLinks
}

// do not prefix route with basepath, ex. for external links
const addBasepath = (url, excludeBasepath): string => {
  const basepath = window.basepath || ''

  return excludeBasepath ? url : `${basepath}${url}`
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
  params?: object
  headers?: object
  validateStatus?: (status: number) => boolean
}

async function AJAX<T = any>(
  {
    url,
    resource = null,
    id = null,
    method = 'GET',
    data = {},
    params = {},
    headers = {},
  }: RequestParams,
  excludeBasepath = false
): Promise<(T | (T & {links: object})) | AxiosResponse<T>> {
  try {
    url = addBasepath(url, excludeBasepath)

    if (resource && links) {
      url = id
        ? addBasepath(`${links[resource]}/${id}`, excludeBasepath)
        : addBasepath(`${links[resource]}`, excludeBasepath)
    }

    const response = await axios.request<T>({
      url,
      method,
      data,
      params,
      headers,
    })

    // TODO: Just return the unadulterated response without grafting auth, me,
    // and logoutLink onto this object, once those are retrieved via their own
    // AJAX request and action creator.
    return links ? generateResponseWithLinks(response, links) : response
  } catch (error) {
    const {response} = error
    if (response) {
      throw links ? generateResponseWithLinks(response, links) : response // eslint-disable-line no-throw-literal
    } else {
      throw error
    }
  }
}

export async function getAJAX<T = any>(url: string): Promise<AxiosResponse<T>> {
  try {
    return await axios.request<T>({method: 'GET', url: addBasepath(url, false)})
  } catch (error) {
    console.error(error)
    throw error
  }
}

export default AJAX
