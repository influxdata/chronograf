import React, {Component, MouseEvent} from 'react'
import {connect} from 'react-redux'
import moment from 'moment'
import classnames from 'classnames'

import AnnotationInput from 'src/shared/components/AnnotationInput'
import * as actions from 'src/shared/actions/annotations'
import {ErrorHandling} from 'src/shared/decorators/errors'

import {AnnotationInterface} from 'src/types'

interface TimeStampProps {
  time: number
}

const TimeStamp = ({time}: TimeStampProps): JSX.Element => (
  <div className="annotation-tooltip--timestamp">
    {`${moment(time).format('YYYY/MM/DD HH:mm:ss.SS')}`}
  </div>
)

interface Span {
  spanCenter: number
  tooltipLeft: number
  spanWidth: number
}

interface State {
  annotation: AnnotationInterface
}

interface PropsFromDispatch {
  deleteAnnotationAsync: (a: AnnotationInterface) => void
  updateAnnotationAsync: (a: AnnotationInterface) => void
}

interface AnnotationState {
  isDragging: boolean
  isMouseOver: boolean
}

interface ClassProps {
  isEditing: boolean
  annotation: AnnotationInterface
  timestamp: number
  onMouseLeave: (e: MouseEvent<HTMLDivElement>) => void
  annotationState: AnnotationState
  span?: Span
}

type Props = ClassProps & PropsFromDispatch

@ErrorHandling
class AnnotationTooltip extends Component<Props, State> {
  public state = {
    annotation: this.props.annotation,
  }

  public componentWillReceiveProps(nextProps: Props) {
    const {annotation} = nextProps
    this.setState({annotation})
  }

  public render() {
    const {annotation} = this.state
    const {
      onMouseLeave,
      timestamp,
      annotationState: {isDragging, isMouseOver},
      isEditing,
      span,
    } = this.props

    const tooltipClass = classnames('annotation-tooltip', {
      hidden: !(isDragging || isMouseOver),
      'annotation-span-tooltip': !!span,
    })

    return (
      <div
        id={`tooltip-${annotation.id}`}
        onMouseLeave={onMouseLeave}
        className={tooltipClass}
        style={
          span
            ? {left: `${span.tooltipLeft}px`, minWidth: `${span.spanWidth}px`}
            : {}
        }
      >
        {isDragging ? (
          <TimeStamp time={timestamp} />
        ) : (
          <div className="annotation-tooltip--items">
            {isEditing ? (
              <div>
                <AnnotationInput
                  value={annotation.text}
                  onChangeInput={this.handleChangeInput('text')}
                  onConfirmUpdate={this.handleConfirmUpdate}
                  onRejectUpdate={this.handleRejectUpdate}
                />
                <button
                  className="annotation-tooltip--delete"
                  onClick={this.handleDelete}
                  title="Delete this Annotation"
                >
                  <span className="icon trash" />
                </button>
              </div>
            ) : (
              <div>{annotation.text}</div>
            )}
            <TimeStamp time={timestamp} />
          </div>
        )}
      </div>
    )
  }

  private handleChangeInput = (key: string) => (value: string) => {
    const {annotation} = this.state
    const newAnnotation = {...annotation, [key]: value}

    this.setState({annotation: newAnnotation})
  }

  private handleConfirmUpdate = () => {
    this.props.updateAnnotationAsync(this.state.annotation)
  }

  private handleRejectUpdate = () => {
    this.setState({annotation: this.props.annotation})
  }

  private handleDelete = () => {
    this.props.deleteAnnotationAsync(this.props.annotation)
  }
}

const mdtp = {
  deleteAnnotationAsync: actions.deleteAnnotationAsync,
  updateAnnotationAsync: actions.updateAnnotationAsync,
}

export default connect<{}, PropsFromDispatch, ClassProps>(null, mdtp)(
  AnnotationTooltip
)
