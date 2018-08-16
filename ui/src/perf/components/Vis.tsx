import React, {PureComponent} from 'react'

import DefaultDebouncer, {Debouncer} from 'src/shared/utils/debouncer'
import QueryManager, {Event} from 'src/perf/QueryManager'
import {clearCanvas, drawLine, createScale} from 'src/perf/utils'

import {Scale} from 'src/perf/types'

interface Props {
  queryManager: QueryManager
  width: number
  height: number
}

interface State {
  isLoading: boolean
  xScale?: Scale
  yScale?: Scale
}

const SIMPLIFICATION_DEBOUNCE_TIME = 500

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
    const {queryManager, width, height} = this.props

    if (prevProps.queryManager !== queryManager) {
      prevProps.queryManager.unsubscribe(this.handleQueryManagerEvent)
      queryManager.subscribe(this.handleQueryManagerEvent)
      queryManager.refetch()

      return
    }

    if (
      (prevProps.width !== width || prevProps.height !== height) &&
      !!queryManager.getRawTimeseries()
    ) {
      this.debouncer.call(this.simplify, SIMPLIFICATION_DEBOUNCE_TIME)

      this.setState(
        {
          xScale: this.createXScale(),
          yScale: this.createYScale(),
        },
        this.renderCanvas
      )
    }
  }

  public render() {
    const {isLoading} = this.state

    if (isLoading) {
      return <div className="perf-loading">Loading...</div>
    }

    return <canvas ref={this.canvas} />
  }

  private renderCanvas() {
    const {width, height, queryManager} = this.props
    const {xScale, yScale} = this.state
    const canvas = this.canvas.current
    const data = queryManager.getTimeseries()

    if (!canvas || !xScale || !yScale || !data) {
      return
    }

    clearCanvas(canvas, width, height)

    const ctx = canvas.getContext('2d')

    ctx.strokeStyle = '#e7e8eb'

    for (const [times, values] of data) {
      drawLine(ctx, xScale, yScale, times, values)
      ctx.stroke()
    }
  }

  private handleQueryManagerEvent = (e: Event) => {
    if (e === 'FETCHING_DATA') {
      this.setState({isLoading: true})
    } else if (e === 'FETCHED_DATA') {
      this.setState(
        {
          xScale: this.createXScale(),
          yScale: this.createYScale(),
        },
        this.simplify
      )
    } else if (e === 'SIMPLIFIED_DATA') {
      this.setState({isLoading: false}, this.renderCanvas)
    }
  }

  private createXScale(): Scale {
    const {width, queryManager} = this.props
    const {left, right} = this.margins
    const timess = queryManager.getRawTimeseries().map(([times]) => times)

    return createScale(timess, width, left, right)
  }

  private createYScale(): Scale {
    const {height, queryManager} = this.props
    const {top, bottom} = this.margins
    const valuess = queryManager.getRawTimeseries().map(([_, values]) => values)

    return createScale(valuess, height, top, bottom, true)
  }

  private simplify = () => {
    const {queryManager} = this.props
    const {xScale, yScale} = this.state

    queryManager.simplify(xScale, yScale)
  }

  private get margins() {
    return {top: 0, right: 0, bottom: 0, left: 0}
  }
}

export default Vis
