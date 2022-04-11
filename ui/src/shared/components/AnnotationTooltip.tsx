import React, {FunctionComponent, MouseEvent} from 'react'
import {connect} from 'react-redux'
import moment from 'moment'
import classnames from 'classnames'

import AnnotationTagsDropdown from 'src/shared/components/AnnotationTagsDropdown'
import {setEditingAnnotation} from 'src/shared/actions/annotations'

import {Annotation, Me} from 'src/types'
import {isUserAuthorized, VIEWER_ROLE} from 'src/auth/roles'

interface TimeStampProps {
  time: number
}

const TimeStamp: FunctionComponent<TimeStampProps> = ({time}) => (
  <div className="annotation-tooltip--timestamp">
    {`${moment(time).format('YYYY/MM/DD HH:mm:ss.SS')}`}
  </div>
)

interface AnnotationState {
  isDragging: string | boolean
  isMouseOver: string | boolean
}

interface Props {
  isUsingAuth: boolean
  me: Me
  annotation: Annotation
  timestamp: number
  onMouseLeave: (e: MouseEvent<HTMLDivElement>) => void
  annotationState: AnnotationState
  onSetEditingAnnotation: typeof setEditingAnnotation
}

const AnnotationTooltip: FunctionComponent<Props> = props => {
  const {
    annotation,
    onMouseLeave,
    timestamp,
    annotationState: {isDragging, isMouseOver},
    onSetEditingAnnotation,
    isUsingAuth,
    me,
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
          <div className="annotation-tooltip-text">
            {annotation.text}
            {isUsingAuth && isUserAuthorized(me, VIEWER_ROLE) ? (
              <span
                className="annotation-tooltip--edit icon pencil"
                onClick={setEditing}
              />
            ) : null}
          </div>
          <div className="annotation-tooltip--lower">
            <TimeStamp time={timestamp} />
            {!!annotation.tags && (
              <AnnotationTagsDropdown tags={annotation.tags} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const mstp = ({auth: {isUsingAuth, me}}) => ({
  isUsingAuth,
  me,
})
const mdtp = {
  onSetEditingAnnotation: setEditingAnnotation,
}

export default connect(mstp, mdtp)(AnnotationTooltip)
