export const loadComments = comments => ({
  type: 'LOAD_ANNOTATIONS',
  payload: {
    comments,
  },
})

export const updateComment = comment => ({
  type: 'UPDATE_ANNOTATION',
  payload: {
    comment,
  },
})

export const deleteComment = comment => ({
  type: 'DELETE_ANNOTATION',
  payload: {
    comment,
  },
})
