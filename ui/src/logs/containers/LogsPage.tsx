// Libraries
import React, {Component} from 'react'
import uuid from 'uuid'
import _ from 'lodash'
import {connect} from 'react-redux'
import {AutoSizer} from 'react-virtualized'
import {withRouter, InjectedRouter, WithRouterProps} from 'react-router'

// Components
import LogsHeader from 'src/logs/components/LogsHeader'
import HistogramChart from 'src/shared/components/HistogramChart'
import LogsGraphContainer from 'src/logs/components/LogsGraphContainer'
import TimeWindowDropdown from 'src/logs/components/TimeWindowDropdown'
import OptionsOverlay from 'src/logs/components/OptionsOverlay'
import SearchBar from 'src/logs/components/LogsSearchBar'
import FilterBar from 'src/logs/components/LogsFilterBar'
import LogsTable from 'src/logs/components/LogsTable'
import OverlayTechnology from 'src/reusable_ui/components/overlays/OverlayTechnology'
import HistogramResults from 'src/logs/components/HistogramResults'
import PageSpinner from 'src/shared/components/PageSpinner'

// Utils
import {getDeep} from 'src/utils/wrappers'
import {searchToFilters} from 'src/logs/utils/search'
import {fetchChunk} from 'src/logs/utils/fetchChunk'
import {colorForSeverity} from 'src/logs/utils/colors'
import {
  applyChangesToTableData,
  isEmptyInfiniteData,
  findTimeOptionRow,
} from 'src/logs/utils/table'
import extentBy from 'src/utils/extentBy'
import {computeTimeBounds} from 'src/logs/utils/timeBounds'
import {formatTime} from 'src/logs/utils'

// Actions
import {notify as notifyAction} from 'src/shared/actions/notifications'
import {
  setTableCustomTimeAsync,
  setTableRelativeTimeAsync,
  getSourceAndPopulateNamespacesAsync,
  setTimeRangeAsync,
  setTimeBounds,
  setTimeWindow,
  setTimeMarker,
  setNamespaceAsync,
  addFilter,
  removeFilter,
  changeFilter,
  clearFilters,
  fetchOlderChunkAsync,
  fetchNewerChunkAsync,
  fetchNamespaceSyslogStatusAsync,
  fetchTailAsync,
  flushTailBuffer,
  clearAllTimeBounds,
  setNextTailLowerBound,
  setNextNewerLowerBound,
  getLogConfigAsync,
  updateLogConfigAsync,
  clearSearchData,
  setSearchStatus,
  executeHistogramQueryAsync,
  populateNamespacesAsync,
} from 'src/logs/actions'
import {getSourcesAsync} from 'src/shared/actions/sources'

// Constants
import {
  NOW,
  DEFAULT_TAIL_CHUNK_DURATION_MS,
  DEFAULT_NEWER_CHUNK_DURATION_MS,
  NEWER_CHUNK_OPTIONS,
  OLDER_CHUNK_OPTIONS,
} from 'src/logs/constants'
import {SeverityFormatOptions, SEVERITY_SORTING_ORDER} from 'src/logs/constants'

// Types
import {Greys} from 'src/reusable_ui/types'
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
  FetchLoop,
} from 'src/types/logs'
import {RemoteDataState} from 'src/types'

interface Props extends WithRouterProps {
  sources: Source[]
  currentSource: Source | null
  currentNamespaces: Namespace[]
  currentNamespace: Namespace
  getSourceAndPopulateNamespaces: (sourceID: string) => void
  getSources: typeof getSourcesAsync
  setTimeRangeAsync: (timeRange: TimeRange) => void
  setTimeBounds: (timeBounds: TimeBounds) => void
  setTimeWindow: (timeWindow: TimeWindow) => void
  setTimeMarker: (timeMarker: TimeMarker) => void
  setNamespaceAsync: (namespace: Namespace) => void
  setTableRelativeTime: (time: number) => void
  setTableCustomTime: (time: string) => void
  addFilter: (filter: Filter) => void
  removeFilter: (id: string) => void
  changeFilter: (id: string, operator: string, value: string) => void
  clearFilters: () => void
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
  fetchOlderChunkAsync: typeof fetchOlderChunkAsync
  fetchNewerChunkAsync: typeof fetchNewerChunkAsync
  fetchTailAsync: typeof fetchTailAsync
  fetchNamespaceSyslogStatusAsync: typeof fetchNamespaceSyslogStatusAsync
  populateNamespacesAsync: typeof populateNamespacesAsync
  flushTailBuffer: typeof flushTailBuffer
  clearAllTimeBounds: typeof clearAllTimeBounds
  setNextTailLowerBound: typeof setNextTailLowerBound
  setNextNewerLowerBound: typeof setNextNewerLowerBound
  executeHistogramQueryAsync: typeof executeHistogramQueryAsync
  nextOlderUpperBound: number | undefined
  nextNewerLowerBound: number | undefined
  currentTailUpperBound: number | undefined
  nextTailLowerBound: number | undefined
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
  isLoadingNewer: boolean
  queryCount: number
  isHistogramHidden: boolean
}

class LogsPage extends Component<Props, State> {
  public static getDerivedStateFromProps(props: Props) {
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
  private currentOlderChunksGenerator: FetchLoop = null
  private currentNewerChunksGenerator: FetchLoop = null
  private loadingSourcesStatus: RemoteDataState = RemoteDataState.NotStarted
  private isComponentMounted: boolean = true

  constructor(props: Props) {
    super(props)
    const {
      location: {
        query: {table},
      },
    } = props

    this.state = {
      isLoadingNewer: false,
      searchString: '',
      liveUpdating: false,
      isOverlayVisible: false,
      histogramColors: [],
      hasScrolled: false,
      queryCount: 0,
      isHistogramHidden: table !== undefined,
    }
  }

  public async componentDidUpdate(prevProps: Props) {
    const {router} = this.props
    if (this.isSourcesEmpty) {
      return router.push(`/sources/new?redirectPath=${location.pathname}`)
    }

    this.handleLoadingStatus()

    const isSearchStatusUpdated =
      prevProps.searchStatus !== this.props.searchStatus
    const isPrevSearchCleared = prevProps.searchStatus === SearchStatus.Cleared

    if (
      isSearchStatusUpdated &&
      isPrevSearchCleared &&
      this.isMeasurementInNamespace
    ) {
      this.fetchNewDataset()
    }
  }

  public async componentDidMount() {
    this.isComponentMounted = true
    await this.getSources()
    await this.setCurrentSource()

    await this.props.getConfig(this.logConfigLink)

    if (this.isComponentMounted && this.isMeasurementInNamespace) {
      this.updateTableData(SearchStatus.Loading)
    }

    if (getDeep<string>(this.props, 'timeRange.timeOption', '') === 'now') {
      this.startLogsTailFetchingInterval()
    }
    if (this.isComponentMounted) {
      await this.props.executeHistogramQueryAsync()
    }
  }

  public componentWillUnmount() {
    this.isComponentMounted = false
    this.clearTailInterval()
    this.cancelChunks()
  }

  public render() {
    const {
      filters,
      timeRange,
      notify,
      nextOlderUpperBound,
      nextNewerLowerBound,
      nextTailLowerBound,
      currentTailUpperBound,
      searchStatus,
      tableTime,
    } = this.props
    const {isHistogramHidden} = this.state

    if (this.isLoadingSourcesStatus) {
      return <PageSpinner />
    }

    return (
      <>
        <div className="page">
          {this.header}
          <div
            className={`page-contents logs-viewer ${
              isHistogramHidden ? 'logs-viewer--table-only' : ''
            }`}
          >
            {isHistogramHidden ? undefined : (
              <LogsGraphContainer>
                {this.chartControlBar}
                {this.chart}
              </LogsGraphContainer>
            )}
            <SearchBar
              onSearch={this.handleSubmitSearch}
              customTime={tableTime.custom}
              relativeTime={tableTime.relative}
              onChooseCustomTime={this.handleChooseCustomTime}
              onChooseRelativeTime={this.handleChooseRelativeTime}
            />
            <FilterBar
              filters={filters || []}
              onDelete={this.handleFilterDelete}
              onFilterChange={this.handleFilterChange}
              onClearFilters={this.handleClearFilters}
              onUpdateTruncation={this.handleUpdateTruncation}
              isTruncated={this.isTruncated}
              isHistogramHidden={isHistogramHidden}
              onShowHistogram={this.handleShowHistogram}
            />
            <LogsTable
              queryCount={this.state.queryCount}
              count={this.histogramTotal}
              data={this.tableData}
              onScrollVertical={this.handleVerticalScroll}
              onScrolledToTop={this.handleScrollToTop}
              isTruncated={this.isTruncated}
              onTagSelection={this.handleTagSelection}
              fetchMore={this.handleFetchOlderChunk}
              fetchNewer={this.handleFetchNewerChunk}
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
              upper={
                currentTailUpperBound ||
                nextNewerLowerBound ||
                nextTailLowerBound
              }
              lower={nextOlderUpperBound}
            />
          </div>
        </div>
        {this.renderImportOverlay()}
        {this.expandedMessageContainer}
      </>
    )
  }

  private handleLoadingStatus() {
    if (
      this.isMeasurementInNamespace &&
      !this.isClearing &&
      !isEmptyInfiniteData(this.props.tableInfiniteData)
    ) {
      this.props.setSearchStatus(SearchStatus.Loaded)
    }
  }

  private setCurrentSource = async () => {
    if (!this.props.currentSource && this.props.sources.length > 0) {
      const source =
        this.props.sources.find(src => {
          return src.default
        }) || this.props.sources[0]

      return this.props.getSourceAndPopulateNamespaces(source.id)
    } else if (this.props.currentNamespace) {
      return this.props.populateNamespacesAsync(
        this.props.currentSource,
        this.props.currentNamespace
      )
    }
  }

  private handleExpandMessage = () => {
    this.handleVerticalScroll()
  }

  private startLogsTailFetchingInterval = () => {
    this.flushTailBuffer()
    this.clearTailInterval()
    if (!this.isComponentMounted) {
      return false
    }

    this.props.setNextTailLowerBound(Date.now())

    this.interval = window.setInterval(
      this.handleTailFetchingInterval,
      DEFAULT_TAIL_CHUNK_DURATION_MS
    )

    this.setState({liveUpdating: true})
  }

  private handleTailFetchingInterval = async () => {
    if (this.isClearing || !this.isComponentMounted) {
      return
    }

    this.props.executeHistogramQueryAsync()
    await this.fetchTail()
  }

  private fetchTail = async () => {
    if (!this.isComponentMounted) {
      return
    }
    await this.props.fetchTailAsync()
  }

  private fetchNewerChunk = async (): Promise<void> => {
    if (!this.isComponentMounted) {
      return
    }
    const maxNewerFetchForward = Date.now() + DEFAULT_NEWER_CHUNK_DURATION_MS

    if (this.props.nextNewerLowerBound > maxNewerFetchForward) {
      this.props.setNextNewerLowerBound(Date.now())
      this.currentNewerChunksGenerator.cancel()
    }

    if (!this.isComponentMounted) {
      return
    }
    await this.props.fetchNewerChunkAsync()
  }

  private get isClearing(): boolean {
    switch (this.props.searchStatus) {
      case SearchStatus.Clearing:
      case SearchStatus.None:
        return true
    }

    return false
  }

  private totalForwardValues = (): number => {
    return getDeep<number | null>(
      this.props,
      'tableInfiniteData.forward.values.length',
      null
    )
  }

  private totalBackwardValues = (): number => {
    return getDeep<number | null>(
      this.props,
      'tableInfiniteData.backward.values.length',
      null
    )
  }

  private fetchOlderChunk = async () => {
    if (!this.isComponentMounted) {
      return
    }
    await this.props.fetchOlderChunkAsync()
  }

  private handleFetchOlderChunk = async () => {
    if (!this.isComponentMounted) {
      return
    }
    if (this.currentOlderChunksGenerator) {
      return
    }
    await this.startFetchingOlder()
  }

  private handleFetchNewerChunk = async () => {
    if (!this.isComponentMounted) {
      return
    }
    if (this.isLiveUpdating || this.shouldLiveUpdate) {
      return
    }
    this.setState({isLoadingNewer: true})
    await this.startFetchingNewer()
  }

  private startFetchingNewer = async () => {
    if (!this.isComponentMounted) {
      return
    }
    if (this.currentNewerChunksGenerator) {
      return
    }

    const chunkOptions = {
      ...NEWER_CHUNK_OPTIONS,
      getCurrentSize: this.totalForwardValues,
    }

    this.currentNewerChunksGenerator = fetchChunk(
      this.fetchNewerChunk,
      chunkOptions
    )

    this.updateQueryCount()

    try {
      await this.currentNewerChunksGenerator.promise
    } catch (error) {
      console.error(error)
    }

    if (!this.isComponentMounted) {
      return
    }
    this.setState({isLoadingNewer: false})
    this.currentNewerChunksGenerator = null
    this.updateQueryCount()
  }

  private startFetchingOlder = async () => {
    const chunkOptions = {
      ...OLDER_CHUNK_OPTIONS,
      getCurrentSize: this.totalBackwardValues,
    }

    if (!this.isComponentMounted) {
      return
    }
    this.currentOlderChunksGenerator = fetchChunk(
      this.fetchOlderChunk,
      chunkOptions
    )

    if (!this.isComponentMounted) {
      return
    }
    this.updateQueryCount()

    try {
      await this.currentOlderChunksGenerator.promise
    } catch (error) {
      console.error(error)
    }

    this.currentOlderChunksGenerator = null
    if (!this.isComponentMounted) {
      return
    }
    this.updateQueryCount()
  }

  private clearTailInterval = () => {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  private cancelChunks = async () => {
    const cancelPendingChunks = _.compact([
      this.currentNewerChunksGenerator,
      this.currentOlderChunksGenerator,
    ]).map(req => {
      req.cancel()
      return req.promise
    })

    await Promise.all(cancelPendingChunks)

    this.currentNewerChunksGenerator = null
    this.currentOlderChunksGenerator = null
    if (!this.isComponentMounted) {
      return
    }
    this.setState({queryCount: 0})
  }

  private get tableScrollToRow() {
    const {
      timeRange: {timeOption},
    } = this.props
    if (this.isLiveUpdating === true && !this.state.hasScrolled) {
      return 0
    }

    if (!this.isLiveUpdating && timeOption && !this.state.hasScrolled) {
      return findTimeOptionRow(timeOption, this.props.tableInfiniteData, 0)
    } else if (this.state.isLoadingNewer && this.props.newRowsAdded) {
      return this.props.newRowsAdded || 0
    }

    if (this.state.hasScrolled) {
      return
    }

    if (this.totalForwardValues() > 0) {
      return Math.max(this.totalForwardValues() - 3, 0)
    }
    return Math.round(this.totalBackwardValues() / 2)
  }

  private handleChooseCustomTime = async (time: string) => {
    this.clearAllTimeBounds()

    this.props.setTableCustomTime(time)
    const liveUpdating = false

    const customLowerBound = Date.parse(time)
    this.props.setNextNewerLowerBound(customLowerBound)

    if (!this.isComponentMounted) {
      return
    }
    this.setState({
      hasScrolled: false,
      liveUpdating,
    })

    if (!this.isComponentMounted) {
      return
    }
    await this.props.setTimeMarker({
      timeOption: time,
    })

    this.handleSetTimeBounds()
  }

  private handleChooseRelativeTime = async (time: number) => {
    this.clearAllTimeBounds()

    this.props.setTableRelativeTime(time)

    const relativeLowerBound = Date.now() - time * 1000
    this.props.setNextNewerLowerBound(relativeLowerBound)

    if (!this.isComponentMounted) {
      return
    }
    this.setState({hasScrolled: false})

    const timeOptionUTC = new Date(Date.now() - time * 1000).toISOString()
    let timeOption = {
      timeOption: timeOptionUTC,
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

  private clearAllTimeBounds(): void {
    this.props.clearAllTimeBounds()
  }

  private flushTailBuffer(): void {
    this.props.flushTailBuffer()
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

  private get logConfigLink(): string {
    return this.props.logConfigLink
  }

  private get tableColumns(): LogsTableColumn[] {
    const {logConfig} = this.props
    return _.get(logConfig, 'tableColumns', [])
  }

  private handleScrollToTop = () => {
    if (!this.isLiveUpdating && this.shouldLiveUpdate) {
      this.startLogsTailFetchingInterval()
    }
  }

  private handleVerticalScroll = () => {
    if (!this.isLiveUpdating && this.state.hasScrolled) {
      return
    }

    if (this.isLiveUpdating) {
      this.clearTailInterval()
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
      <div className="logs-viewer--graph">
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
                const timeOptionValue = new Date(timeOption).valueOf()
                const x = xScale(timeOptionValue)
                const y1 = margins.top
                const y2 = margins.top + adjustedHeight
                const textSize = 11
                const markerSize = 5
                const labelSize = 100

                if (timeOption === 'now') {
                  return null
                }
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
                        {formatTime(timeOptionValue)}
                      </text>
                    </svg>
                  </>
                )
              }}
            </HistogramChart>
          )}
        </AutoSizer>
      </div>
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
    } = this.props

    return (
      <LogsHeader
        liveUpdating={this.isLiveUpdating}
        availableSources={sources}
        onChooseSource={this.handleChooseSource}
        onChooseNamespace={this.handleChooseNamespace}
        currentSource={currentSource}
        currentNamespaces={currentNamespaces}
        currentNamespace={currentNamespace}
        onChangeLiveUpdatingStatus={this.handleChangeLiveUpdatingStatus}
        onShowOptionsOverlay={this.handleToggleOverlay}
      />
    )
  }

  private get chartControlBar(): JSX.Element {
    const {queryCount, searchStatus} = this.props

    const timeRange = getDeep(this.props, 'timeRange', {
      upper: null,
      lower: 'now() - 1m',
      seconds: 60,
      windowOption: '1m',
      timeOption: 'now',
    })

    return (
      <div className="logs-viewer--graph-controls">
        <HistogramResults
          count={this.histogramTotal}
          queryCount={queryCount}
          searchStatus={searchStatus}
          selectedTimeWindow={timeRange}
        />
        <div className="page-header--right">
          <button
            className="btn btn-sm btn-square btn-default"
            onClick={this.handleHideHistogram}
            title="Hide Histogram"
          >
            <span className="icon eye-closed" />
          </button>
          <TimeWindowDropdown
            selectedTimeWindow={timeRange}
            onSetTimeWindow={this.handleSetTimeWindow}
          />
        </div>
      </div>
    )
  }

  private get severityLevelColors(): SeverityLevelColor[] {
    return _.get(this.props.logConfig, 'severityLevelColors', [])
  }

  private handleChangeLiveUpdatingStatus = async (): Promise<void> => {
    const {liveUpdating} = this.state

    if (liveUpdating === true) {
      this.setState({liveUpdating: false})
      this.clearTailInterval()
    } else {
      this.handleChooseRelativeTime(NOW)
    }
  }

  private handleSubmitSearch = async (value: string): Promise<void> => {
    searchToFilters(value)
      .reverse()
      .forEach(filter => {
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

  private handleClearFilters = async (): Promise<void> => {
    this.props.clearFilters()
    this.updateTableData(SearchStatus.UpdatingFilters)
  }

  private handleBarClick = (time: string): void => {
    const formattedTime = new Date(time).toISOString()
    this.handleChooseCustomTime(formattedTime)
  }

  private handleSetTimeBounds = async () => {
    const {seconds, windowOption, timeOption} = _.get(this.props, 'timeRange', {
      seconds: null,
      windowOption: null,
      timeOption: null,
    })

    let timeBounds: TimeBounds = {
      lower: `now() - ${windowOption}`,
      upper: null,
    }

    if (timeOption !== 'now') {
      const extentTimes = extentBy(this.props.histogramData, d => d.time).map(
        d => d.time
      )

      timeBounds = computeTimeBounds(extentTimes, timeOption, seconds)
    }

    await this.props.setTimeBounds(timeBounds)

    this.props.setTimeRangeAsync(this.props.timeRange)

    this.updateTableData(SearchStatus.UpdatingTimeBounds)
  }

  private handleSetTimeWindow = async (timeWindow: TimeWindow) => {
    await this.props.setTimeWindow(timeWindow)
    this.handleSetTimeBounds()
  }

  private handleChooseSource = async (sourceID: string) => {
    this.updateTableData(SearchStatus.Cleared)
    await this.props.getSourceAndPopulateNamespaces(sourceID)

    if (this.isMeasurementInNamespace) {
      this.updateTableData(SearchStatus.UpdatingSource)
    }
  }

  private handleChooseNamespace = async (namespace: Namespace) => {
    this.updateTableData(SearchStatus.Cleared)

    await Promise.all([
      this.props.setNamespaceAsync(namespace),
      this.props.fetchNamespaceSyslogStatusAsync(namespace),
    ])

    if (this.isMeasurementInNamespace) {
      this.updateTableData(SearchStatus.UpdatingNamespace)
    }
  }

  private updateTableData = async (searchStatus: SearchStatus) => {
    this.clearTailInterval()
    await this.cancelChunks()
    this.setState({hasScrolled: false, liveUpdating: this.shouldLiveUpdate})
    this.props.clearSearchData(searchStatus)
  }

  private fetchNewDataset = async () => {
    if (this.isLiveUpdating && this.shouldLiveUpdate) {
      this.startLogsTailFetchingInterval()
    } else if (!this.shouldLiveUpdate) {
      this.props.executeHistogramQueryAsync()
      this.handleFetchNewerChunk()
    }

    await this.handleFetchOlderChunk()
  }

  private handleToggleOverlay = (): void => {
    this.setState({isOverlayVisible: !this.state.isOverlayVisible})
  }
  private handleShowHistogram = (): void => {
    this.setState({isHistogramHidden: false, isOverlayVisible: false})
  }
  private handleHideHistogram = (): void => {
    this.setState({isHistogramHidden: true})
  }

  private renderImportOverlay = (): JSX.Element => {
    const {isOverlayVisible} = this.state

    return (
      <OverlayTechnology visible={isOverlayVisible}>
        <OptionsOverlay
          severityLevelColors={this.severityLevelColors}
          onUpdate={this.handleUpdateOptions}
          onDismissOverlay={this.handleToggleOverlay}
          columns={this.tableColumns}
          severityFormat={this.severityFormat}
        />
      </OverlayTechnology>
    )
  }

  private handleUpdateOptions = async (
    severityLevelColors: SeverityLevelColor[],
    severityFormat: SeverityFormat,
    tableColumns: LogsTableColumn[]
  ): Promise<void> => {
    const {logConfig} = this.props
    await this.props.updateConfig(this.logConfigLink, {
      ...logConfig,
      severityLevelColors,
      severityFormat,
      tableColumns,
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

  private handleUpdateTruncation = async (
    isTruncated: boolean
  ): Promise<void> => {
    const {logConfig} = this.props

    await this.props.updateConfig(this.logConfigLink, {
      ...logConfig,
      isTruncated,
    })
  }

  private getSources = async (): Promise<void> => {
    try {
      this.loadingSourcesStatus = RemoteDataState.Loading
      await this.props.getSources()
      this.loadingSourcesStatus = RemoteDataState.Done
    } catch (err) {
      this.loadingSourcesStatus = RemoteDataState.Error
    }
  }

  private get isTruncated(): boolean {
    return this.props.logConfig.isTruncated
  }

  private get expandedMessageContainer(): JSX.Element {
    return (
      <div
        className="logs-viewer--expanded-message-container"
        id="expanded-message-container"
      />
    )
  }

  private get isLiveUpdating(): boolean {
    return !!this.state.liveUpdating
  }

  private get shouldLiveUpdate(): boolean {
    return this.props.tableTime.relative === 0
  }

  private get isLoadingSourcesStatus(): boolean {
    switch (this.loadingSourcesStatus) {
      case RemoteDataState.Loading:
      case RemoteDataState.NotStarted:
        return true
      default:
        return false
    }
  }

  private get isSourcesEmpty(): boolean {
    if (this.isLoadingSourcesStatus) {
      return false
    }

    return !this.props.sources || this.props.sources.length === 0
  }

  private get isMeasurementInNamespace(): boolean {
    return this.props.searchStatus !== SearchStatus.MeasurementMissing
  }

  private updateQueryCount() {
    this.setState({queryCount: this.countCurrentQueries()})
  }

  private countCurrentQueries(): number {
    return _.compact([
      this.currentNewerChunksGenerator,
      this.currentOlderChunksGenerator,
    ]).length
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
    nextNewerLowerBound,
    currentTailUpperBound,
    nextTailLowerBound,
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
  nextNewerLowerBound,
  currentTailUpperBound,
  nextTailLowerBound,
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
  executeHistogramQueryAsync,
  clearSearchData,
  setSearchStatus,
  addFilter,
  removeFilter,
  changeFilter,
  clearFilters,
  fetchOlderChunkAsync,
  fetchNewerChunkAsync,
  fetchTailAsync,
  fetchNamespaceSyslogStatusAsync,
  flushTailBuffer,
  clearAllTimeBounds,
  setNextTailLowerBound,
  setNextNewerLowerBound,
  setTableCustomTime: setTableCustomTimeAsync,
  setTableRelativeTime: setTableRelativeTimeAsync,
  getConfig: getLogConfigAsync,
  updateConfig: updateLogConfigAsync,
  notify: notifyAction,
  populateNamespacesAsync,
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(LogsPage)
)
