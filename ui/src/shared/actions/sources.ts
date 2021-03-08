// APIS
import {
  deleteSource,
  getSources as getSourcesAJAX,
  getKapacitors as getKapacitorsAJAX,
  updateKapacitor as updateKapacitorAJAX,
  deleteKapacitor as deleteKapacitorAJAX,
} from 'src/shared/apis'

// Constants
import {HTTP_NOT_FOUND} from 'src/shared/constants'
import {
  notifyServerError,
  notifyCouldNotRetrieveKapacitors,
  notifyCouldNotDeleteKapacitor,
} from 'src/shared/copy/notifications'

// Actions
import {notify} from './notifications'
import {errorThrown} from 'src/shared/actions/errors'

// Types
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

export const fetchKapacitorsAsyncNoNotify: FetchKapacitorsAsync = source => async dispatch => {
  const kapacitors = await getKapacitorsAJAX(source)
  dispatch(fetchKapacitors(source, kapacitors))
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

    // const sourcesWithFluxLink = await Promise.all(sources.map(addSourceLink))

    dispatch(loadSources(sources))
    return sources
  } catch (error) {
    dispatch(errorThrown(error))
  }
}
