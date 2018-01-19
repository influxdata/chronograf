export const loadComments = comments => ({
  type: 'LOAD_COMMENTS',
  payload: {
    comments,
  },
})

export const updateComment = comment => ({
  type: 'UPDATE_COMMENT',
  payload: {
    comment,
  },
})

export const deleteComment = comment => ({
  type: 'DELETE_COMMENT',
  payload: {
    comment,
  },
})
