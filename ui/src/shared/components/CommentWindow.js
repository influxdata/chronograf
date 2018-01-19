import React, {PropTypes} from 'react'

import {commentWindowStyle} from 'src/shared/comments/styles'

const CommentWindow = ({comment, dygraph}) =>
  <div
    className="dygraph-comment-window"
    style={commentWindowStyle(comment, dygraph)}
  />

const {shape, string} = PropTypes

CommentWindow.propTypes = {
  comment: shape({
    time: string.isRequired,
    duration: string.isRequired,
  }).isRequired,
  dygraph: shape({}).isRequired,
}

export default CommentWindow
