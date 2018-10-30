import {
  deleteSource,
  getSources as getSourcesAJAX,
  getServices as getServicesAJAX,
  getKapacitors as getKapacitorsAJAX,
  updateKapacitor as updateKapacitorAJAX,
  deleteKapacitor as deleteKapacitorAJAX,
  createService as createServiceAJAX,
  updateService as updateServiceAJAX,
} from 'src/shared/apis'

import {notify} from './notifications'
import {errorThrown} from 'src/shared/actions/errors'

import {HTTP_NOT_FOUND} from 'src/shared/constants'
import {
  notifyServerError,
  notifyCouldNotRetrieveKapacitors,
  notifyCouldNotDeleteKapacitor,
} from 'src/shared/copy/notifications'

import {Source, Kapacitor, Service, SourceLinks, NewService} from 'src/types'

export type Action =
  | ActionLoadSources
  | ActionUpdateSource
  | ActionAddSource
  | ActionFetchKapacitors
  | ActionSetActiveKapacitor
  | ActionDeleteKapacitor

// Load Sources
export type LoadSources = (sources: Source[]) => ActionLoadSources
export interface ActionLoadSources {
  type: 'LOAD_SOURCES'
  payload: {
    sources: Source[]
  }
}

export const loadSources = (sources: Source[]): ActionLoadSources => ({
  type: 'LOAD_SOURCES',
  payload: {
    sources,
  },
})

export type UpdateSource = (source: Source) => ActionUpdateSource
export interface ActionUpdateSource {
  type: 'SOURCE_UPDATED'
  payload: {
    source: Source
  }
}

export const updateSource = (source: Source): ActionUpdateSource => ({
  type: 'SOURCE_UPDATED',
  payload: {
    source,
  },
})

export type AddSource = (source: Source) => ActionAddSource
export interface ActionAddSource {
  type: 'SOURCE_ADDED'
  payload: {
    source: Source
  }
}

export const addSource = (source: Source): ActionAddSource => ({
  type: 'SOURCE_ADDED',
  payload: {
    source,
  },
})

export type FetchKapacitors = (
  source: Source,
  kapacitors: Kapacitor[]
) => ActionFetchKapacitors

export interface ActionFetchKapacitors {
  type: 'LOAD_KAPACITORS'
  payload: {
    source: Source
    kapacitors: Kapacitor[]
  }
}

export const fetchKapacitors = (
  source: Source,
  kapacitors: Kapacitor[]
): ActionFetchKapacitors => ({
  type: 'LOAD_KAPACITORS',
  payload: {
    source,
    kapacitors,
  },
})

export type SetActiveKapacitor = (
  kapacitor: Kapacitor
) => ActionSetActiveKapacitor

export interface ActionSetActiveKapacitor {
  type: 'SET_ACTIVE_KAPACITOR'
  payload: {
    kapacitor: Kapacitor
  }
}

export const setActiveKapacitor = (
  kapacitor: Kapacitor
): ActionSetActiveKapacitor => ({
  type: 'SET_ACTIVE_KAPACITOR',
  payload: {
    kapacitor,
  },
})

export type DeleteKapacitor = (kapacitor: Kapacitor) => ActionDeleteKapacitor
export interface ActionDeleteKapacitor {
  type: 'DELETE_KAPACITOR'
  payload: {
    kapacitor: Kapacitor
  }
}

export const deleteKapacitor = (kapacitor: Kapacitor) => ({
  type: 'DELETE_KAPACITOR',
  payload: {
    kapacitor,
  },
})

export type RemoveAndLoadSources = (
  source: Source
) => (dispatch) => Promise<void>

// Async action creators
export const removeAndLoadSources = (source: Source) => async (
  dispatch,
  getState
): Promise<void> => {
  const {sources = []} = getState()
  const filteredSources = sources.filter(s => s.id !== source.id)

  dispatch(loadSources(filteredSources))

  try {
    try {
      await deleteSource(source)
    } catch (err) {
      dispatch(loadSources(sources))
      // A 404 means that either a concurrent write occurred or the source
      // passed to this action creator doesn't exist (or is undefined)
      if (err.status !== HTTP_NOT_FOUND) {
        throw err
      }
    }

    const {
      data: {sources: newSources},
    } = await getSourcesAJAX()
    dispatch(loadSources(newSources))
  } catch (err) {
    dispatch(notify(notifyServerError))
  }
}

export type FetchKapacitorsAsync = (
  source: Source
) => (dispatch) => Promise<void>

export const fetchKapacitorsAsync: FetchKapacitorsAsync = source => async dispatch => {
  try {
    const kapacitors = await getKapacitorsAJAX(source)
    dispatch(fetchKapacitors(source, kapacitors))
  } catch (err) {
    dispatch(notify(notifyCouldNotRetrieveKapacitors(source.id)))
  }
}

export type SetActiveKapacitorAsync = (
  kapacitor: Kapacitor
) => (dispatch) => Promise<void>

export const setActiveKapacitorAsync = (kapacitor: Kapacitor) => async (
  dispatch
): Promise<void> => {
  // eagerly update the redux state
  dispatch(setActiveKapacitor(kapacitor))
  const kapacitorPost = {...kapacitor, active: true}
  await updateKapacitorAJAX(kapacitorPost)
}

export type DeleteKapacitorAsync = (
  source: Source
) => (dispatch) => Promise<void>

export const deleteKapacitorAsync = (kapacitor: Kapacitor) => async (
  dispatch
): Promise<void> => {
  try {
    await deleteKapacitorAJAX(kapacitor)
    dispatch(deleteKapacitor(kapacitor))
  } catch (err) {
    dispatch(notify(notifyCouldNotDeleteKapacitor()))
  }
}

export const getSourcesAsync = () => async (dispatch): Promise<Source[]> => {
  try {
    const {data} = await getSourcesAJAX()

    const sources: Source[] = data.sources

    const sourcesWithFluxLink = await Promise.all(sources.map(addSourceLink))

    dispatch(loadSources(sourcesWithFluxLink))
    return sourcesWithFluxLink
  } catch (error) {
    dispatch(errorThrown(error))
  }
}

const addSourceLink = async (source: Source): Promise<Source> => {
  try {
    const services = await getServicesAJAX(source.links.services)
    const fluxServices = services.filter(s => s.type === 'flux')

    let service: Service

    if (validateSupportsFlux(source)) {
      if (!fluxServices.length) {
        service = await createFluxServiceForSource(source)
      } else {
        if (fluxServices[0].url !== source.url) {
          service = await updateFluxService(source, fluxServices[0])
        } else {
          service = fluxServices[0]
        }
      }

      const {links} = source
      const linksWithFlux: SourceLinks = {...links, flux: service.links.proxy}

      return {...source, links: linksWithFlux}
    }

    return source
  } catch (err) {
    return source
  }
}

const createFluxServiceForSource = async (source: Source) => {
  const {url} = source

  const service: NewService = {
    name: 'Flux',
    url,
    username: '',
    insecureSkipVerify: false,
    type: 'flux',
    metadata: {
      active: true,
    },
  }
  const s = await createServiceAJAX(source, service)
  return s
}

const updateFluxService = async (source: Source, service: Service) => {
  const {url} = source
  const updatedService = {...service, url}
  const s = await updateServiceAJAX(updatedService)
  return s
}

const validateSupportsFlux = (source: Source) => {
  if (source.type !== 'influx') {
    return false
  }

  if (source.version.toLowerCase() === 'unknown') {
    return true
  }

  const regex = RegExp('(\\.*\\d+\\.*)+', 'g')
  const version = regex.exec(source.version)
  let versionNumber = 0
  if (version && version.length) {
    versionNumber = parseFloat(version[0])
  }

  return versionNumber >= 1.7
}
