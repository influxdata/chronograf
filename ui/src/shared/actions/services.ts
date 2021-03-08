import {Source, Service, NewService} from 'src/types'
import {
  updateService as updateServiceAJAX,
  getServices as getServicesAJAX,
  createService as createServiceAJAX,
  deleteService as deleteServiceAJAX,
} from 'src/shared/apis'
import {notify} from './notifications'
import {couldNotGetServices} from 'src/shared/copy/notifications'

export type Action =
  | ActionLoadServices
  | ActionAddService
  | ActionDeleteService
  | ActionUpdateService
  | ActionSetActiveService

// Load Services
export type LoadServices = (services: Service[]) => ActionLoadServices
export interface ActionLoadServices {
  type: 'LOAD_SERVICES'
  payload: {
    services: Service[]
  }
}

export const loadServices = (services: Service[]): ActionLoadServices => ({
  type: 'LOAD_SERVICES',
  payload: {
    services,
  },
})

// Add a Service
export type AddService = (service: Service) => ActionAddService
export interface ActionAddService {
  type: 'ADD_SERVICE'
  payload: {
    service: Service
  }
}

export const addService = (service: Service): ActionAddService => ({
  type: 'ADD_SERVICE',
  payload: {
    service,
  },
})

// Delete Service
export type DeleteService = (service: Service) => ActionDeleteService
export interface ActionDeleteService {
  type: 'DELETE_SERVICE'
  payload: {
    service: Service
  }
}

export const deleteService = (service: Service): ActionDeleteService => ({
  type: 'DELETE_SERVICE',
  payload: {
    service,
  },
})

// Update Service
export type UpdateService = (service: Service) => ActionUpdateService
export interface ActionUpdateService {
  type: 'UPDATE_SERVICE'
  payload: {
    service: Service
  }
}

export const updateService = (service: Service): ActionUpdateService => ({
  type: 'UPDATE_SERVICE',
  payload: {
    service,
  },
})

// Set Active Service
export type SetActiveService = (
  source: Source,
  service: Service
) => ActionSetActiveService
export interface ActionSetActiveService {
  type: 'SET_ACTIVE_SERVICE'
  payload: {
    source: Source
    service: Service
  }
}

export const setActiveService = (
  source: Source,
  service: Service
): ActionSetActiveService => ({
  type: 'SET_ACTIVE_SERVICE',
  payload: {
    source,
    service,
  },
})

export type SetActiveServiceAsync = (
  source: Source,
  activeService: Service,
  prevActiveService: Service
) => (dispatch) => Promise<void>

export const setActiveServiceAsync = (
  source: Source,
  activeService: Service,
  prevActiveService: Service
) => async (dispatch): Promise<void> => {
  try {
    activeService = {...activeService, metadata: {active: true}}
    await updateServiceAJAX(activeService)

    if (prevActiveService) {
      prevActiveService = {...prevActiveService, metadata: {active: false}}
      await updateServiceAJAX(prevActiveService)
    }

    dispatch(setActiveService(source, activeService))
  } catch (err) {
    console.error(err.data)
  }
}

export type FetchAllFluxServicesAsync = (
  sources: Source[]
) => (dispatch) => Promise<void>

export const fetchAllFluxServicesAsync: FetchAllFluxServicesAsync = (
  sources
) => async (dispatch): Promise<void> => {
  const allServicesForSources: Array<Promise<Service[]>> = sources.map(
    async (source) => {
      try {
        return getServicesAJAX(source.links.services)
      } catch (err) {
        dispatch(notify(couldNotGetServices))
      }
    }
  )

  try {
    const sourceServices = await Promise.all(allServicesForSources)
    const flat = sourceServices.reduce((acc, cur) => {
      return [...acc, ...cur.filter((s) => s.type === 'flux')]
    })
    dispatch(loadServices(flat))
  } catch (err) {
    console.error(err.data)
    dispatch(notify(couldNotGetServices))
    throw err.data
  }
}

export type FetchFluxServicesForSourceAsync = (
  source: Source
) => (dispatch) => Promise<void>
export const fetchFluxServicesForSourceAsync: FetchFluxServicesForSourceAsync = (
  source
) => async (dispatch): Promise<void> => {
  try {
    const services = await getServicesAJAX(source.links.services)
    const fluxServices = services.filter((s) => s.type === 'flux')
    dispatch(loadServices(fluxServices))
  } catch (err) {
    console.error(err.data)
    dispatch(notify(couldNotGetServices))
    throw err.data
  }
}

export type CreateServiceAsync = (
  source: Source,
  service: NewService
) => Service

export const createServiceAsync = (
  source: Source,
  service: NewService
) => async (dispatch): Promise<Service> => {
  try {
    const metadata = {active: true}
    const s = await createServiceAJAX(source, {...service, metadata})
    dispatch(addService(s))
    return s
  } catch (err) {
    console.error(err.data)
    throw err.data
  }
}

export type UpdateServiceAsync = (
  service: Service
) => (dispatch) => Promise<void>
export const updateServiceAsync = (service: Service) => async (
  dispatch
): Promise<void> => {
  try {
    const s = await updateServiceAJAX(service)
    dispatch(updateService(s))
  } catch (err) {
    console.error(err.data)
    throw err.data
  }
}

export type DeleteServiceAsync = (
  service: Service
) => (dispatch) => Promise<void>
export const deleteServiceAsync = (service: Service) => async (
  dispatch
): Promise<void> => {
  try {
    await deleteServiceAJAX(service)
    dispatch(deleteService(service))
  } catch (err) {
    console.error(err.data)
    throw err.data
  }
}
