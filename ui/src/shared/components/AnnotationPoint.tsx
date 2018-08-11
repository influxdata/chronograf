import React, {Component, MouseEvent, DragEvent, CSSProperties} from 'react'
import classnames from 'classnames'
import {connect} from 'react-redux'

import {
  DYGRAPH_CONTAINER_H_MARGIN,
  DYGRAPH_CONTAINER_V_MARGIN,
  DYGRAPH_CONTAINER_XLABEL_MARGIN,
} from 'src/shared/constants'
import {ANNOTATION_MIN_DELTA, EDITING} from 'src/shared/annotations/helpers'
import * as actions from 'src/shared/actions/annotations'
import AnnotationTooltip from 'src/shared/components/AnnotationTooltip'
import {ErrorHandling} from 'src/shared/decorators/errors'

import {Annotation, DygraphClass} from 'src/types'

interface State {
  isMouseOver: boolean
  isDragging: boolean
}

interface Props {
  annotation: Annotation
  mode: string
  xAxisRange: [number, number]
  dygraph: DygraphClass
  updateAnnotation: (a: Annotation) => void
  updateAnnotationAsync: (a: Annotation) => void
  staticLegendHeight: number
}

@ErrorHandling
class AnnotationPoint extends Component<Props, State> {
  public static defaultProps: Partial<Props> = {
    staticLegendHeight: 0,
  }

  public state = {
    isMouseOver: false,
    isDragging: false,
  }

  public render() {
    const {annotation} = this.props

    return (
      <div className={this.markerClass} style={this.markerStyle}>
        <div
          className={this.clickClass}
          draggable={true}
          onDrag={this.handleDrag}
          onDragStart={this.handleDragStart}
          onDragEnd={this.handleDragEnd}
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
        />
        <div className={this.flagClass} />
        <AnnotationTooltip
          timestamp={annotation.startTime}
          annotation={annotation}
          onMouseLeave={this.handleMouseLeave}
          annotationState={this.state}
        />
      </div>
    )
  }

  private handleMouseEnter = () => {
    this.setState({isMouseOver: true})
  }

  private handleMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    const {annotation} = this.props
    if (e.relatedTarget instanceof Element) {
      if (e.relatedTarget.id === `tooltip-${annotation.id}`) {
        return this.setState({isDragging: false})
      }
    }
    this.setState({isMouseOver: false})
  }

  private handleDragStart = () => {
    this.setState({isDragging: true})
  }

  private handleDragEnd = () => {
    const {annotation, updateAnnotationAsync} = this.props
    updateAnnotationAsync(annotation)
    this.setState({isDragging: false})
  }

  private handleDrag = (e: DragEvent<HTMLDivElement>) => {
    if (this.props.mode !== EDITING) {
      return
    }

    const {pageX} = e
    const {annotation, dygraph, updateAnnotation} = this.props

    if (pageX === 0) {
      return
    }

    const {startTime} = annotation
    const {left} = dygraph.graphDiv.getBoundingClientRect()
    const [startX, endX] = dygraph.xAxisRange()

    const graphX = pageX - left
    let newTime = dygraph.toDataXCoord(graphX)
    const oldTime = +startTime

    if (
      Math.abs(
        dygraph.toPercentXCoord(newTime) - dygraph.toPercentXCoord(oldTime)
      ) *
        100 <
      ANNOTATION_MIN_DELTA
    ) {
      return
    }

    if (newTime >= endX) {
      newTime = endX
    }

    if (newTime <= startX) {
      newTime = startX
    }

    updateAnnotation({
      ...annotation,
      startTime: newTime,
      endTime: newTime,
    })

    e.preventDefault()
    e.stopPropagation()
  }

  private get markerStyle(): CSSProperties {
    const {annotation, dygraph, staticLegendHeight} = this.props

    const left = `${dygraph.toDomXCoord(Number(annotation.startTime)) +
      DYGRAPH_CONTAINER_H_MARGIN}px`

    const height = `calc(100% - ${staticLegendHeight +
      DYGRAPH_CONTAINER_XLABEL_MARGIN +
      DYGRAPH_CONTAINER_V_MARGIN * 2}px)`

    return {
      left,
      height,
    }
  }

  private get markerClass(): string {
    const {isDragging, isMouseOver} = this.state
    return classnames('annotation', {
      dragging: isDragging,
      expanded: isMouseOver,
    })
  }

  private get clickClass(): string {
    const isEditing = this.props.mode === EDITING

    return classnames('annotation--click-area', {editing: isEditing})
  }

  private get flagClass(): string {
    const {isDragging} = this.state

    if (isDragging) {
      return 'annotation-point--flag__dragging'
    }

    return 'annotation-point--flag'
  }
}

const mdtp = {
  updateAnnotationAsync: actions.updateAnnotationAsync,
  updateAnnotation: actions.updateAnnotation,
}

export default connect(null, mdtp)(AnnotationPoint)
