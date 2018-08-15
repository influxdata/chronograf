import React, {PureComponent} from 'react'

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

class Vis extends PureComponent<Props, State> {
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

  public componentDidUpdate(prevProps) {
    const {queryManager} = this.props

    if (prevProps.queryManager !== queryManager) {
      queryManager.unsubscribe(this.handleQueryManagerEvent)
    }

    this.renderCanvas()

    // TODO: Resimplify when dimensions change
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
    const {queryManager} = this.props

    if (e === 'FETCHING_DATA') {
      this.setState({isLoading: true})
    } else if (e === 'FETCHED_DATA') {
      const xScale = this.createXScale()
      const yScale = this.createYScale()

      this.setState({xScale, yScale}, () => {
        queryManager.simplify(xScale, yScale)
      })
    } else if (e === 'SIMPLIFIED_DATA') {
      this.setState({isLoading: false})
      this.renderCanvas()
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

  private get margins() {
    return {top: 0, right: 0, bottom: 0, left: 0}
  }
}

export default Vis
