const initiateState = null

export default function sources(state = initiateState, action) {
  switch (action.type) {
    case 'LOAD_SOURCES_REQUESTED': {
      return 'REQUESTED'
    }

    case 'LOAD_SOURCES_SUCCEEDED': {
      return action.payload.sources
    }

    case 'LOAD_SOURCES_FAILED': {
      return 'FAILED'
    }

    // TODO handle requested and failure cases
    case 'UPDATE_SOURCE_SUCCEEDED': {
      const {source} = action.payload
      const updatedIndex = state.findIndex((s) => s.id === source.id)
      const updatedSources = source.default ? state.map((s) => {
        s.default = false; return s
      }) : [...state]
      updatedSources[updatedIndex] = source
      return updatedSources
    }

    // TODO handle requested and failure cases
    case 'ADD_SOURCE_SUCCEEDED': {
      const {source} = action.payload
      const updatedSources = source.default ? state.map((s) => {
        s.default = false; return s
      }) : state
      return [...updatedSources, source]
    }
  }

  return state
}
