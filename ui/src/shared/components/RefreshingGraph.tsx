// Libraries
import React, {Component} from 'react'
import {connect} from 'react-redux'
import _ from 'lodash'
import {AutoSizer} from 'react-virtualized'

// Components
import LineGraph from 'src/shared/components/LineGraph'
import GaugeChart from 'src/shared/components/GaugeChart'
import TableGraph from 'src/shared/components/TableGraph'
import SingleStat from 'src/shared/components/SingleStat'
import MarkdownCell from 'src/shared/components/MarkdownCell'
import TimeSeries from 'src/shared/components/time_series/TimeSeries'
import TimeMachineTables from 'src/flux/components/TimeMachineTables'
import RawFluxDataTable from 'src/shared/components/TimeMachine/RawFluxDataTable'
import TableGraphTransform from 'src/shared/components/TableGraphTransform'
import TableGraphFormat from 'src/shared/components/TableGraphFormat'
import AutoRefresh from 'src/shared/components/AutoRefresh'
import InvalidData from 'src/shared/components/InvalidData'

// Constants
import {emptyGraphCopy} from 'src/shared/copy/cell'
import {
  DEFAULT_TIME_FORMAT,
  DEFAULT_DECIMAL_PLACES,
} from 'src/dashboards/constants'
import {DataType} from 'src/shared/constants'

// Utils
import {AutoRefresher, GlobalAutoRefresher} from 'src/utils/AutoRefresher'
import {getDeep} from 'src/utils/wrappers'

// Actions
import {setHoverTime} from 'src/dashboards/actions'
import {notify} from 'src/shared/actions/notifications'

// Types
import {ColorString} from 'src/types/colors'
import {
  Source,
  Axes,
  TimeRange,
  Template,
  Query,
  CellType,
  FluxTable,
  RemoteDataState,
  QueryUpdateState,
  QueryType,
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
  queries: Query[]
  queryType: QueryType
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
  fluxASTLink: string
  onZoom: () => void
  editQueryStatus: () => void
  onSetResolution: () => void
  handleSetHoverTime: () => void
  onNotify: typeof notify
  grabDataForDownload?: GrabDataForDownloadHandler
  grabFluxData?: (data: string) => void
  cellNote: string
  cellNoteVisibility: NoteVisibility
  editorLocation?: QueryUpdateState
  onUpdateCellColors?: (bgColor: string, textColor: string) => void
  onUpdateFieldOptions?: (fieldOptions: FieldOption[]) => void
  onUpdateVisType?: (type: CellType) => Promise<void>
}

class RefreshingGraph extends Component<Props> {
  public static defaultProps: Partial<Props> = {
    inView: true,
    manualRefresh: 0,
    staticLegend: false,
    timeFormat: DEFAULT_TIME_FORMAT,
    decimalPlaces: DEFAULT_DECIMAL_PLACES,
    autoRefresher: GlobalAutoRefresher,
  }

  public shouldComponentUpdate(nextProps: Props) {
    return this.haveVisOptionsChanged(nextProps)
  }

  public render() {
    const {
      type,
      source,
      inView,
      queries,
      cellNote,
      onNotify,
      queryType,
      timeRange,
      templates,
      fluxASTLink,
      grabFluxData,
      manualRefresh,
      autoRefresher,
      showRawFluxData,
      editQueryStatus,
      cellNoteVisibility,
      grabDataForDownload,
    } = this.props

    if (this.shouldShowNoResults) {
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
      <AutoSizer>
        {({width, height}) => {
          if (width === 0) {
            return null
          }

          return (
            <AutoRefresh
              autoRefresh={autoRefresher}
              manualRefresh={manualRefresh}
            >
              {refreshingUUID => (
                <TimeSeries
                  uuid={refreshingUUID}
                  source={source}
                  inView={inView}
                  queries={this.queries}
                  timeRange={timeRange}
                  xPixels={width}
                  templates={templates}
                  fluxASTLink={fluxASTLink}
                  editQueryStatus={editQueryStatus}
                  onNotify={onNotify}
                  grabDataForDownload={grabDataForDownload}
                  grabFluxData={grabFluxData}
                >
                  {({
                    timeSeriesInfluxQL,
                    timeSeriesFlux,
                    rawFluxData,
                    loading,
                    isInitialFetch,
                    uuid,
                    errorMessage,
                  }) => {
                    if (isInitialFetch && loading === RemoteDataState.Loading) {
                      return (
                        <div className="graph-empty">
                          <h3 className="graph-spinner" />
                        </div>
                      )
                    }

                    if (
                      !this.hasValues(timeSeriesFlux, timeSeriesInfluxQL) &&
                      loading !== RemoteDataState.Loading
                    ) {
                      if (errorMessage && _.get(queries, '0.text', '').trim()) {
                        return <InvalidData message={errorMessage} />
                      }

                      if (
                        cellNoteVisibility === NoteVisibility.ShowWhenNoData
                      ) {
                        return <MarkdownCell text={cellNote} />
                      }

                      if (
                        this.isFluxQuery &&
                        !getDeep<string>(source, 'links.flux', null)
                      ) {
                        return (
                          <div className="graph-empty">
                            <p>The current source does not support Flux</p>
                          </div>
                        )
                      }

                      return (
                        <div className="graph-empty">
                          <p>No Results</p>
                        </div>
                      )
                    }

                    if (
                      showRawFluxData &&
                      queryType === QueryType.Flux &&
                      !_.isEmpty(rawFluxData)
                    ) {
                      return (
                        <RawFluxDataTable
                          csv={rawFluxData}
                          width={width}
                          height={height}
                        />
                      )
                    }

                    switch (type) {
                      case CellType.SingleStat:
                        return this.singleStat(
                          timeSeriesInfluxQL,
                          timeSeriesFlux
                        )
                      case CellType.Table:
                        return this.table(
                          timeSeriesInfluxQL,
                          timeSeriesFlux,
                          uuid,
                          width,
                          height
                        )
                      case CellType.Gauge:
                        return this.gauge(timeSeriesInfluxQL, timeSeriesFlux)
                      default:
                        return this.lineGraph(
                          timeSeriesInfluxQL,
                          timeSeriesFlux,
                          loading
                        )
                    }
                  }}
                </TimeSeries>
              )}
            </AutoRefresh>
          )
        }}
      </AutoSizer>
    )
  }

  private get isFluxQuery(): boolean {
    const {queryType} = this.props

    return queryType === QueryType.Flux
  }

  private get shouldShowNoResults(): boolean {
    const {queries} = this.props
    const isEmptyFluxQuery =
      this.isFluxQuery && _.get(queries, '0.text', '').trim() === ''

    return !queries.length || isEmptyFluxQuery
  }

  private hasValues(timeSeriesFlux, timeSeriesInfluxQL): boolean {
    const hasFluxValues = timeSeriesFlux.length
    const hasInfluxQLValues = timeSeriesInfluxQL.some(r =>
      _.get(r, 'response.results.0.series')
    )

    return hasFluxValues || hasInfluxQLValues
  }

  private haveVisOptionsChanged(prevProps: Props): boolean {
    const visProps: string[] = [
      'axes',
      'colors',
      'type',
      'tableOptions',
      'fieldOptions',
      'decimalPlaces',
      'timeFormat',
      'showRawFluxData',
      'queries',
      'templates',
      'manualRefresh',
      'timeRange',
      'inView',
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
      onUpdateVisType,
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
        onUpdateVisType={onUpdateVisType}
        onUpdateCellColors={onUpdateCellColors}
      />
    )
  }

  private table = (
    influxQLData: TimeSeriesServerResponse[],
    fluxData: FluxTable[],
    uuid: string,
    width: number,
    height: number
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
      onUpdateFieldOptions,
    } = this.props

    const {dataType, data} = this.getTypeAndData(influxQLData, fluxData)
    if (dataType === DataType.flux) {
      return (
        <TimeMachineTables
          data={data as FluxTable[]}
          uuid={uuid}
          dataType={dataType}
          colors={colors}
          width={width}
          height={height}
          key={manualRefresh}
          tableOptions={tableOptions}
          fieldOptions={fieldOptions}
          timeFormat={timeFormat}
          decimalPlaces={decimalPlaces}
          editorLocation={editorLocation}
          handleSetHoverTime={handleSetHoverTime}
          onUpdateFieldOptions={onUpdateFieldOptions}
        />
      )
    }

    return (
      <TableGraphTransform
        data={data as TimeSeriesServerResponse[]}
        uuid={uuid}
        dataType={dataType}
      >
        {(transformedData, nextUUID) => (
          <TableGraphFormat
            data={transformedData}
            uuid={nextUUID}
            dataType={dataType}
            tableOptions={tableOptions}
            fieldOptions={fieldOptions}
            timeFormat={timeFormat}
            decimalPlaces={decimalPlaces}
          >
            {(formattedData, sort, computedFieldOptions, onSort) => (
              <TableGraph
                data={formattedData}
                sort={sort}
                onSort={onSort}
                dataType={dataType}
                colors={colors}
                key={manualRefresh}
                tableOptions={tableOptions}
                fieldOptions={computedFieldOptions}
                timeFormat={timeFormat}
                decimalPlaces={decimalPlaces}
                editorLocation={editorLocation}
                handleSetHoverTime={handleSetHoverTime}
                onUpdateFieldOptions={onUpdateFieldOptions}
              />
            )}
          </TableGraphFormat>
        )}
      </TableGraphTransform>
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
      onUpdateVisType,
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
        onUpdateVisType={onUpdateVisType}
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

    return {dataType: DataType.influxQL, data: []}
  }
}

const mapStateToProps = ({links, annotations: {mode}}) => ({
  mode,
  fluxASTLink: links.flux.ast,
})

const mdtp = {
  handleSetHoverTime: setHoverTime,
  onNotify: notify,
}

export default connect(mapStateToProps, mdtp)(RefreshingGraph)
