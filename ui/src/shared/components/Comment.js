import React, {Component, PropTypes} from 'react'

import CommentTooltip from 'src/shared/components/CommentTooltip'

import {
  flagStyle,
  clickAreaStyle,
  commentStyle,
} from 'src/shared/comments/styles'

const idAppendage = '-end'

class Comment extends Component {
  state = {
    isDragging: false,
    isMouseOver: false,
  }

  isEndpoint = () => {
    const {comment: {id}} = this.props

    return id.substring(id.length - idAppendage.length) === idAppendage
  }

  getStartID = () => {
    const {comment: {id}} = this.props

    return id.substring(0, id.length - idAppendage.length)
  }

  handleStartDrag = () => {
    this.setState({isDragging: true})
  }

  handleStopDrag = () => {
    this.setState({isDragging: false})
  }

  handleMouseEnter = () => {
    this.setState({isMouseOver: true})
  }

  handleMouseLeave = e => {
    const {comment} = this.props

    if (e.relatedTarget.id === `tooltip-${comment.id}`) {
      return this.setState({isDragging: false})
    }
    this.setState({isDragging: false, isMouseOver: false})
  }

  handleDrag = e => {
    if (!this.state.isDragging) {
      return
    }

    const {pageX} = e
    const {comment, comments, dygraph, onUpdateComment} = this.props
    const {time, duration} = comment
    const {left} = dygraph.graphDiv.getBoundingClientRect()
    const [startX, endX] = dygraph.xAxisRange()

    const graphX = pageX - left
    let newTime = dygraph.toDataXCoord(graphX)
    const oldTime = +time

    const minPercentChange = 0.5

    if (
      Math.abs(
        dygraph.toPercentXCoord(newTime) - dygraph.toPercentXCoord(oldTime)
      ) *
        100 <
      minPercentChange
    ) {
      return
    }

    if (newTime >= endX) {
      newTime = endX
    }

    if (newTime <= startX) {
      newTime = startX
    }

    if (this.isEndpoint()) {
      const startComment = comments.find(a => a.id === this.getStartID())
      if (!startComment) {
        return console.error('Start comment does not exist')
      }

      const newDuration = newTime - oldTime + Number(startComment.duration)

      this.counter = this.counter + 1
      return onUpdateComment({
        ...startComment,
        duration: `${newDuration}`,
      })
    }

    if (duration) {
      const differenceInTimes = oldTime - newTime
      const newDuration = Number(duration) + differenceInTimes

      return onUpdateComment({
        ...comment,
        time: `${newTime}`,
        duration: `${newDuration}`,
      })
    }

    onUpdateComment({...comment, time: `${newTime}`})

    e.preventDefault()
    e.stopPropagation()
  }

  handleConfirmUpdate = comment => {
    const {onUpdateComment} = this.props

    if (this.isEndpoint()) {
      const id = this.getStartID()
      return onUpdateComment({...comment, id})
    }

    onUpdateComment(comment)
  }

  handleDeleteComment = () => {
    const {onDeleteComment, comment} = this.props

    if (this.isEndpoint()) {
      const id = this.getStartID()
      return onDeleteComment({...comment, id})
    }

    onDeleteComment(comment)
  }

  render() {
    const {dygraph, comment} = this.props
    const {isDragging, isMouseOver} = this.state

    const humanTime = `${new Date(+comment.time)}`
    const hasDuration = !!comment.duration

    return (
      <div
        className="dygraph-comment"
        style={commentStyle(comment, dygraph, isMouseOver, isDragging)}
        data-time-ms={comment.time}
        data-time-local={humanTime}
      >
        <div
          style={clickAreaStyle(isDragging)}
          onMouseMove={this.handleDrag}
          onMouseDown={this.handleStartDrag}
          onMouseUp={this.handleStopDrag}
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
        />
        <div
          style={flagStyle(
            isMouseOver,
            isDragging,
            hasDuration,
            this.isEndpoint()
          )}
        />
        <CommentTooltip
          comment={comment}
          onMouseLeave={this.handleMouseLeave}
          commentState={this.state}
          onConfirmUpdate={this.handleConfirmUpdate}
          onDelete={this.handleDeleteComment}
        />
      </div>
    )
  }
}

const {arrayOf, func, shape, string} = PropTypes

Comment.propTypes = {
  comments: arrayOf(shape({})),
  comment: shape({
    id: string.isRequired,
    time: string.isRequired,
    duration: string,
  }).isRequired,
  dygraph: shape({}).isRequired,
  onUpdateComment: func.isRequired,
  onDeleteComment: func.isRequired,
}

export default Comment
