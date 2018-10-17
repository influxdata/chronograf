// Libraries
import React, {PureComponent, CSSProperties} from 'react'
import _ from 'lodash'
import Dygraph from 'src/shared/components/Dygraph'
import {withRouter, RouteComponentProps} from 'react-router'
import memoizeOne from 'memoize-one'

// Components
import SingleStat from 'src/shared/components/SingleStat'
import {ErrorHandlingWith} from 'src/shared/decorators/errors'
import InvalidData from 'src/shared/components/InvalidData'

// Utils
import {
  timeSeriesToDygraph,
  TimeSeriesToDyGraphReturnType,
} from 'src/utils/timeSeriesTransformers'
import {manager} from 'src/worker/JobManager'
import {fluxTablesToDygraph} from 'src/shared/parsing/flux/dygraph'
import {
  getDataUUID,
  hasDataPropsChanged,
  isFluxDataEqual,
  isInluxQLDataEqual,
} from 'src/shared/graphs/helpers'
import {getDurationInMilliseconds} from 'src/shared/parsing/flux/timeRange'

// Types
import {ColorString} from 'src/types/colors'
import {DecimalPlaces} from 'src/types/dashboards'
import {TimeSeriesServerResponse} from 'src/types/series'
import {
  Query,
  Axes,
  TimeRange,
  RemoteDataState,
  CellType,
  FluxTable,
} from 'src/types'
import {DataType} from 'src/shared/constants'

interface Props {
  axes: Axes
  type: CellType
  queries: Query[]
  timeRange: TimeRange
  colors: ColorString[]
  loading: RemoteDataState
  decimalPlaces: DecimalPlaces
  data: TimeSeriesServerResponse[] | FluxTable[]
  dataType: DataType
  cellID: string
  cellHeight: number
  staticLegend: boolean
  onZoom: () => void
  handleSetHoverTime: () => void
  activeQueryIndex?: number
}

type LineGraphProps = Props & RouteComponentProps<any, any>

interface State {
  timeSeries?: TimeSeriesToDyGraphReturnType
}

@ErrorHandlingWith(InvalidData)
class LineGraph extends PureComponent<LineGraphProps, State> {
  public static defaultProps: Partial<LineGraphProps> = {
    staticLegend: false,
  }
  private latestUUID: string

  private isComponentMounted: boolean = false
  private isValidData: boolean = true

  private memoizedTimeSeriesToDygraph = memoizeOne(
    timeSeriesToDygraph,
    isInluxQLDataEqual
  )
  private memoizedFluxTablesToDygraph = memoizeOne(
    fluxTablesToDygraph,
    isFluxDataEqual
  )

  constructor(props: LineGraphProps) {
    super(props)

    this.state = {}
  }

  public async componentDidMount() {
    this.isComponentMounted = true
    const {data, dataType} = this.props
    await this.parseTimeSeries(data, dataType)
  }

  public componentWillUnmount() {
    this.isComponentMounted = false
  }

  public async parseTimeSeries(
    data: TimeSeriesServerResponse[] | FluxTable[],
    dataType: DataType
  ) {
    let timeSeries
    this.latestUUID = getDataUUID(data, dataType)
    try {
      const {result, uuid} = await this.convertToDygraphData(data, dataType)

      timeSeries = result

      if (!this.isComponentMounted || uuid !== this.latestUUID) {
        return
      }

      this.isValidData = await manager.validateDygraphData(
        timeSeries.timeSeries
      )
    } catch (err) {
      this.isValidData = false
    }

    this.setState({timeSeries})
  }

  public componentDidUpdate(prevProps: LineGraphProps) {
    const isDataChanged = hasDataPropsChanged(prevProps, this.props)

    if (this.props.loading === RemoteDataState.Done && isDataChanged) {
      this.parseTimeSeries(this.props.data, this.props.dataType)
    }
  }

  public render() {
    if (!this.isValidData) {
      return <InvalidData />
    }
    const {
      data,
      axes,
      type,
      colors,
      cellID,
      onZoom,
      loading,
      queries,
      dataType,
      timeRange,
      cellHeight,
      staticLegend,
      decimalPlaces,
      handleSetHoverTime,
    } = this.props

    if (!this.state.timeSeries) {
      return <h3 className="graph-spinner" />
    }

    const {labels, timeSeries, dygraphSeries} = this.state.timeSeries

    const dateWindow = this.dateWindow

    const options = {
      rightGap: 0,
      yRangePad: 10,
      labelsKMB: true,
      fillGraph: true,
      axisLabelWidth: 60,
      animatedZooms: true,
      drawAxesAtZero: true,
      dateWindow,
      axisLineColor: '#383846',
      gridLineColor: '#383846',
      connectSeparatedPoints: true,
      stepPlot: type === 'line-stepplot',
      stackedGraph: type === 'line-stacked',
    }

    return (
      <div className="dygraph graph--hasYLabel" style={this.style}>
        {loading === RemoteDataState.Loading && <GraphLoadingDots />}
        <Dygraph
          type={type}
          axes={axes}
          cellID={cellID}
          colors={colors}
          onZoom={onZoom}
          labels={labels}
          queries={queries}
          options={options}
          timeRange={timeRange}
          timeSeries={timeSeries}
          staticLegend={staticLegend}
          dygraphSeries={dygraphSeries}
          isGraphFilled={this.isGraphFilled}
          containerStyle={this.containerStyle}
          handleSetHoverTime={handleSetHoverTime}
        >
          {type === CellType.LinePlusSingleStat && (
            <SingleStat
              data={data}
              dataType={dataType}
              lineGraph={true}
              colors={colors}
              prefix={this.prefix}
              suffix={this.suffix}
              cellHeight={cellHeight}
              decimalPlaces={decimalPlaces}
            />
          )}
        </Dygraph>
      </div>
    )
  }

  private get dateWindow(): [number, number] {
    const {timeRange} = this.props
    console.log('tr', timeRange)

    if (timeRange.lower && timeRange.upper) {
      return [Date.parse(timeRange.lower), Date.parse(timeRange.upper)]
    } else if (timeRange.lowerFlux) {
      // we have the string
      // sep the number from the unit
      const regexPattern = /(\d+)([a-zA-Z]+)/g
      const unitTimes: Array<{value: number; unit: string}> = []
      let continueLooping = true
      const tr = '-5m10s'
      console.log('lowerflux', tr)
      while (continueLooping) {
        const results = regexPattern.exec(tr)
        if (results && results.length >= 3) {
          const value = +results[1]
          const unit = results[2]
          unitTimes.push({unit, value})
        } else {
          continueLooping = false
        }
      }
      console.log('unitTimes', unitTimes)
      // translate that to milliseconds
      const durationMS = getDurationInMilliseconds(unitTimes)
      // calculate lower date in window based on that
      const upper = Number(new Date())
      const lower = upper - durationMS
      return [lower, upper]
    }
    return [Number(new Date()) - 5000000, Number(new Date())]
  }

  private get isGraphFilled(): boolean {
    const {type} = this.props

    if (type === CellType.LinePlusSingleStat) {
      return false
    }

    return true
  }

  private get style(): CSSProperties {
    return {height: '100%'}
  }

  private get prefix(): string {
    const {axes} = this.props

    if (!axes) {
      return ''
    }

    return axes.y.prefix
  }

  private get suffix(): string {
    const {axes} = this.props

    if (!axes) {
      return ''
    }

    return axes.y.suffix
  }

  private get containerStyle(): CSSProperties {
    return {
      width: 'calc(100% - 32px)',
      height: 'calc(100% - 16px)',
      position: 'absolute',
      top: '8px',
    }
  }

  private async convertToDygraphData(
    data: TimeSeriesServerResponse[] | FluxTable[],
    dataType: DataType
  ): Promise<{result: TimeSeriesToDyGraphReturnType; uuid: string}> {
    const {location} = this.props

    let result: TimeSeriesToDyGraphReturnType
    if (dataType === DataType.influxQL) {
      result = await this.memoizedTimeSeriesToDygraph(
        data as TimeSeriesServerResponse[],
        location.pathname
      )
    }

    if (dataType === DataType.flux) {
      result = await this.memoizedFluxTablesToDygraph(data as FluxTable[])
    }

    return {result, uuid: getDataUUID(data, dataType)}
  }
}

const GraphLoadingDots = () => (
  <div className="graph-panel__refreshing">
    <div />
    <div />
    <div />
  </div>
)

export default withRouter<Props>(LineGraph)
