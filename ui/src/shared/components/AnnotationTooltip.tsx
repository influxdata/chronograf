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
          <div className="annotation-tooltip-text">
            {annotation.text}
            <span
              className="annotation-tooltip--edit icon pencil"
              onClick={setEditing}
            />
          </div>
          <div className="annotation-tooltip--lower">
            <TimeStamp time={timestamp} />
            <div className="annotation-tag-count">
              6 Tags
              <div className="annotation-tooltip--tags">
                <div className="annotation-tooltip--tags-list">
                  <span>
                    <strong>Foo:</strong> Bar
                  </span>
                  <span>
                    <strong>Dinner:</strong> Crabshack
                  </span>
                  <span>
                    <strong>Foo:</strong> Baz
                  </span>
                  <span>
                    <strong>Crisis:</strong> Existential
                  </span>
                  <span>
                    <strong>Sporty:</strong> WeekendsOnly
                  </span>
                  <span>
                    <strong>EndOfDays:</strong> Tomorrow
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const mdtp = {
  onSetEditingAnnotation: setEditingAnnotation,
}

export default connect(null, mdtp)(AnnotationTooltip)
