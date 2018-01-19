import React, {PropTypes} from 'react'
import CommentWindow from 'src/shared/components/CommentWindow'

const style = {
  position: 'absolute',
  width: 'calc(100% - 32px)',
  height: 'calc(100% - 16px)',
  top: '8px',
  zIndex: '50',
  overflow: 'hidden',
}

const CommentWindows = ({comments, dygraph}) => {
  if (!dygraph) {
    return null
  }

  return (
    <div className="comment-windows-container" style={style}>
      {comments.map((a, i) => {
        return a.duration
          ? <CommentWindow key={i} comment={a} dygraph={dygraph} />
          : null
      })}
    </div>
  )
}

const {arrayOf, shape} = PropTypes

CommentWindows.propTypes = {
  comments: arrayOf(shape({})),
  dygraph: shape({}),
}

export default CommentWindows
