import {deleteSource, getSources} from 'src/shared/apis'
import {publishNotification} from './notifications'

export const loadSources = (sources) => ({
  type: 'LOAD_SOURCES',
  payload: {
    sources,
  },
})

export const updateSource = (source) => ({
  type: 'SOURCE_UPDATED',
  payload: {
    source,
  },
})

export const addSource = (source) => ({
  type: 'SOURCE_ADDED',
  payload: {
    source,
  },
})

// Async action creators

export const removeAndLoadSources = (source, sources) => async (dispatch) => {
  try {
    try {
      await deleteSource(source)
    } catch (err) {
      // A 404 means that a concurrent write occurred, since the above
      // assertion was successful. It's safe to pretend the delete was
      // successful and reload sources.
      if (err.status !== 404) { // eslint-disable-line no-magic-numbers
        throw (err)
      }
    }

    const {data: {sources: newSources}} = await getSources()
    dispatch(loadSources(newSources))
  } catch (err) {
    dispatch(publishNotification("error", "Internal Server Error. Check API Logs"))
  }
}
