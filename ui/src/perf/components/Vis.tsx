import React, {PureComponent} from 'react'
import memoizeOne from 'memoize-one'

import DefaultDebouncer, {Debouncer} from 'src/shared/utils/debouncer'
import QueryManager, {Event} from 'src/perf/QueryManager'
import {
  clearCanvas,
  drawLine,
  drawAxes,
  createScale,
  calculateDomains,
  timeTicks,
  formatTimeTick,
} from 'src/perf/utils'

import {VisDimensions} from 'src/perf/types'

interface Props {
  queryManager: QueryManager
  width: number
  height: number
  timezone: string
  curve: string
}

interface State {
  isLoading: boolean
  dimensions?: VisDimensions
}

const SIMPLIFICATION_DEBOUNCE_TIME = 500
const LINE_COLOR = '#c6cad3'
const AXES_COLOR = '#383846'
const LABEL_COLOR = '#c6cad3'
const VALUE_SCALE_PADDING = 0.15

const fastCalculateDomains = memoizeOne(calculateDomains)

class Vis extends PureComponent<Props, State> {
  private canvas: React.RefObject<HTMLCanvasElement>
  private debouncer: Debouncer

  constructor(props) {
    super(props)

    this.state = {isLoading: true}
    this.canvas = React.createRef<HTMLCanvasElement>()
    this.debouncer = new DefaultDebouncer()
  }

  public componentDidMount() {
    const {queryManager} = this.props

    queryManager.subscribe(this.handleQueryManagerEvent)
    queryManager.refetch()
  }

  public componentWillUnmount() {
    this.props.queryManager.unsubscribe(this.handleQueryManagerEvent)
  }

  public componentDidUpdate(prevProps) {
    const {queryManager, width, height, timezone, curve} = this.props
    const {
      width: prevWidth,
      height: prevHeight,
      timezone: prevTimezone,
      curve: prevCurve,
    } = prevProps

    const dimensionsChanged = prevWidth !== width || prevHeight !== height
    const timezoneChanged = prevTimezone !== timezone
    const haveData = !!queryManager.getRawTimeseries()
    const curveChanged = prevCurve !== curve

    if ((curveChanged || timezoneChanged || dimensionsChanged) && haveData) {
      this.debouncer.call(this.simplify, SIMPLIFICATION_DEBOUNCE_TIME)
      this.setState({dimensions: this.calculateDimensions()}, this.renderCanvas)
    }
  }

  public render() {
    const {width, height} = this.props
    const {isLoading} = this.state

    const style = {width: `${width}px`, height: `${height}px`}

    if (isLoading) {
      return (
        <div className="perf-cell-vis" style={style}>
          <div className="perf-loading">Loading...</div>
        </div>
      )
    }

    return (
      <div className="perf-cell-vis" style={style}>
        <canvas ref={this.canvas} />
      </div>
    )
  }

  private renderCanvas() {
    const {dimensions} = this.state
    const data = this.props.queryManager.getTimeseries()
    const canvas = this.canvas.current

    if (!dimensions || !data || !canvas) {
      return
    }

    const {width, height} = dimensions
    const xTicks = this.xTicks()
    const yTicks = this.yTicks()
    const {curve} = this.props
    const context = canvas.getContext('2d')

    clearCanvas(canvas, width, height)

    context.strokeStyle = AXES_COLOR
    context.fillStyle = LABEL_COLOR
    drawAxes(context, dimensions, xTicks, yTicks)

    for (const [times, values] of data) {
      context.strokeStyle = LINE_COLOR
      drawLine(context, times, values, dimensions, curve)
    }

    console.log(`${Date.now()}\trendered graph`)
  }

  private handleQueryManagerEvent = (e: Event) => {
    if (e === 'FETCHING_DATA') {
      this.setState({isLoading: true})
    } else if (e === 'FETCHED_DATA') {
      this.setState({dimensions: this.calculateDimensions()}, this.simplify)
    } else if (e === 'SIMPLIFIED_DATA') {
      this.setState({isLoading: false}, this.renderCanvas)
    }
  }

  private calculateDimensions(): VisDimensions {
    const {width, height, queryManager, timezone} = this.props
    const margins = {top: 10, right: 10, bottom: 15, left: 30}
    const timeseries = queryManager.getRawTimeseries()
    const [xDomain, yDomain] = fastCalculateDomains(timeseries)
    const xTickFormatter = x => formatTimeTick(x, timezone, xDomain)
    const yTickFormatter = y => String(y)
    const xScale = createScale(xDomain, [margins.left, width - margins.right])
    const yScale = createScale(
      yDomain,
      [height - margins.bottom, margins.top],
      VALUE_SCALE_PADDING
    )

    return {
      width,
      height,
      margins,
      xDomain,
      yDomain,
      xTickFormatter,
      yTickFormatter,
      xScale,
      yScale,
    }
  }

  private simplify = () => {
    const {queryManager} = this.props
    const {dimensions} = this.state

    queryManager.simplify(dimensions)
  }

  private yTicks(): number[] {
    const {yScale, yDomain} = this.state.dimensions

    return yScale.ticks(4).filter(t => t > yDomain[0] && t < yDomain[1])
  }

  private xTicks(): number[] {
    const {
      xDomain: [t0, t1],
      margins: {left, right},
      width,
    } = this.state.dimensions

    return timeTicks(t0, t1, left, width - right)
  }
}

export default Vis
