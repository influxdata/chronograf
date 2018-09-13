// Libraries
import React, {PureComponent, CSSProperties} from 'react'
import Dygraph from 'src/shared/components/Dygraph'
import {withRouter, RouteComponentProps} from 'react-router'

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
import {DataTypes} from 'src/shared/components/RefreshingGraph'

interface Props {
  axes: Axes
  type: CellType
  queries: Query[]
  timeRange: TimeRange
  colors: ColorString[]
  loading: RemoteDataState
  decimalPlaces: DecimalPlaces
  data: TimeSeriesServerResponse[] | FluxTable[]
  dataType: DataTypes
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

  private isComponentMounted: boolean = false
  private isValidData: boolean = true

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
    dataType: DataTypes
  ) {
    try {
      const timeSeries = await this.convertToDygraphData(data, dataType)

      this.isValidData = await manager.validateDygraphData(
        timeSeries.timeSeries
      )
      if (!this.isComponentMounted) {
        return
      }

      this.setState({timeSeries})
    } catch (err) {
      this.isValidData = false
    }
  }

  public componentWillReceiveProps(nextProps: LineGraphProps) {
    if (nextProps.loading === RemoteDataState.Done) {
      this.parseTimeSeries(nextProps.data, nextProps.dataType)
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

    const options = {
      rightGap: 0,
      yRangePad: 10,
      labelsKMB: true,
      fillGraph: true,
      axisLabelWidth: 60,
      animatedZooms: true,
      drawAxesAtZero: true,
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
    dataType: DataTypes
  ): Promise<TimeSeriesToDyGraphReturnType> {
    const {location} = this.props

    if (dataType === DataTypes.influxQL) {
      return await timeSeriesToDygraph(
        data as TimeSeriesServerResponse[],
        location.pathname
      )
    }

    if (dataType === DataTypes.flux) {
      return await fluxTablesToDygraph(data as FluxTable[])
    }
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
