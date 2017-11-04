import * as React from 'react'
import * as PropTypes from 'prop-types'
import classnames from 'classnames'

import ResizeHandle from 'shared/components/ResizeHandle'

const maximumNumChildren = 2
const defaultMinTopHeight = 200
const defaultMinBottomHeight = 200
const defaultInitialTopHeight = '50%'
const defaultInitialBottomHeight = '50%'

export interface ResizeContainerProps {
  children: React.ReactChildren
  containerClass: string
  minTopHeight?: number
  minBottomHeight?: number
  initialTopHeight?: string
  initialBottomHeight?: string
}

export interface ResizeContainerState {
  isDragging: boolean
  topHeight: string
  bottomHeight: string
  bottomHeightPixels: number
}

class ResizeContainer extends React.Component<
  ResizeContainerProps,
  ResizeContainerState
> {
  public static defaultProps = {
    minTopHeight: defaultMinTopHeight,
    minBottomHeight: defaultMinBottomHeight,
    initialTopHeight: defaultInitialTopHeight,
    initialBottomHeight: defaultInitialBottomHeight,
  }

  private resizeContainer
  private bottom

  constructor(props: ResizeContainerProps) {
    super(props)
    this.state = {
      isDragging: false,
      topHeight: props.initialTopHeight,
      bottomHeight: props.initialBottomHeight,
      bottomHeightPixels: 0,
    }
  }

  private handleStartDrag = () => {
    this.setState({isDragging: true})
  }

  private handleStopDrag = () => {
    this.setState({isDragging: false})
  }

  private handleMouseLeave = () => {
    this.setState({isDragging: false})
  }

  private handleDrag = e => {
    if (!this.state.isDragging) {
      return
    }

    const {minTopHeight, minBottomHeight} = this.props
    const oneHundred = 100
    const containerHeight = parseInt(
      getComputedStyle(this.resizeContainer).height,
      10
    )
    // verticalOffset moves the resize handle as many pixels as the page-heading is taking up.
    const verticalOffset = window.innerHeight - containerHeight
    const newTopPanelPercent = Math.ceil(
      (e.pageY - verticalOffset) / containerHeight * oneHundred
    )
    const newBottomPanelPercent = oneHundred - newTopPanelPercent

    // Don't trigger a resize unless the change in size is greater than minResizePercentage
    const minResizePercentage = 0.5
    if (
      Math.abs(newTopPanelPercent - parseFloat(this.state.topHeight)) <
      minResizePercentage
    ) {
      return
    }

    const topHeightPixels = newTopPanelPercent / oneHundred * containerHeight
    const bottomHeightPixels =
      newBottomPanelPercent / oneHundred * containerHeight

    // Don't trigger a resize if the new sizes are too small
    if (
      topHeightPixels < minTopHeight ||
      bottomHeightPixels < minBottomHeight
    ) {
      return
    }

    this.setState({
      topHeight: `${newTopPanelPercent}%`,
      bottomHeight: `${newBottomPanelPercent}%`,
      bottomHeightPixels,
    })
  }

  public componentDidMount() {
    this.setState({
      bottomHeightPixels: this.bottom.getBoundingClientRect().height,
    })
  }

  public render() {
    const {bottomHeightPixels, topHeight, bottomHeight, isDragging} = this.state
    const {containerClass, children} = this.props

    if (React.Children.count(children) > maximumNumChildren) {
      console.error(
        `There cannot be more than ${maximumNumChildren}' children in ResizeContainer`
      )
      return
    }

    return (
      <div
        className={classnames(`resize--container ${containerClass}`, {
          'resize--dragging': isDragging,
        })}
        onMouseLeave={this.handleMouseLeave}
        onMouseUp={this.handleStopDrag}
        onMouseMove={this.handleDrag}
        ref={r => (this.resizeContainer = r)}
      >
        <div className="resize--top" style={{height: topHeight}}>
          {React.cloneElement(children[0], {
            resizerBottomHeight: bottomHeightPixels,
          })}
        </div>
        <ResizeHandle
          isDragging={isDragging}
          onHandleStartDrag={this.handleStartDrag}
          top={topHeight}
        />
        <div
          className="resize--bottom"
          style={{height: bottomHeight, top: topHeight}}
          ref={r => (this.bottom = r)}
        >
          {React.cloneElement(children[1], {
            resizerBottomHeight: bottomHeightPixels,
          })}
        </div>
      </div>
    )
  }
}

export default ResizeContainer
