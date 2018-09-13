import React, {PureComponent} from 'react'
import _ from 'lodash'

import {manager} from 'src/worker/JobManager'

import getLastValues from 'src/shared/parsing/lastValues'
import Gauge from 'src/shared/components/Gauge'

import {DEFAULT_GAUGE_COLORS} from 'src/shared/constants/thresholds'
import {stringifyColorValues} from 'src/shared/constants/colorOperations'
import {DASHBOARD_LAYOUT_ROW_HEIGHT} from 'src/shared/constants'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {DecimalPlaces} from 'src/types/dashboards'
import {ColorString} from 'src/types/colors'
import {TimeSeriesServerResponse} from 'src/types/series'
import {FluxTable} from 'src/types/flux'
import {DataTypes} from 'src/shared/components/RefreshingGraph'

interface Props {
  data: TimeSeriesServerResponse[] | FluxTable[]
  dataType: DataTypes
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
}

@ErrorHandling
class GaugeChart extends PureComponent<Props, State> {
  public static defaultProps: Partial<Props> = {
    colors: stringifyColorValues(DEFAULT_GAUGE_COLORS),
  }

  private isComponentMounted: boolean

  constructor(props: Props) {
    super(props)

    this.state = {}
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

    try {
      let lastValues
      if (dataType === DataTypes.flux) {
        lastValues = await manager.fluxTablesToSingleStat(data as FluxTable[])
      } else if (dataType === DataTypes.influxQL) {
        lastValues = getLastValues(data as TimeSeriesServerResponse[])
      }

      if (!this.isComponentMounted) {
        return
      }

      this.setState({lastValues})
    } catch (err) {
      console.error(err)
    }
  }
}

export default GaugeChart
