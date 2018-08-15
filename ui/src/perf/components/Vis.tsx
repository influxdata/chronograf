import React, {Component} from 'react'
import {ScaleLinear} from 'd3-scale'

import QueryManager, {Event} from 'src/perf/QueryManager'

import {clearCanvas, drawLine, createScale} from 'src/perf/utils'

interface Props {
  queryManager: QueryManager
  width: number
  height: number
}

interface State {
  isLoading: boolean
}

class Vis extends Component<Props, State> {
  private canvas: React.RefObject<HTMLCanvasElement>

  constructor(props) {
    super(props)

    this.state = {isLoading: true}
    this.canvas = React.createRef<HTMLCanvasElement>()
  }

  public componentDidMount() {
    const {queryManager} = this.props

    queryManager.subscribe(this.handleQueryManagerEvent)
    queryManager.refetch()
  }

  public componentWillUnmount() {
    this.props.queryManager.unsubscribe(this.handleQueryManagerEvent)
  }

  public shouldComponentUpdate() {
    return true
  }

  public componentDidUpdate(prevProps) {
    const {queryManager} = this.props

    if (prevProps.queryManager !== queryManager) {
      queryManager.unsubscribe(this.handleQueryManagerEvent)
    }

    this.renderCanvas()
  }

  public render() {
    const {isLoading} = this.state

    if (isLoading) {
      return <div className="perf-loading">Loading...</div>
    }

    return <canvas ref={this.canvas} />
  }

  private renderCanvas() {
    const canvas = this.canvas.current

    if (!canvas) {
      return
    }

    const {width, height} = this.props
    const {xScale, yScale} = this
    const data = this.props.queryManager.getTimeseries()

    clearCanvas(canvas, width, height)

    const ctx = this.canvas.current.getContext('2d')
    const times = data.time
    const series = Object.entries(data)
      .filter(([key]) => key !== 'time')
      .map(([_, value]) => value)

    ctx.strokeStyle = '#e7e8eb'

    for (const s of series) {
      drawLine(ctx, xScale, yScale, times, s)
      ctx.stroke()
    }
  }

  private handleQueryManagerEvent = (e: Event) => {
    if (e === 'FETCHING_DATA') {
      this.setState({isLoading: true})
    } else if (e === 'FETCHED_DATA') {
      this.setState({isLoading: false})
    }
  }

  private get xScale(): ScaleLinear<number, number> {
    const {width} = this.props
    const {left, right} = this.margins
    const data = this.props.queryManager.getTimeseries()

    return createScale([data.time], width, left, right)
  }

  private get yScale(): ScaleLinear<number, number> {
    const {height} = this.props
    const {top, bottom} = this.margins
    const data = this.props.queryManager.getTimeseries()

    const valueData = Object.entries(data)
      .filter(([k]) => k !== 'time')
      .map(([_, v]) => v)

    return createScale(valueData, height, top, bottom, true)
  }

  private get margins() {
    return {top: 0, right: 0, bottom: 0, left: 0}
  }
}

export default Vis
