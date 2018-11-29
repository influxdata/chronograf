// Libraries
import React, {PureComponent} from 'react'
import memoizeOne from 'memoize-one'

// Components
import Gauge from 'src/shared/components/Gauge'
import InvalidData from 'src/shared/components/InvalidData'

// Utils
import {manager} from 'src/worker/JobManager'
import {
  getDataUUID,
  hasDataPropsChanged,
  isFluxDataEqual,
  isInluxQLDataEqual,
} from 'src/shared/graphs/helpers'
import getLastValues from 'src/shared/parsing/lastValues'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {getDeep} from 'src/utils/wrappers'

// Constants
import {DEFAULT_GAUGE_COLORS} from 'src/shared/constants/thresholds'
import {stringifyColorValues} from 'src/shared/constants/colorOperations'
import {DASHBOARD_LAYOUT_ROW_HEIGHT} from 'src/shared/constants'
import {DataType} from 'src/shared/constants'

// Types
import {DecimalPlaces} from 'src/types/dashboards'
import {ColorString} from 'src/types/colors'
import {TimeSeriesServerResponse} from 'src/types/series'
import {FluxTable} from 'src/types/flux'

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
  fluxTablesToSingleStat?: typeof manager.fluxTablesToSingleStat
}

interface State {
  lastValues?: {
    values: number[] | string[]
    series: string[]
  }
  isValidData: boolean
}

@ErrorHandling
class GaugeChart extends PureComponent<Props, State> {
  public static defaultProps: Partial<Props> = {
    colors: stringifyColorValues(DEFAULT_GAUGE_COLORS),
    fluxTablesToSingleStat: manager.fluxTablesToSingleStat,
  }

  private isComponentMounted: boolean
  private lastUUID: string
  private memoizedTimeSeriesToSingleStat = memoizeOne(
    getLastValues,
    isInluxQLDataEqual
  )

  private memoizedFluxTablesToSingleStat: typeof manager.fluxTablesToSingleStat

  constructor(props: Props) {
    super(props)

    this.memoizedFluxTablesToSingleStat = memoizeOne(
      props.fluxTablesToSingleStat,
      isFluxDataEqual
    )

    this.state = {isValidData: true}
  }

  public async componentDidMount() {
    this.isComponentMounted = true
    this.lastUUID = getDataUUID(this.props.data, this.props.dataType)

    await this.dataToLastValues()
  }

  public async componentDidUpdate(prevProps: Props) {
    const isDataChanged = hasDataPropsChanged(prevProps, this.props)

    this.lastUUID = getDataUUID(this.props.data, this.props.dataType)

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
    const lastValue = getDeep<number | string>(lastValues, 'values.0', 0)

    switch (typeof lastValue) {
      case 'number':
      case 'string':
        return Number(lastValue)
      default:
        return 0
    }
  }

  private async dataToLastValues() {
    const {data, dataType} = this.props

    let lastValues
    let isValidData = true
    try {
      if (dataType === DataType.flux) {
        lastValues = await this.memoizedFluxTablesToSingleStat(
          data as FluxTable[]
        )
      } else if (dataType === DataType.influxQL) {
        lastValues = this.memoizedTimeSeriesToSingleStat(
          data as TimeSeriesServerResponse[]
        )
      }

      if (
        !this.isComponentMounted ||
        this.lastUUID !== getDataUUID(data, dataType)
      ) {
        return
      }
    } catch (err) {
      isValidData = false
    }
    this.setState({lastValues, isValidData})
  }
}

export default GaugeChart
