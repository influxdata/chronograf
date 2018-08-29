import React, {Component} from 'react'
import uuid from 'uuid'
import _ from 'lodash'
import moment from 'moment'
import {connect} from 'react-redux'
import {AutoSizer} from 'react-virtualized'
import {withRouter, InjectedRouter} from 'react-router'

import {searchToFilters} from 'src/logs/utils/search'
import {notify as notifyAction} from 'src/shared/actions/notifications'

import {Greys} from 'src/reusable_ui/types'
import QueryResults from 'src/logs/components/QueryResults'

const NOW = 0
const LOGS_FETCH_INTERVAL = 5000
const BACKWARD_VALUES_LIMIT = 100

import {
  setTableCustomTimeAsync,
  setTableRelativeTimeAsync,
  getSourceAndPopulateNamespacesAsync,
  setTimeRangeAsync,
  setTimeBounds,
  setTimeWindow,
  setTimeMarker,
  setNamespaceAsync,
  // executeQueriesAsync,
  addFilter,
  removeFilter,
  changeFilter,
  fetchOlderLogsAsync,
  fetchNewerLogsAsync,
  getLogConfigAsync,
  updateLogConfigAsync,
  clearTableData,
  clearNextTimeBounds,
  clearSearchData,
  setSearchStatus,
} from 'src/logs/actions'
import {getSourcesAsync} from 'src/shared/actions/sources'
import LogsHeader from 'src/logs/components/LogsHeader'
import HistogramChart from 'src/shared/components/HistogramChart'
import LogsGraphContainer from 'src/logs/components/LogsGraphContainer'
import OptionsOverlay from 'src/logs/components/OptionsOverlay'
import SearchBar from 'src/logs/components/LogsSearchBar'
import FilterBar from 'src/logs/components/LogsFilterBar'
import LogsTable from 'src/logs/components/LogsTable'
import {getDeep} from 'src/utils/wrappers'
import {colorForSeverity} from 'src/logs/utils/colors'
import OverlayTechnology from 'src/reusable_ui/components/overlays/OverlayTechnology'
import {SeverityFormatOptions, SEVERITY_SORTING_ORDER} from 'src/logs/constants'

import {Source, Namespace, NotificationAction} from 'src/types'

import {
  HistogramData,
  HistogramColor,
  HistogramDatum,
} from 'src/types/histogram'
import {
  Filter,
  SeverityLevelColor,
  SeverityFormat,
  LogsTableColumn,
  LogConfig,
  TableData,
  TimeRange,
  TimeWindow,
  TimeMarker,
  TimeBounds,
  SearchStatus,
} from 'src/types/logs'
import {
  applyChangesToTableData,
  isEmptyInfiniteData,
} from 'src/logs/utils/table'
import extentBy from 'src/utils/extentBy'
import {computeTimeBounds} from 'src/logs/utils/timeBounds'

interface Props {
  sources: Source[]
  currentSource: Source | null
  currentNamespaces: Namespace[]
  currentNamespace: Namespace
  getSourceAndPopulateNamespaces: (sourceID: string) => void
  getSources: () => void
  setTimeRangeAsync: (timeRange: TimeRange) => void
  setTimeBounds: (timeBounds: TimeBounds) => void
  setTimeWindow: (timeWindow: TimeWindow) => void
  setTimeMarker: (timeMarker: TimeMarker) => void
  setNamespaceAsync: (namespace: Namespace) => void
  // executeQueriesAsync: () => void
  setTableRelativeTime: (time: number) => void
  setTableCustomTime: (time: string) => void
  addFilter: (filter: Filter) => void
  removeFilter: (id: string) => void
  changeFilter: (id: string, operator: string, value: string) => void
  getConfig: (url: string) => Promise<void>
  updateConfig: (url: string, config: LogConfig) => Promise<void>
  notify: NotificationAction
  router: InjectedRouter
  newRowsAdded: number
  timeRange: TimeRange
  histogramData: HistogramData
  tableData: TableData
  filters: Filter[]
  queryCount: number
  logConfig: LogConfig
  logConfigLink: string
  tableInfiniteData: {
    forward: TableData
    backward: TableData
  }
  tableTime: {
    custom: string
    relative: number
  }
  fetchOlderLogsAsync: () => Promise<void>
  fetchNewerLogsAsync: () => Promise<void>
  nextOlderUpperBound: string
  searchStatus: SearchStatus
  clearSearchData: (searchStatus: SearchStatus) => void
  setSearchStatus: (SearchStatus: SearchStatus) => void
}

interface State {
  searchString: string
  liveUpdating: boolean
  isOverlayVisible: boolean
  histogramColors: HistogramColor[]
  hasScrolled: boolean
  backwardLogsLimit: number
}

class LogsPageSimple extends Component<Props, State> {
  public static getDerivedStateFromProps(props: Props, state: State) {
    const severityLevelColors: SeverityLevelColor[] = _.get(
      props.logConfig,
      'severityLevelColors',
      []
    )
    const histogramColors = severityLevelColors.map(lc => ({
      group: lc.level,
      color: lc.color,
    }))

    return {histogramColors}
  }

  private interval: number
  private loadingNewer: boolean = false

  constructor(props: Props) {
    super(props)

    this.state = {
      searchString: '',
      liveUpdating: false,
      isOverlayVisible: false,
      histogramColors: [],
      hasScrolled: false,
      backwardLogsLimit: BACKWARD_VALUES_LIMIT,
    }
  }

  public async componentDidUpdate(prevProps: Props) {
    // const {router} = this.props
    // if (!this.props.sources || this.props.sources.length === 0) {
    //   return router.push(`/sources/new?redirectPath=${location.pathname}`)
    // }
    // if (this.liveUpdatingStatus === false && this.interval) {
    //   clearInterval(this.interval)
    //   this.interval = null
    // }
    const isSearchStatusUpdated =
      prevProps.searchStatus !== this.props.searchStatus
    const {searchStatus, tableInfiniteData} = this.props

    switch (searchStatus) {
      case SearchStatus.Clearing:
      case SearchStatus.Paused:
      case SearchStatus.Loaded:
        break
      default:
        if (!isEmptyInfiniteData(tableInfiniteData)) {
          this.props.setSearchStatus(SearchStatus.Loaded)
        }
    }

    if (isSearchStatusUpdated) {
      const isPaused = searchStatus === SearchStatus.Paused
      const isReady =
        prevProps.searchStatus === SearchStatus.Cleared && !isPaused

      if (this.isClearingSearch || isPaused) {
        clearInterval(this.interval)
      } else if (isReady) {
        this.fetchNewDataset()
      }
    }
  }

  public async componentDidMount() {
    await this.props.getSources()
    await this.setCurrentSource()

    await this.props.getConfig(this.logConfigLink)

    this.updateTableData(SearchStatus.Loading)

    // if (getDeep<string>(this.props, 'timeRange.timeOption', '') === 'now') {
    //   this.startNewerLogsFetchingInterval()
    // }
  }

  public componentWillUnmount() {
    clearInterval(this.interval)
  }

  public render() {
    const {
      filters,
      queryCount,
      timeRange,
      notify,
      nextOlderUpperBound,
      searchStatus,
    } = this.props

    return (
      <>
        <div className="page">
          {this.header}
          <div className="page-contents logs-viewer">
            {/* <QueryResults
              count={this.histogramTotal}
              queryCount={queryCount}
              searchStatus={searchStatus}
              nextOlderUpperBound={nextOlderUpperBound}
            /> */}
            {/* <LogsGraphContainer>{this.chart}</LogsGraphContainer> */}
            <SearchBar onSearch={this.handleSubmitSearch} />
            <FilterBar
              filters={filters || []}
              onDelete={this.handleFilterDelete}
              onFilterChange={this.handleFilterChange}
            />
            <LogsTable
              count={this.histogramTotal}
              queryCount={queryCount}
              data={this.tableData}
              onScrollVertical={this.handleVerticalScroll}
              onScrolledToTop={this.handleScrollToTop}
              isScrolledToTop={false}
              isTruncated={this.isTruncated}
              onTagSelection={this.handleTagSelection}
              fetchMore={this.handleFetchMore}
              fetchNewer={this.fetchNewerLogs}
              timeRange={timeRange}
              scrollToRow={this.tableScrollToRow}
              tableColumns={this.tableColumns}
              severityFormat={this.severityFormat}
              severityLevelColors={this.severityLevelColors}
              hasScrolled={this.state.hasScrolled}
              tableInfiniteData={this.props.tableInfiniteData}
              onChooseCustomTime={this.handleChooseCustomTime}
              onExpandMessage={this.handleExpandMessage}
              notify={notify}
              searchStatus={searchStatus}
              filters={filters}
              nextOlderUpperBound={nextOlderUpperBound}
            />
          </div>
        </div>
        {this.renderImportOverlay()}
      </>
    )
  }

  private setCurrentSource = async () => {
    if (!this.props.currentSource && this.props.sources.length > 0) {
      const source =
        this.props.sources.find(src => {
          return src.default
        }) || this.props.sources[0]

      return await this.props.getSourceAndPopulateNamespaces(source.id)
    }
  }

  private handleExpandMessage = () => {
    this.setState({liveUpdating: false})
  }

  private startOlderLogsFetching = () => {
    this.fetchOlderLogs()
  }

  private startNewerLogsFetchingInterval = () => {
    // console.log('startNewerLogsFetchingInterval')
    if (this.interval) {
      clearInterval(this.interval)
    }

    this.interval = window.setInterval(
      this.handleNewerLogsFetchingInterval,
      LOGS_FETCH_INTERVAL
    )
    this.setState({liveUpdating: true})
  }

  private handleNewerLogsFetchingInterval = async () => {
    switch (this.props.searchStatus) {
      case SearchStatus.Clearing:
      case SearchStatus.Paused:
      case SearchStatus.None:
        return
    }
    // console.log('handleNewerLogsFetchingInterval')
    await this.fetchNewerLogs()
  }

  private fetchNewerLogs = async () => {
    await this.props.fetchNewerLogsAsync()
  }

  private fetchOlderLogs = async () => {
    switch (this.props.searchStatus) {
      case SearchStatus.Clearing:
      case SearchStatus.None:
        return
    }

    const totalBackwardValues = getDeep<number | null>(
      this.props,
      'tableInfiniteData.backward.values.length',
      null
    )

    await this.props.fetchOlderLogsAsync()

    if (
      totalBackwardValues !== null &&
      totalBackwardValues < this.backwardLogsLimit
    ) {
      await this.fetchOlderLogs()
    }
  }

  private handleFetchMore = () => {
    console.log('FETCHING MORE TABLE LOGS')
    const totalBackwardValues = getDeep<number | null>(
      this.props,
      'tableInfiniteData.backward.values.length',
      null
    )

    if (totalBackwardValues < this.backwardLogsLimit) {
      return
    }

    const backwardLogsLimit = this.backwardLogsLimit + BACKWARD_VALUES_LIMIT

    this.setState({
      backwardLogsLimit,
    })

    this.startOlderLogsFetching()
  }

  private get backwardLogsLimit() {
    console.log(' CURRRENT BACK LIMIT', this.state.backwardLogsLimit)
    return this.state.backwardLogsLimit
  }

  private get tableScrollToRow() {
    if (this.liveUpdatingStatus === true) {
      return 0
    }

    if (this.loadingNewer && this.props.newRowsAdded) {
      this.loadingNewer = false
      return this.props.newRowsAdded || 0
    }

    if (this.state.hasScrolled) {
      return
    }

    return Math.max(
      _.get(this.props, 'tableInfiniteData.forward.values.length', 0) - 3,
      0
    )
  }

  private handleChooseCustomTime = async (time: string) => {
    this.props.setTableCustomTime(time)
    const liveUpdating = false

    this.setState({
      hasScrolled: false,
      liveUpdating,
    })

    await this.props.setTimeMarker({
      timeOption: time,
    })

    this.handleSetTimeBounds()
  }

  private handleChooseRelativeTime = async (time: number) => {
    this.props.setTableRelativeTime(time)
    this.setState({hasScrolled: false})

    let timeOption = {
      timeOption: moment()
        .subtract(time, 'seconds')
        .toISOString(),
    }

    let liveUpdating = false
    if (time === NOW) {
      timeOption = {timeOption: 'now'}
      liveUpdating = true
    }

    this.setState({liveUpdating})
    await this.props.setTimeMarker(timeOption)
    this.handleSetTimeBounds()
  }

  private get tableData(): TableData {
    const forwardData = applyChangesToTableData(
      this.props.tableInfiniteData.forward,
      this.tableColumns
    )

    const backwardData = applyChangesToTableData(
      this.props.tableInfiniteData.backward,
      this.tableColumns
    )

    const data = {
      columns: forwardData.columns,
      values: [...forwardData.values, ...backwardData.values],
    }
    return data
  }

  private get isClearingSearch(): boolean {
    return this.props.searchStatus === SearchStatus.Clearing
  }

  private get logConfigLink(): string {
    return this.props.logConfigLink
  }

  private get tableColumns(): LogsTableColumn[] {
    const {logConfig} = this.props
    return _.get(logConfig, 'tableColumns', [])
  }

  private handleScrollToTop = () => {
    if (!this.state.liveUpdating) {
      this.startNewerLogsFetchingInterval()
    }
  }

  private handleVerticalScroll = () => {
    if (this.state.liveUpdating) {
      clearInterval(this.interval)
    }
    this.setState({liveUpdating: false, hasScrolled: true})
  }

  private handleTagSelection = (selection: {tag: string; key: string}) => {
    this.props.addFilter({
      id: uuid.v4(),
      key: selection.key,
      value: selection.tag,
      operator: '==',
    })
    this.updateTableData(SearchStatus.UpdatingFilters)
  }

  private get histogramTotal(): number {
    const {histogramData} = this.props

    return _.sumBy(histogramData, 'value')
  }

  private get chart(): JSX.Element {
    const {
      histogramData,
      timeRange: {timeOption},
    } = this.props
    const {histogramColors} = this.state

    return (
      <AutoSizer>
        {({width, height}) => (
          <HistogramChart
            data={histogramData}
            width={width}
            height={height}
            colorScale={colorForSeverity}
            colors={histogramColors}
            onBarClick={this.handleBarClick}
            sortBarGroups={this.handleSortHistogramBarGroups}
          >
            {({xScale, adjustedHeight, margins}) => {
              const x = xScale(new Date(timeOption).valueOf())
              const y1 = margins.top
              const y2 = margins.top + adjustedHeight
              const textSize = 11
              const markerSize = 5
              const labelSize = 100

              if (timeOption === 'now') {
                return null
              } else {
                const lineContainerWidth = 3
                const lineWidth = 1

                return (
                  <>
                    <svg
                      width={lineContainerWidth}
                      height={height}
                      style={{
                        position: 'absolute',
                        left: `${x}px`,
                        top: '0px',
                        transform: 'translateX(-50%)',
                      }}
                    >
                      <line
                        x1={(lineContainerWidth - lineWidth) / 2}
                        x2={(lineContainerWidth - lineWidth) / 2}
                        y1={y1 + markerSize / 2}
                        y2={y2}
                        stroke={Greys.White}
                        strokeWidth={`${lineWidth}`}
                      />
                    </svg>
                    <svg
                      width={x}
                      height={textSize + textSize / 2}
                      style={{
                        position: 'absolute',
                        left: `${x - markerSize - labelSize}px`,
                      }}
                    >
                      <text
                        style={{fontSize: textSize, fontWeight: 600}}
                        x={0}
                        y={textSize}
                        height={textSize}
                        fill={Greys.Sidewalk}
                      >
                        Current Timestamp
                      </text>
                      <ellipse
                        cx={labelSize + markerSize - 0.5}
                        cy={textSize / 2 + markerSize / 2}
                        rx={markerSize / 2}
                        ry={markerSize / 2}
                        fill={Greys.White}
                      />
                      <text
                        style={{fontSize: textSize, fontWeight: 600}}
                        x={labelSize + markerSize / 2 + textSize}
                        y={textSize}
                        height={textSize}
                        fill={Greys.Sidewalk}
                      >
                        {moment(timeOption).format('YYYY-MM-DD | HH:mm:ss.SSS')}
                      </text>
                    </svg>
                  </>
                )
              }
            }}
          </HistogramChart>
        )}
      </AutoSizer>
    )
  }

  private handleSortHistogramBarGroups = (
    a: HistogramDatum,
    b: HistogramDatum
  ): number => {
    return SEVERITY_SORTING_ORDER[b.group] - SEVERITY_SORTING_ORDER[a.group]
  }

  private get header(): JSX.Element {
    const {
      sources,
      currentSource,
      currentNamespaces,
      currentNamespace,
      timeRange,
      tableTime,
    } = this.props

    return (
      <LogsHeader
        timeRange={timeRange}
        onSetTimeWindow={this.handleSetTimeWindow}
        liveUpdating={this.isLiveUpdating}
        availableSources={sources}
        onChooseSource={this.handleChooseSource}
        onChooseNamespace={this.handleChooseNamespace}
        currentSource={currentSource}
        currentNamespaces={currentNamespaces}
        currentNamespace={currentNamespace}
        onChangeLiveUpdatingStatus={this.handleChangeLiveUpdatingStatus}
        onShowOptionsOverlay={this.handleToggleOverlay}
        customTime={tableTime.custom}
        relativeTime={tableTime.relative}
        onChooseCustomTime={this.handleChooseCustomTime}
        onChooseRelativeTime={this.handleChooseRelativeTime}
      />
    )
  }

  private get severityLevelColors(): SeverityLevelColor[] {
    return _.get(this.props.logConfig, 'severityLevelColors', [])
  }

  private handleChangeLiveUpdatingStatus = async (): Promise<void> => {
    switch (this.props.searchStatus) {
      case SearchStatus.Paused:
        return this.handleChooseRelativeTime(NOW)
      default:
        this.props.setSearchStatus(SearchStatus.Paused)
    }
  }

  private handleSubmitSearch = async (value: string): Promise<void> => {
    searchToFilters(value).forEach(filter => {
      this.props.addFilter(filter)
    })

    this.updateTableData(SearchStatus.Loading)
  }

  private handleFilterDelete = (id: string): void => {
    this.props.removeFilter(id)

    this.updateTableData(SearchStatus.UpdatingFilters)
  }

  private handleFilterChange = async (
    id: string,
    operator: string,
    value: string
  ): Promise<void> => {
    this.props.changeFilter(id, operator, value)
    this.updateTableData(SearchStatus.UpdatingFilters)
  }

  private handleBarClick = (time: string): void => {
    const formattedTime = moment(time).toISOString()

    this.handleChooseCustomTime(formattedTime)
  }

  private handleSetTimeBounds = async () => {
    const {seconds, windowOption, timeOption} = _.get(this.props, 'timeRange', {
      seconds: null,
      windowOption: null,
      timeOption: null,
    })

    const timeBounds: TimeBounds = {
      lower: `now() - ${windowOption}`,
      upper: null,
    }

    // if (timeOption !== 'now') {
    //   const extentTimes = extentBy(this.props.histogramData, d => d.time).map(
    //     d => d.time
    //   )

    //   timeBounds = computeTimeBounds(extentTimes, timeOption, seconds)
    // }

    await this.props.setTimeBounds(timeBounds)

    // this.props.setTimeRangeAsync(this.props.timeRange)

    this.updateTableData(SearchStatus.UpdatingTimeBounds)
  }

  private handleSetTimeWindow = async (timeWindow: TimeWindow) => {
    await this.props.setTimeWindow(timeWindow)
    this.handleSetTimeBounds()
  }

  private handleChooseSource = (sourceID: string) => {
    this.props.getSourceAndPopulateNamespaces(sourceID)
  }

  private handleChooseNamespace = (namespace: Namespace) => {
    this.props.setNamespaceAsync(namespace)
  }

  // private fetchSearchDataset = async (
  //   searchStatus: SearchStatus
  // ): Promise<void> => {
  //   // this.fetchNewDataset(searchStatus)
  // }

  private updateTableData(searchStatus) {
    this.props.clearSearchData(searchStatus)
  }

  private fetchNewDataset() {
    this.setState({backwardLogsLimit: BACKWARD_VALUES_LIMIT})
    this.startNewerLogsFetchingInterval()
   // this.startOlderLogsFetching()
  }

  private handleToggleOverlay = (): void => {
    this.setState({isOverlayVisible: !this.state.isOverlayVisible})
  }

  private renderImportOverlay = (): JSX.Element => {
    const {isOverlayVisible} = this.state

    return (
      <OverlayTechnology visible={isOverlayVisible}>
        <OptionsOverlay
          severityLevelColors={this.severityLevelColors}
          onUpdateSeverityLevels={this.handleUpdateSeverityLevels}
          onDismissOverlay={this.handleToggleOverlay}
          columns={this.tableColumns}
          onUpdateColumns={this.handleUpdateColumns}
          onUpdateSeverityFormat={this.handleUpdateSeverityFormat}
          severityFormat={this.severityFormat}
          onUpdateTruncation={this.handleUpdateTruncation}
          isTruncated={this.isTruncated}
        />
      </OverlayTechnology>
    )
  }

  private handleUpdateSeverityLevels = async (
    severityLevelColors: SeverityLevelColor[]
  ): Promise<void> => {
    const {logConfig} = this.props
    await this.props.updateConfig(this.logConfigLink, {
      ...logConfig,
      severityLevelColors,
    })
  }

  private handleUpdateSeverityFormat = async (
    format: SeverityFormat
  ): Promise<void> => {
    const {logConfig} = this.props
    await this.props.updateConfig(this.logConfigLink, {
      ...logConfig,
      severityFormat: format,
    })
  }

  private get severityFormat(): SeverityFormat {
    const {logConfig} = this.props
    const severityFormat = _.get(
      logConfig,
      'severityFormat',
      SeverityFormatOptions.dotText
    )
    return severityFormat
  }

  private handleUpdateColumns = async (
    tableColumns: LogsTableColumn[]
  ): Promise<void> => {
    const {logConfig} = this.props
    await this.props.updateConfig(this.logConfigLink, {
      ...logConfig,
      tableColumns,
    })
  }

  private handleUpdateTruncation = async (
    isTruncated: boolean
  ): Promise<void> => {
    const {logConfig} = this.props

    await this.props.updateConfig(this.logConfigLink, {
      ...logConfig,
      isTruncated,
    })
  }

  private get isTruncated(): boolean {
    return this.props.logConfig.isTruncated
  }

  private get isLiveUpdating(): boolean {
    return this.props.searchStatus !== SearchStatus.Paused
  }
}

const mapStateToProps = ({
  sources,
  links: {
    orgConfig: {logViewer},
  },
  logs: {
    newRowsAdded,
    currentSource,
    currentNamespaces,
    timeRange,
    currentNamespace,
    histogramData,
    tableData,
    filters,
    queryCount,
    logConfig,
    tableTime,
    tableInfiniteData,
    nextOlderUpperBound,
    searchStatus,
  },
}) => ({
  sources,
  currentSource,
  currentNamespaces,
  timeRange,
  currentNamespace,
  histogramData,
  tableData,
  filters,
  queryCount,
  logConfig,
  tableTime,
  logConfigLink: logViewer,
  tableInfiniteData,
  newRowsAdded,
  nextOlderUpperBound,
  searchStatus,
})

const mapDispatchToProps = {
  getSourceAndPopulateNamespaces: getSourceAndPopulateNamespacesAsync,
  getSources: getSourcesAsync,
  setTimeRangeAsync,
  setTimeBounds,
  setTimeWindow,
  setTimeMarker,
  setNamespaceAsync,
  // executeQueriesAsync,
  clearSearchData,
  setSearchStatus,
  addFilter,
  removeFilter,
  changeFilter,
  fetchOlderLogsAsync,
  fetchNewerLogsAsync,
  setTableCustomTime: setTableCustomTimeAsync,
  setTableRelativeTime: setTableRelativeTimeAsync,
  getConfig: getLogConfigAsync,
  updateConfig: updateLogConfigAsync,
  notify: notifyAction,
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(LogsPageSimple)
)
