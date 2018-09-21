import React, {PureComponent} from 'react'
import _ from 'lodash'

import {manager} from 'src/worker/JobManager'

import getLastValues from 'src/shared/parsing/lastValues'
import Gauge from 'src/shared/components/Gauge'
import InvalidData from 'src/shared/components/InvalidData'

import {DEFAULT_GAUGE_COLORS} from 'src/shared/constants/thresholds'
import {stringifyColorValues} from 'src/shared/constants/colorOperations'
import {DASHBOARD_LAYOUT_ROW_HEIGHT} from 'src/shared/constants'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {DecimalPlaces} from 'src/types/dashboards'
import {ColorString} from 'src/types/colors'
import {TimeSeriesServerResponse} from 'src/types/series'
import {FluxTable} from 'src/types/flux'
import {DataType} from 'src/shared/constants'

interface Props {
  data: TimeSeriesServerResponse[] | FluxTable[]
  dataType: DataType
  decimalPlaces: DecimalPlaces
  cellID: string
  cellHeight?: number
  colors?: ColorString[]
  prefix: string
  suffix: string
  resizerTopHeight?: number
}

interface State {
  lastValues?: {
    values: number[]
    series: string[]
  }
  isValidData: boolean
}

@ErrorHandling
class GaugeChart extends PureComponent<Props, State> {
  public static defaultProps: Partial<Props> = {
    colors: stringifyColorValues(DEFAULT_GAUGE_COLORS),
  }

  private isComponentMounted: boolean

  constructor(props: Props) {
    super(props)

    this.state = {isValidData: true}
  }

  public async componentDidMount() {
    this.isComponentMounted = true
    await this.dataToLastValues()
  }

  public async componentDidUpdate(prevProps: Props) {
    const isDataChanged =
      prevProps.dataType !== this.props.dataType ||
      !_.isEqual(prevProps.data, this.props.data)

    if (isDataChanged) {
      await this.dataToLastValues()
    }
  }

  public componentWillUnmount() {
    this.isComponentMounted = false
  }

  public render() {
    const {colors, prefix, suffix, decimalPlaces} = this.props
    if (!this.state.isValidData) {
      return <InvalidData />
    }

    if (!this.state.lastValues) {
      return <h3 className="graph-spinner" />
    }

    return (
      <div className="single-stat">
        <Gauge
          width="900"
          colors={colors}
          height={this.height}
          prefix={prefix}
          suffix={suffix}
          gaugePosition={this.lastValueForGauge}
          decimalPlaces={decimalPlaces}
        />
      </div>
    )
  }

  private get height(): string {
    const {resizerTopHeight} = this.props

    return (this.initialCellHeight || resizerTopHeight || 300).toString()
  }

  private get initialCellHeight(): string {
    const {cellHeight} = this.props

    if (cellHeight) {
      return (cellHeight * DASHBOARD_LAYOUT_ROW_HEIGHT).toString()
    }

    return null
  }

  private get lastValueForGauge(): number {
    const {lastValues} = this.state
    const lastValue = _.get(lastValues, 'values.0', 0)

    if (!lastValue) {
      return 0
    }

    return lastValue
  }

  private async dataToLastValues() {
    const {data, dataType} = this.props

    let lastValues
    let isValidData = true
    try {
      if (dataType === DataType.flux) {
        lastValues = await manager.fluxTablesToSingleStat(data as FluxTable[])
      } else if (dataType === DataType.influxQL) {
        lastValues = getLastValues(data as TimeSeriesServerResponse[])
      }

      if (!this.isComponentMounted) {
        return
      }
    } catch (err) {
      isValidData = false
    }
    this.setState({lastValues, isValidData})
  }
}

export default GaugeChart
