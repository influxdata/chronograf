import React, {Component} from 'react'
import {scaleLinear, ScaleLinear} from 'd3-scale'
import {range, extent} from 'd3-array'
import {line} from 'd3-shape'

import QueryManager, {Event} from 'src/perf/QueryManager'

import {clearCanvas} from 'src/perf/utils'

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

    const is = range(0, times.length)
    const plotters = series.map(s =>
      line()
        .x(i => xScale(times[i]))
        .y(i => yScale(s[i]))
        .context(ctx)
    )

    ctx.strokeStyle = '#e7e8eb'

    for (const plotter of plotters) {
      ctx.beginPath()
      plotter(is)
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
    const {margins} = this
    const data = this.props.queryManager.getTimeseries()

    return scaleLinear()
      .domain(extent(data.time))
      .range([margins.left, width - margins.right])
  }

  private get yScale(): ScaleLinear<number, number> {
    const {height} = this.props
    const {margins} = this
    const data = this.props.queryManager.getTimeseries()

    let min = Infinity
    let max = -Infinity

    for (const [key, datum] of Object.entries(data)) {
      if (key === 'time') {
        continue
      }

      const [datumMin, datumMax] = extent(datum)

      if (datumMin < min) {
        min = datumMin
      }

      if (datumMax > max) {
        max = datumMax
      }
    }

    return scaleLinear()
      .domain([min, max])
      .range([height - margins.bottom, margins.top])
  }

  private get margins() {
    return {top: 0, right: 0, bottom: 0, left: 0}
  }
}

export default Vis
