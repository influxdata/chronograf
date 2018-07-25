import React, {PureComponent} from 'react'
import _ from 'lodash'

import getLastValues from 'src/shared/parsing/lastValues'
import Gauge from 'src/shared/components/Gauge'

import {DEFAULT_GAUGE_COLORS} from 'src/shared/constants/thresholds'
import {stringifyColorValues} from 'src/shared/constants/colorOperations'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {DecimalPlaces} from 'src/types/dashboards'
import {ColorString} from 'src/types/colors'
import {TimeSeriesServerResponse} from 'src/types/series'

interface Props {
  data: TimeSeriesServerResponse[]
  decimalPlaces: DecimalPlaces
  colors?: ColorString[]
  prefix: string
  suffix: string
  resizerTopHeight?: number
  isResizing?: boolean
}

interface State {
  containerHeight: number
  containerWidth: number
}

@ErrorHandling
class GaugeChart extends PureComponent<Props, State> {
  public static defaultProps: Partial<Props> = {
    colors: stringifyColorValues(DEFAULT_GAUGE_COLORS),
  }

  private containerRef: HTMLDivElement

  constructor(props: Props) {
    super(props)

    this.state = {
      containerHeight: 600,
      containerWidth: 900,
    }
  }

  public componentDidMount() {
    this.getContainerDimensions()
    window.addEventListener('mousemove', this.handleResize)
  }

  public componentDidUpdate() {
    this.getContainerDimensions()
  }

  public componentWillUnmount() {
    window.removeEventListener('mousemove', this.handleResize)
  }

  public render() {
    const {colors, prefix, suffix, decimalPlaces} = this.props
    const {containerWidth, containerHeight} = this.state

    return (
      <div className="single-stat" ref={this.onRef}>
        <Gauge
          width={containerWidth}
          colors={colors}
          height={containerHeight}
          prefix={prefix}
          suffix={suffix}
          gaugePosition={this.lastValueForGauge}
          decimalPlaces={decimalPlaces}
        />
      </div>
    )
  }

  private onRef = (r: HTMLDivElement): void => {
    this.containerRef = r
  }

  private getContainerDimensions = (): void => {
    const {width, height} = this.containerRef.getBoundingClientRect()

    this.setState({
      containerWidth: width,
      containerHeight: height,
    })
  }

  private handleResize = (): void => {
    const {isResizing} = this.props

    if (isResizing) {
      this.getContainerDimensions()
    }
  }

  private get lastValueForGauge(): number {
    const {data} = this.props
    const {lastValues} = getLastValues(data)
    const lastValue = _.get(lastValues, 0, 0)

    if (!lastValue) {
      return 0
    }

    return lastValue
  }
}

export default GaugeChart
