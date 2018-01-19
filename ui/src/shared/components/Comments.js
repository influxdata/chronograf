import React, {PropTypes, Component} from 'react'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import Comment from 'src/shared/components/Comment'
import CommentWindow from 'src/shared/components/CommentWindow'

import {updateComment, deleteComment} from 'src/shared/actions/comments'
import {getComments} from 'src/shared/comments/helpers'

class Comments extends Component {
  state = {
    dygraph: null,
  }

  componentDidMount() {
    this.props.commentsRef(this)
  }

  render() {
    const {dygraph} = this.state
    const {handleUpdateComment, handleDeleteComment} = this.props

    if (!dygraph) {
      return null
    }

    const comments = getComments(dygraph, this.props.comments)

    return (
      <div className="comments-container">
        {comments.map(a =>
          <Comment
            key={a.id}
            comment={a}
            dygraph={dygraph}
            comments={comments}
            onUpdateComment={handleUpdateComment}
            onDeleteComment={handleDeleteComment}
          />
        )}
        {comments.map((a, i) => {
          return a.duration
            ? <CommentWindow key={i} comment={a} dygraph={dygraph} />
            : null
        })}
      </div>
    )
  }
}

const {arrayOf, func, shape} = PropTypes

Comments.propTypes = {
  comments: arrayOf(shape({})),
  commentsRef: func,
  handleDeleteComment: func.isRequired,
  handleUpdateComment: func.isRequired,
}

const mapStateToProps = ({comments}) => ({
  comments,
})

const mapDispatchToProps = dispatch => ({
  handleUpdateComment: bindActionCreators(updateComment, dispatch),
  handleDeleteComment: bindActionCreators(deleteComment, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(Comments)
