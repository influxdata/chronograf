import React, {Component, MouseEvent} from 'react'
import {withRouter, WithRouterProps} from 'react-router'
import classnames from 'classnames'
import {connect} from 'react-redux'
import uuid from 'uuid'

import AnnotationWindow from 'src/shared/components/AnnotationWindow'
import {
  addAnnotationAsync,
  setAddingAnnotation,
  addingAnnotationSuccess,
  mouseEnterTempAnnotation,
  mouseLeaveTempAnnotation,
} from 'src/shared/actions/annotations'
import {getTagsFromTagFilters} from 'src/shared/selectors/annotations'

import {DYGRAPH_CONTAINER_XLABEL_MARGIN} from 'src/shared/constants'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {Annotation, DygraphClass, Source} from 'src/types'

const INITIAL_X_COORD = 100

interface Props {
  dygraph: DygraphClass
  source: Source
  isTempHovering: boolean
  addingAnnotation: Annotation
  onAddAnnotationAsync: (url: string, a: Annotation) => void
  onSetAddingAnnotation: (a: Annotation) => void
  onAddingAnnotationSuccess: () => void
  onMouseEnterTempAnnotation: () => void
  onMouseLeaveTempAnnotation: () => void
  staticLegendHeight: number
  annotationTags: {
    [tagKey: string]: string
  }
}

interface State {
  isMouseOver: boolean
  gatherMode: string
}

@ErrorHandling
class NewAnnotation extends Component<Props & WithRouterProps, State> {
  public wrapperRef: React.RefObject<HTMLDivElement>
  constructor(props) {
    super(props)
    this.wrapperRef = React.createRef<HTMLDivElement>()
    this.state = {
      isMouseOver: false,
      gatherMode: 'startTime',
    }
  }

  public render() {
    const {
      dygraph,
      isTempHovering,
      addingAnnotation,
      addingAnnotation: {startTime, endTime},
      staticLegendHeight,
    } = this.props

    const initialTime = dygraph.toDataXCoord(INITIAL_X_COORD)
    const resolvedStartTime = startTime ? startTime : initialTime
    const resolvedEndTime = endTime ? endTime : initialTime

    const {isMouseOver} = this.state
    const crosshairOne = Math.max(-1000, dygraph.toDomXCoord(resolvedStartTime))
    const crosshairTwo = dygraph.toDomXCoord(resolvedEndTime)
    const crosshairHeight = `calc(100% - ${
      staticLegendHeight + DYGRAPH_CONTAINER_XLABEL_MARGIN
    }px)`

    const isDragging = resolvedStartTime !== resolvedEndTime
    const flagOneClass =
      crosshairOne < crosshairTwo
        ? 'annotation-span--left-flag dragging'
        : 'annotation-span--right-flag dragging'
    const flagTwoClass =
      crosshairOne < crosshairTwo
        ? 'annotation-span--right-flag dragging'
        : 'annotation-span--left-flag dragging'
    const pointFlagClass = 'annotation-point--flag__dragging'

    return (
      <div>
        {isDragging && (
          <AnnotationWindow
            annotation={addingAnnotation}
            dygraph={dygraph}
            active={true}
            staticLegendHeight={staticLegendHeight}
          />
        )}
        <div
          className={classnames('new-annotation', {
            hover: isTempHovering,
          })}
          ref={this.wrapperRef}
          onMouseMove={this.handleMouseMove}
          onMouseOver={this.handleMouseOver}
          onMouseLeave={this.handleMouseLeave}
          onMouseUp={this.handleMouseUp}
          onMouseDown={this.handleMouseDown}
        >
          {isDragging && (
            <div
              className="new-annotation--crosshair"
              style={{left: crosshairTwo, height: crosshairHeight}}
            >
              {isMouseOver &&
                isDragging &&
                this.renderTimestamp(resolvedEndTime)}
              <div className={flagTwoClass} />
            </div>
          )}
          <div
            className="new-annotation--crosshair"
            style={{left: crosshairOne, height: crosshairHeight}}
          >
            {isMouseOver &&
              !isDragging &&
              this.renderTimestamp(resolvedStartTime)}
            <div className={isDragging ? flagOneClass : pointFlagClass} />
          </div>
        </div>
      </div>
    )
  }

  private clampWithinGraphTimerange = (timestamp: number): number => {
    const [xRangeStart] = this.props.dygraph.xAxisRange()
    return Math.max(xRangeStart, timestamp)
  }

  private eventToTimestamp = ({
    pageX: pxBetweenMouseAndPage,
  }: MouseEvent<HTMLDivElement>): number => {
    const {
      left: pxBetweenGraphAndPage,
    } = this.wrapperRef.current.getBoundingClientRect()
    const graphXCoordinate = pxBetweenMouseAndPage - pxBetweenGraphAndPage
    const timestamp = this.props.dygraph.toDataXCoord(graphXCoordinate)
    const clamped = this.clampWithinGraphTimerange(timestamp)
    return clamped
  }

  private handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    const startTime = this.eventToTimestamp(e)
    this.props.onSetAddingAnnotation({
      ...this.props.addingAnnotation,
      startTime,
    })
    this.setState({gatherMode: 'endTime'})
  }

  private handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (this.props.isTempHovering === false) {
      return
    }

    const {addingAnnotation, onSetAddingAnnotation} = this.props
    const newTime = this.eventToTimestamp(e)

    if (this.state.gatherMode === 'startTime') {
      onSetAddingAnnotation({
        ...addingAnnotation,
        startTime: newTime,
        endTime: newTime,
      })
    } else {
      onSetAddingAnnotation({...addingAnnotation, endTime: newTime})
    }
  }

  private handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    const {
      addingAnnotation,
      onSetAddingAnnotation,
      onAddAnnotationAsync,
      onAddingAnnotationSuccess,
      onMouseLeaveTempAnnotation,
      source,
      annotationTags,
    } = this.props
    const createUrl = source.links.annotations

    const upTime = this.eventToTimestamp(e)
    const downTime = addingAnnotation.startTime
    const [startTime, endTime] = [downTime, upTime].sort()
    const newAnnotation = {
      ...addingAnnotation,
      startTime,
      endTime,
      tags: annotationTags,
    }

    onSetAddingAnnotation(newAnnotation)
    onAddAnnotationAsync(createUrl, {...newAnnotation, id: uuid.v4()})

    onAddingAnnotationSuccess()
    onMouseLeaveTempAnnotation()

    this.setState({
      isMouseOver: false,
      gatherMode: 'startTime',
    })
  }

  private handleMouseOver = (e: MouseEvent<HTMLDivElement>) => {
    this.setState({isMouseOver: true})
    this.handleMouseMove(e)
    this.props.onMouseEnterTempAnnotation()
  }

  private handleMouseLeave = () => {
    this.setState({isMouseOver: false})
    this.props.onMouseLeaveTempAnnotation()
  }

  private renderTimestamp(time: number): JSX.Element {
    const timestamp = `${new Date(time)}`

    return (
      <div className="new-annotation-tooltip">
        <span className="new-annotation-helper">Click or Drag to Annotate</span>
        <span className="new-annotation-timestamp">{timestamp}</span>
      </div>
    )
  }
}

const mstp = (state, ownProps) => {
  const {dashboardID} = ownProps.params

  // The new annotation will be created with tags derived from the current
  // dashboard's tag filters
  const annotationTags = getTagsFromTagFilters(state, dashboardID)

  return {annotationTags}
}

const mdtp = {
  onAddAnnotationAsync: addAnnotationAsync,
  onSetAddingAnnotation: setAddingAnnotation,
  onAddingAnnotationSuccess: addingAnnotationSuccess,
  onMouseEnterTempAnnotation: mouseEnterTempAnnotation,
  onMouseLeaveTempAnnotation: mouseLeaveTempAnnotation,
}

export default withRouter(connect(mstp, mdtp)(NewAnnotation))
