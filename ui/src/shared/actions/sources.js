import {deleteSource, getSources} from 'src/shared/apis'

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

export const removeSource = (source) => ({
  type: 'SOURCE_REMOVED',
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

export const removeAndLoadSources = (source) => async (dispatch) => {
  await deleteSource(source)
  const sources = await getSources()
  dispatch(loadSources(sources.data.sources))
}
