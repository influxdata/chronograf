import {
  deleteSource,
  getSources as getSourcesAJAX,
  getKapacitors as getKapacitorsAJAX,
  updateKapacitor as updateKapacitorAJAX,
  deleteKapacitor as deleteKapacitorAJAX,
} from 'src/shared/apis'
import { notify } from './notifications'
import { errorThrown } from 'src/shared/actions/errors'

import { HTTP_NOT_FOUND } from 'src/shared/constants'
import {
  notifyServerError,
  notifyCouldNotRetrieveKapacitors,
  notifyCouldNotDeleteKapacitor,
} from 'src/shared/copy/notifications'

import { Source, Kapacitor } from 'src/types'

export const loadSources = (sources: Source[]) => ({
  type: 'LOAD_SOURCES',
  payload: {
    sources,
  },
})

export const updateSource = (source: Source) => ({
  type: 'SOURCE_UPDATED',
  payload: {
    source,
  },
})

export const addSource = (source: Source) => ({
  type: 'SOURCE_ADDED',
  payload: {
    source,
  },
})

export const fetchKapacitors = (source: Source, kapacitors: Kapacitor[]) => ({
  type: 'LOAD_KAPACITORS',
  payload: {
    source,
    kapacitors,
  },
})

export const setActiveKapacitor = (kapacitor: Kapacitor) => ({
  type: 'SET_ACTIVE_KAPACITOR',
  payload: {
    kapacitor,
  },
})

export const deleteKapacitor = (kapacitor: Kapacitor) => ({
  type: 'DELETE_KAPACITOR',
  payload: {
    kapacitor,
  },
})

// Async action creators

export const removeAndLoadSources = (source: Source) => async dispatch => {
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

    const { data: { sources: newSources } } = await getSourcesAJAX()
    dispatch(loadSources(newSources))
  } catch (err) {
    dispatch(notify(notifyServerError()))
  }
}

export const fetchKapacitorsAsync = (source: Source) => async dispatch => {
  try {
    const { data } = await getKapacitorsAJAX(source)
    dispatch(fetchKapacitors(source, data.kapacitors))
  } catch (err) {
    dispatch(notify(notifyCouldNotRetrieveKapacitors(source.id)))
  }
}

export const setActiveKapacitorAsync = kapacitor => async dispatch => {
  // eagerly update the redux state
  dispatch(setActiveKapacitor(kapacitor))
  const kapacitorPost = { ...kapacitor, active: true }
  await updateKapacitorAJAX(kapacitorPost)
}

export const deleteKapacitorAsync = (
  kapacitor: Kapacitor,
) => async dispatch => {
  try {
    await deleteKapacitorAJAX(kapacitor)
    dispatch(deleteKapacitor(kapacitor))
  } catch (err) {
    dispatch(notify(notifyCouldNotDeleteKapacitor()))
  }
}

export const getSourcesAsync = () => async dispatch => {
  try {
    const { data: { sources } } = await getSourcesAJAX()
    dispatch(loadSources(sources))
    return sources
  } catch (error) {
    dispatch(errorThrown(error))
  }
}
