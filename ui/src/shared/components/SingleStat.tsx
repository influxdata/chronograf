// Libraries
import React, {PureComponent, CSSProperties} from 'react'
import classnames from 'classnames'
import _ from 'lodash'
import memoizeOne from 'memoize-one'

// Components
import InvalidData from 'src/shared/components/InvalidData'

// Utils
import {manager} from 'src/worker/JobManager'
import {
  SMALL_CELL_HEIGHT,
  getDataUUID,
  hasDataPropsChanged,
  isFluxDataEqual,
  isInluxQLDataEqual,
} from 'src/shared/graphs/helpers'
import getLastValues from 'src/shared/parsing/lastValues'
import {ErrorHandling} from 'src/shared/decorators/errors'

// Constants
import {DYGRAPH_CONTAINER_V_MARGIN} from 'src/shared/constants'
import {generateThresholdsListHexs} from 'src/shared/constants/colorOperations'
import {DataType} from 'src/shared/constants'

// types
import {ColorString} from 'src/types/colors'
import {CellType, DecimalPlaces} from 'src/types/dashboards'
import {TimeSeriesServerResponse} from 'src/types/series'
import {FluxTable} from 'src/types'
import {TimeMachineContainer} from 'src/shared/utils/TimeMachineContainer'

interface Props {
  decimalPlaces: DecimalPlaces
  cellHeight: number
  colors: ColorString[]
  prefix?: string
  suffix?: string
  lineGraph: boolean
  staticLegendHeight?: number
  data: TimeSeriesServerResponse[] | FluxTable[]
  dataType: DataType
  onUpdateCellColors?: (bgColor: string, textColor: string) => void
  onUpdateVisType?: TimeMachineContainer['handleUpdateType']
}

interface State {
  lastValues?: {
    values: number[]
    series: string[]
  }
  isValidData: boolean
}

const NOOP = () => {}

@ErrorHandling
class SingleStat extends PureComponent<Props, State> {
  public static defaultProps: Partial<Props> = {
    prefix: '',
    suffix: '',
    onUpdateCellColors: NOOP,
  }

  private isComponentMounted: boolean
  private lastUUID: string
  private memoizedTimeSeriesToSingleStat = memoizeOne(
    getLastValues,
    isInluxQLDataEqual
  )
  private memoizedFluxTablesToSingleStat = memoizeOne(
    manager.fluxTablesToSingleStat,
    isFluxDataEqual
  )

  constructor(props: Props) {
    super(props)

    this.state = {isValidData: true}
  }

  public async componentDidMount() {
    this.isComponentMounted = true
    this.lastUUID = getDataUUID(this.props.data, this.props.dataType)

    await this.dataToLastValues()
  }

  public async componentDidUpdate(prevProps: Props) {
    this.lastUUID = getDataUUID(this.props.data, this.props.dataType)
    const isDataChanged = hasDataPropsChanged(prevProps, this.props)

    if (isDataChanged) {
      await this.dataToLastValues()
    }
  }

  public componentWillUnmount() {
    this.isComponentMounted = false
  }

  public render() {
    if (!this.state.isValidData) {
      return <InvalidData onUpdateVisType={this.props.onUpdateVisType} />
    }
    if (!this.state.lastValues) {
      return <h3 className="graph-spinner" />
    }

    return (
      <div className="single-stat" style={this.containerStyle}>
        {this.resizerBox}
      </div>
    )
  }

  private get renderShadow(): JSX.Element {
    const {lineGraph} = this.props

    return lineGraph && <div className="single-stat--shadow" />
  }

  private get prefixSuffixValue(): string {
    const {prefix, suffix} = this.props

    return `${prefix}${this.roundedLastValue}${suffix}`
  }

  private get lastValue(): number {
    const {lastValues} = this.state

    if (lastValues) {
      const {values, series} = lastValues
      const firstAlphabeticalSeriesName = _.sortBy(series)[0]

      const firstAlphabeticalIndex = _.indexOf(
        series,
        firstAlphabeticalSeriesName
      )

      return values[firstAlphabeticalIndex]
    }
  }

  private get roundedLastValue(): string {
    const {decimalPlaces} = this.props

    if (this.lastValue === null) {
      return `${0}`
    }

    let roundedValue = `${this.lastValue}`

    if (decimalPlaces.isEnforced && _.isNumber(this.lastValue)) {
      roundedValue = this.lastValue.toFixed(decimalPlaces.digits)
    }

    return this.formatToLocale(+roundedValue)
  }

  private formatToLocale(n: number): string {
    const maximumFractionDigits = 20
    return n.toLocaleString(undefined, {maximumFractionDigits})
  }

  private get containerStyle(): CSSProperties {
    const {staticLegendHeight} = this.props

    const height = `calc(100% - ${staticLegendHeight +
      DYGRAPH_CONTAINER_V_MARGIN * 2}px)`

    const {backgroundColor} = this.coloration

    if (staticLegendHeight) {
      return {
        backgroundColor,
        height,
      }
    }

    return {
      backgroundColor,
    }
  }

  private get coloration(): CSSProperties {
    const {colors, lineGraph, onUpdateCellColors} = this.props
    const {lastValues} = this.state

    let lastValue: number = 0
    if (lastValues) {
      const {values, series} = lastValues
      const firstAlphabeticalSeriesName = _.sortBy(series)[0]

      const firstAlphabeticalIndex = _.indexOf(
        series,
        firstAlphabeticalSeriesName
      )
      lastValue = values[firstAlphabeticalIndex]
    }

    const {bgColor, textColor} = generateThresholdsListHexs({
      colors,
      lastValue,
      cellType: lineGraph ? CellType.LinePlusSingleStat : CellType.SingleStat,
    })

    onUpdateCellColors(bgColor, textColor)

    return {
      backgroundColor: bgColor,
      color: textColor,
    }
  }

  private get resizerBox(): JSX.Element {
    const {lineGraph, cellHeight} = this.props
    const {color} = this.coloration

    if (lineGraph) {
      const className = classnames('single-stat--value', {
        small: cellHeight <= SMALL_CELL_HEIGHT,
      })

      return (
        <span className={className} style={{color}}>
          {this.prefixSuffixValue}
          {this.renderShadow}
        </span>
      )
    }

    const viewBox = `0 0 ${this.prefixSuffixValue.length * 55} 100`

    return (
      <div className="single-stat--resizer">
        <svg width="100%" height="100%" viewBox={viewBox}>
          <text
            className="single-stat--text"
            fontSize="87"
            y="59%"
            x="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            style={{fill: color}}
          >
            {this.prefixSuffixValue}
          </text>
        </svg>
      </div>
    )
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

      if (typeof _.get(lastValues, 'values.0', null) !== 'number') {
        isValidData = false
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

export default SingleStat
