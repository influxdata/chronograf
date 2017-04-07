import {deleteSource, getSources as getSourcesAJAX} from 'src/shared/apis'
import {publishNotification} from './notifications'

export const loadSourcesRequested = () => ({
  type: 'LOAD_SOURCES_REQUESTED',
})

export const loadSourcesSucceeded = (sources) => ({
  type: 'LOAD_SOURCES_SUCCEEDED',
  payload: {
    sources,
  }
})

export const loadSourcesFailed = (error) => ({
  type: 'LOAD_SOURCES_FAILED',
  payload: {
    error,
  },
})

export const updateSource = (source) => ({
  type: 'UPDATE_SOURCE_SUCCEEDED',
  payload: {
    source,
  },
})

// TODO handle requested and failure cases

export const addSource = (source) => ({
  type: 'ADD_SOURCE_SUCCEEDED',
  payload: {
    source,
  },
})

// TODO handle requested and failure cases

// Async action creators

export const removeAndLoadSources = (source) => async (dispatch) => {
  try {
    try {
      await deleteSource(source)
    } catch (err) {
      // A 404 means that either a concurrent write occurred or the source
      // passed to this action creator doesn't exist (or is undefined)
      if (err.status !== 404) { // eslint-disable-line no-magic-numbers
        throw (err)
      }
    }

    const {data: {sources: newSources}} = await getSourcesAJAX()
    dispatch(loadSourcesSucceeded(newSources))
  } catch (err) {
    dispatch(publishNotification("error", "Internal Server Error. Check API Logs"))
  }
}

export const getSources = () => async (dispatch) => {
  dispatch(loadSourcesRequested())

  try {
    const {data: {sources}} = await getSourcesAJAX()

    dispatch(loadSourcesSucceeded(sources))
  } catch (error) {
    console.error(error)
    dispatch(loadSourcesFailed(error))
  }
}
