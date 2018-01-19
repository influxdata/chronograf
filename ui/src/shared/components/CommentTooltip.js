import React, {Component, PropTypes} from 'react'

import CommentInput from 'src/shared/components/CommentInput'

import {
  tooltipStyle,
  tooltipItemsStyle,
  tooltipTimestampStyle,
} from 'src/shared/comments/styles'

const TimeStamp = ({time}) =>
  <div style={tooltipTimestampStyle}>
    {`${new Date(+time)}`}
  </div>

class CommentTooltip extends Component {
  state = {
    comment: this.props.comment,
  }

  handleChangeInput = key => value => {
    const {comment} = this.state
    const newComment = {...comment, [key]: value}

    this.setState({comment: newComment})
  }

  handleConfirmUpdate = () => {
    this.props.onConfirmUpdate(this.state.comment)
  }

  handleRejectUpdate = () => {
    this.setState({comment: this.props.comment})
  }

  render() {
    const {comment} = this.state
    const {onMouseLeave, commentState, commentState: {isDragging}} = this.props

    return (
      <div
        id={`tooltip-${comment.id}`}
        onMouseLeave={onMouseLeave}
        style={tooltipStyle(commentState)}
      >
        {isDragging
          ? <TimeStamp time={this.props.comment.time} />
          : <div style={tooltipItemsStyle}>
              <button
                className="btn btn-sm btn-danger btn-square"
                onClick={this.props.onDelete}
              >
                <span className="icon trash" />
              </button>
              <CommentInput
                value={comment.name}
                onChangeInput={this.handleChangeInput('name')}
                onConfirmUpdate={this.handleConfirmUpdate}
                onRejectUpdate={this.handleRejectUpdate}
              />
              <CommentInput
                value={comment.text}
                onChangeInput={this.handleChangeInput('text')}
                onConfirmUpdate={this.handleConfirmUpdate}
                onRejectUpdate={this.handleRejectUpdate}
              />
              <TimeStamp time={this.props.comment.time} />
            </div>}
      </div>
    )
  }
}

const {func, shape, string} = PropTypes

TimeStamp.propTypes = {
  time: string.isRequired,
}
CommentTooltip.propTypes = {
  comment: shape({}).isRequired,
  onMouseLeave: func.isRequired,
  commentState: shape({}),
  onConfirmUpdate: func.isRequired,
  onDelete: func.isRequired,
}

export default CommentTooltip
