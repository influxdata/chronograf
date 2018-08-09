import React, {SFC, MouseEvent} from 'react'
import {connect} from 'react-redux'
import moment from 'moment'
import classnames from 'classnames'

import {setEditingAnnotation} from 'src/shared/actions/annotations'

import {Annotation} from 'src/types'

interface TimeStampProps {
  time: number
}

const TimeStamp: SFC<TimeStampProps> = ({time}) => (
  <div className="annotation-tooltip--timestamp">
    {`${moment(time).format('YYYY/MM/DD HH:mm:ss.SS')}`}
  </div>
)

interface AnnotationState {
  isDragging: string | boolean
  isMouseOver: string | boolean
}

interface Props {
  annotation: Annotation
  timestamp: number
  onMouseLeave: (e: MouseEvent<HTMLDivElement>) => void
  annotationState: AnnotationState
  onSetEditingAnnotation: typeof setEditingAnnotation
}

const AnnotationTooltip: SFC<Props> = props => {
  const {
    annotation,
    onMouseLeave,
    timestamp,
    annotationState: {isDragging, isMouseOver},
    onSetEditingAnnotation,
  } = props

  const tooltipClass = classnames('annotation-tooltip', {
    hidden: !(isDragging || isMouseOver),
  })

  const setEditing = () => onSetEditingAnnotation(annotation.id)

  return (
    <div
      id={`tooltip-${annotation.id}`}
      onMouseLeave={onMouseLeave}
      className={tooltipClass}
    >
      {isDragging ? (
        <TimeStamp time={timestamp} />
      ) : (
        <div className="annotation-tooltip--items">
          <div>
            {annotation.text}
            <span
              className="annotation-tooltip--edit icon pencil"
              onClick={setEditing}
            />
          </div>
          <TimeStamp time={timestamp} />
        </div>
      )}
    </div>
  )
}

const mdtp = {
  onSetEditingAnnotation: setEditingAnnotation,
}

export default connect(null, mdtp)(AnnotationTooltip)
