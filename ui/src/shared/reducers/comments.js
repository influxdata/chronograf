const initialState = [
  {
    id: '0',
    group: '',
    name: 'anno1',
    time: '1515716169000',
    duration: '33600000', // 1 hour
    text: 'you have no swoggels',
  },
  {
    id: '1',
    group: '',
    name: 'anno2',
    time: '1515772377000',
    duration: '',
    text: 'another comment',
  },
]

const commentsReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'LOAD_COMMENTS': {
      return action.payload.comments
    }

    case 'UPDATE_COMMENT': {
      const {comment} = action.payload
      const newState = state.map(a => (a.id === comment.id ? comment : a))

      return newState
    }

    case 'DELETE_COMMENT': {
      const {comment} = action.payload
      const newState = state.filter(a => a.id !== comment.id)

      return newState
    }
  }

  return state
}

export default commentsReducer
