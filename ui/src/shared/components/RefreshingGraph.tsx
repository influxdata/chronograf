// Libraries
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import _ from 'lodash'

// Components
import LineGraph from 'src/shared/components/LineGraph'
import GaugeChart from 'src/shared/components/GaugeChart'
import TableGraph from 'src/shared/components/TableGraph'
import SingleStat from 'src/shared/components/SingleStat'
import MarkdownCell from 'src/shared/components/MarkdownCell'
import TimeSeries from 'src/shared/components/time_series/TimeSeries'
import TimeMachineTables from 'src/flux/components/TimeMachineTables'
import RawFluxDataTable from 'src/shared/components/TimeMachine/RawFluxDataTable'

// Constants
import {emptyGraphCopy} from 'src/shared/copy/cell'
import {
  DEFAULT_TIME_FORMAT,
  DEFAULT_DECIMAL_PLACES,
} from 'src/dashboards/constants'
import {DataType} from 'src/shared/constants'

// Utils
import {AutoRefresher} from 'src/utils/AutoRefresher'

// Actions
import {setHoverTime} from 'src/dashboards/actions'
import {notify} from 'src/shared/actions/notifications'

// Types
import {QueryUpdateState} from 'src/shared/actions/queries'
import {ColorString} from 'src/types/colors'
import {
  Source,
  Axes,
  TimeRange,
  Template,
  Query,
  CellType,
  Service,
  FluxTable,
  RemoteDataState,
} from 'src/types'
import {
  TableOptions,
  FieldOption,
  DecimalPlaces,
  NoteVisibility,
} from 'src/types/dashboards'
import {GrabDataForDownloadHandler} from 'src/types/layout'
import {TimeSeriesServerResponse} from 'src/types/series'

interface TypeAndData {
  dataType: DataType
  data: TimeSeriesServerResponse[] | FluxTable[]
}

interface Props {
  axes: Axes
  source: Source
  service: Service
  queries: Query[]
  timeRange: TimeRange
  colors: ColorString[]
  templates: Template[]
  showRawFluxData?: boolean
  tableOptions: TableOptions
  fieldOptions: FieldOption[]
  decimalPlaces: DecimalPlaces
  type: CellType
  cellID: string
  inView: boolean
  timeFormat: string
  cellHeight: number
  staticLegend: boolean
  autoRefresher: AutoRefresher
  manualRefresh: number
  resizerTopHeight: number
  onZoom: () => void
  editQueryStatus: () => void
  onSetResolution: () => void
  handleSetHoverTime: () => void
  onNotify: typeof notify
  grabDataForDownload?: GrabDataForDownloadHandler
  grabFluxData?: (data: FluxTable[]) => void
  cellNote: string
  cellNoteVisibility: NoteVisibility
  editorLocation?: QueryUpdateState
  onUpdateCellColors?: (bgColor: string, textColor: string) => void
}

class RefreshingGraph extends PureComponent<Props> {
  public static defaultProps: Partial<Props> = {
    inView: true,
    manualRefresh: 0,
    staticLegend: false,
    timeFormat: DEFAULT_TIME_FORMAT,
    decimalPlaces: DEFAULT_DECIMAL_PLACES,
  }

  private timeSeries: React.RefObject<TimeSeries> = React.createRef()

  public componentDidUpdate(prevProps) {
    if (!this.timeSeries.current) {
      return
    }

    if (this.props.editorLocation && this.haveVisOptionsChanged(prevProps)) {
      this.timeSeries.current.forceUpdate()
    }
  }

  public render() {
    const {
      type,
      source,
      inView,
      service,
      queries,
      cellNote,
      onNotify,
      timeRange,
      templates,
      grabFluxData,
      manualRefresh,
      autoRefresher,
      showRawFluxData,
      editQueryStatus,
      cellNoteVisibility,
      grabDataForDownload,
    } = this.props

    if (!queries.length) {
      return (
        <div className="graph-empty">
          <p data-test="data-explorer-no-results">{emptyGraphCopy}</p>
        </div>
      )
    }

    if (type === CellType.Note) {
      return <MarkdownCell text={cellNote} />
    }

    return (
      <TimeSeries
        ref={this.timeSeries}
        service={service}
        autoRefresher={autoRefresher}
        manualRefresh={manualRefresh}
        source={source}
        cellType={type}
        inView={inView}
        queries={this.queries}
        timeRange={timeRange}
        templates={templates}
        editQueryStatus={editQueryStatus}
        onNotify={onNotify}
        grabDataForDownload={grabDataForDownload}
        grabFluxData={grabFluxData}
        cellNote={cellNote}
        cellNoteVisibility={cellNoteVisibility}
      >
        {({timeSeriesInfluxQL, timeSeriesFlux, rawFluxData, loading}) => {
          if (showRawFluxData) {
            return <RawFluxDataTable csv={rawFluxData} />
          }

          switch (type) {
            case CellType.SingleStat:
              return this.singleStat(timeSeriesInfluxQL, timeSeriesFlux)
            case CellType.Table:
              return this.table(timeSeriesInfluxQL, timeSeriesFlux)
            case CellType.Gauge:
              return this.gauge(timeSeriesInfluxQL, timeSeriesFlux)
            default:
              return this.lineGraph(timeSeriesInfluxQL, timeSeriesFlux, loading)
          }
        }}
      </TimeSeries>
    )
  }

  private haveVisOptionsChanged(prevProps: Props): boolean {
    const visProps: string[] = [
      'axes',
      'colors',
      'tableOptions',
      'fieldOptions',
      'decimalPlaces',
      'timeFormat',
      'showRawFluxData',
    ]

    const prevVisValues = _.pick(prevProps, visProps)
    const curVisValues = _.pick(this.props, visProps)
    return !_.isEqual(prevVisValues, curVisValues)
  }

  private singleStat = (
    influxQLData: TimeSeriesServerResponse[],
    fluxData: FluxTable[]
  ): JSX.Element => {
    const {
      colors,
      cellHeight,
      decimalPlaces,
      manualRefresh,
      onUpdateCellColors,
    } = this.props

    const {dataType, data} = this.getTypeAndData(influxQLData, fluxData)

    return (
      <SingleStat
        dataType={dataType}
        data={data}
        colors={colors}
        prefix={this.prefix}
        suffix={this.suffix}
        lineGraph={false}
        key={manualRefresh}
        cellHeight={cellHeight}
        decimalPlaces={decimalPlaces}
        onUpdateCellColors={onUpdateCellColors}
      />
    )
  }

  private table = (
    influxQLData: TimeSeriesServerResponse[],
    fluxData: FluxTable[]
  ): JSX.Element => {
    const {
      colors,
      fieldOptions,
      timeFormat,
      tableOptions,
      decimalPlaces,
      manualRefresh,
      handleSetHoverTime,
      editorLocation,
    } = this.props

    const {dataType, data} = this.getTypeAndData(influxQLData, fluxData)
    if (dataType === DataType.flux) {
      return (
        <TimeMachineTables
          data={data as FluxTable[]}
          dataType={dataType}
          colors={colors}
          key={manualRefresh}
          tableOptions={tableOptions}
          fieldOptions={fieldOptions}
          timeFormat={timeFormat}
          decimalPlaces={decimalPlaces}
          editorLocation={editorLocation}
          handleSetHoverTime={handleSetHoverTime}
        />
      )
    }

    return (
      <TableGraph
        data={data}
        dataType={dataType}
        colors={colors}
        key={manualRefresh}
        tableOptions={tableOptions}
        fieldOptions={fieldOptions}
        timeFormat={timeFormat}
        decimalPlaces={decimalPlaces}
        editorLocation={editorLocation}
        handleSetHoverTime={handleSetHoverTime}
      />
    )
  }

  private gauge = (
    influxQLData: TimeSeriesServerResponse[],
    fluxData: FluxTable[]
  ): JSX.Element => {
    const {
      colors,
      cellID,
      cellHeight,
      decimalPlaces,
      manualRefresh,
      resizerTopHeight,
    } = this.props

    const {dataType, data} = this.getTypeAndData(influxQLData, fluxData)

    return (
      <GaugeChart
        data={data}
        dataType={dataType}
        cellID={cellID}
        colors={colors}
        prefix={this.prefix}
        suffix={this.suffix}
        key={manualRefresh}
        cellHeight={cellHeight}
        decimalPlaces={decimalPlaces}
        resizerTopHeight={resizerTopHeight}
      />
    )
  }

  private lineGraph = (
    influxQLData: TimeSeriesServerResponse[],
    fluxData: FluxTable[],
    loading: RemoteDataState
  ): JSX.Element => {
    const {
      axes,
      type,
      colors,
      onZoom,
      cellID,
      queries,
      timeRange,
      cellHeight,
      decimalPlaces,
      staticLegend,
      manualRefresh,
      handleSetHoverTime,
    } = this.props

    const {dataType, data} = this.getTypeAndData(influxQLData, fluxData)

    return (
      <LineGraph
        data={data}
        type={type}
        axes={axes}
        cellID={cellID}
        colors={colors}
        onZoom={onZoom}
        queries={queries}
        loading={loading}
        dataType={dataType}
        key={manualRefresh}
        timeRange={timeRange}
        cellHeight={cellHeight}
        staticLegend={staticLegend}
        decimalPlaces={decimalPlaces}
        handleSetHoverTime={handleSetHoverTime}
      />
    )
  }

  private get queries(): Query[] {
    const {queries, type} = this.props
    if (type === CellType.SingleStat) {
      return [queries[0]]
    }

    if (type === CellType.Gauge) {
      return [queries[0]]
    }

    return queries
  }

  private get prefix(): string {
    const {axes} = this.props

    return _.get(axes, 'y.prefix', '')
  }

  private get suffix(): string {
    const {axes} = this.props
    return _.get(axes, 'y.suffix', '')
  }

  private getTypeAndData(
    influxQLData: TimeSeriesServerResponse[],
    fluxData: FluxTable[]
  ): TypeAndData {
    if (influxQLData.length) {
      return {dataType: DataType.influxQL, data: influxQLData}
    }

    if (fluxData.length) {
      return {dataType: DataType.flux, data: fluxData}
    }
  }
}

const mapStateToProps = ({annotations: {mode}}) => ({
  mode,
})

const mdtp = {
  handleSetHoverTime: setHoverTime,
  onNotify: notify,
}

export default connect(mapStateToProps, mdtp)(RefreshingGraph)
