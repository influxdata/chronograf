import {
  deleteSource,
  getSources as getSourcesAJAX,
  getKapacitors as getKapacitorsAJAX,
  updateKapacitor as updateKapacitorAJAX,
  deleteKapacitor as deleteKapacitorAJAX,
} from 'src/shared/apis'

import {notify} from './notifications'
import {errorThrown} from 'src/shared/actions/errors'

import {HTTP_NOT_FOUND} from 'src/shared/constants'
import {
  notifyServerError,
  notifyCouldNotRetrieveKapacitors,
  notifyCouldNotDeleteKapacitor,
} from 'src/shared/copy/notifications'

import {Source, Kapacitor} from 'src/types'

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
  dispatch
): Promise<void> => {
  try {
    try {
      await deleteSource(source)
    } catch (err) {
      // A 404 means that either a concurrent write occurred or the source
      // passed to this action creator doesn't exist (or is undefined)
      if (err.status !== HTTP_NOT_FOUND) {
        // eslint-disable-line no-magic-numbers
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
    const {data} = await getKapacitorsAJAX(source)
    dispatch(fetchKapacitors(source, data.kapacitors))
  } catch (err) {
    dispatch(notify(notifyCouldNotRetrieveKapacitors(source.id)))
  }
}

export type SetActiveKapacitorAsync = (
  source: Source
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

export const getSourcesAsync = () => async (dispatch): Promise<void> => {
  try {
    const {
      data: {sources},
    } = await getSourcesAJAX()
    dispatch(loadSources(sources))
    return sources
  } catch (error) {
    dispatch(errorThrown(error))
  }
}
