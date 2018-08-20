import React, {Component} from 'react'
import uuid from 'uuid'
import _ from 'lodash'
import moment from 'moment'
import {connect} from 'react-redux'
import {AutoSizer} from 'react-virtualized'

import {searchToFilters} from 'src/logs/utils/search'
import {notify as notifyAction} from 'src/shared/actions/notifications'

import {Greys} from 'src/reusable_ui/types'
import QueryResults from 'src/logs/components/QueryResults'

const NOW = 0

import {
  setTableCustomTimeAsync,
  setTableRelativeTimeAsync,
  getSourceAndPopulateNamespacesAsync,
  setTimeRangeAsync,
  setTimeBounds,
  setTimeWindow,
  setTimeMarker,
  setNamespaceAsync,
  executeQueriesAsync,
  addFilter,
  removeFilter,
  changeFilter,
  fetchOlderLogsAsync,
  fetchNewerLogsAsync,
  getLogConfigAsync,
  updateLogConfigAsync,
} from 'src/logs/actions'
import {getSourcesAsync} from 'src/shared/actions/sources'
import LogViewerHeader from 'src/logs/components/LogViewerHeader'
import HistogramChart from 'src/shared/components/HistogramChart'
import LogsGraphContainer from 'src/logs/components/LogsGraphContainer'
import OptionsOverlay from 'src/logs/components/OptionsOverlay'
import SearchBar from 'src/logs/components/LogsSearchBar'
import FilterBar from 'src/logs/components/LogsFilterBar'
import LogsTable from 'src/logs/components/LogsTable'
import {getDeep} from 'src/utils/wrappers'
import {colorForSeverity} from 'src/logs/utils/colors'
import OverlayTechnology from 'src/reusable_ui/components/overlays/OverlayTechnology'
import {
  SeverityFormatOptions,
  SEVERITY_SORTING_ORDER,
  SECONDS_TO_MS,
} from 'src/logs/constants'

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
  LiveUpdating,
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

interface Props {
  sources: Source[]
  currentSource: Source | null
  currentNamespaces: Namespace[]
  currentNamespace: Namespace
  getSource: (sourceID: string) => void
  getSources: () => void
  setTimeRangeAsync: (timeRange: TimeRange) => void
  setTimeBounds: (timeBounds: TimeBounds) => void
  setTimeWindow: (timeWindow: TimeWindow) => void
  setTimeMarker: (timeMarker: TimeMarker) => void
  setNamespaceAsync: (namespace: Namespace) => void
  executeQueriesAsync: () => void
  setTableRelativeTime: (time: number) => void
  setTableCustomTime: (time: string) => void
  fetchOlderLogsAsync: (queryTimeEnd: string) => Promise<void>
  fetchNewerLogsAsync: (queryTimeEnd: string) => Promise<void>
  addFilter: (filter: Filter) => void
  removeFilter: (id: string) => void
  changeFilter: (id: string, operator: string, value: string) => void
  getConfig: (url: string) => Promise<void>
  updateConfig: (url: string, config: LogConfig) => Promise<void>
  notify: NotificationAction
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
}

interface State {
  searchString: string
  liveUpdating: LiveUpdating
  isOverlayVisible: boolean
  histogramColors: HistogramColor[]
  hasScrolled: boolean
  searchStatus: SearchStatus
}

class LogsPage extends Component<Props, State> {
  public static getDerivedStateFromProps(props: Props, state: State) {
    const {tableInfiniteData} = props

    const severityLevelColors: SeverityLevelColor[] = _.get(
      props.logConfig,
      'severityLevelColors',
      []
    )
    const histogramColors = severityLevelColors.map(lc => ({
      group: lc.level,
      color: lc.color,
    }))

    let {searchStatus} = state

    if (isEmptyInfiniteData(tableInfiniteData)) {
      searchStatus = SearchStatus.NoResults
    } else if (searchStatus === SearchStatus.None) {
      searchStatus = SearchStatus.Loaded
    }

    return {histogramColors, searchStatus}
  }

  private interval: NodeJS.Timer
  private loadingNewer: boolean = false

  constructor(props: Props) {
    super(props)

    this.state = {
      searchString: '',
      liveUpdating: LiveUpdating.Pause,
      isOverlayVisible: false,
      histogramColors: [],
      hasScrolled: false,
      searchStatus: SearchStatus.None,
    }
  }

  public componentDidUpdate() {
    if (!this.props.currentSource && this.props.sources.length > 0) {
      const source =
        this.props.sources.find(src => {
          return src.default
        }) || this.props.sources[0]

      this.props.getSource(source.id)
    }

    if (this.liveUpdatingStatus === LiveUpdating.Pause && this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  public componentDidMount() {
    this.props.getSources()
    this.props.getConfig(this.logConfigLink)

    if (this.props.currentNamespace) {
      this.fetchNewDataset()
    }

    if (getDeep<string>(this.props, 'timeRange.timeOption', '') === 'now') {
      this.startUpdating()
    }
  }

  public componentWillUnmount() {
    clearInterval(this.interval)
  }

  public render() {
    const {filters, queryCount, timeRange, notify} = this.props
    const {searchStatus} = this.state

    return (
      <>
        <div className="page">
          {this.header}
          <div className="page-contents logs-viewer">
            <QueryResults count={this.histogramTotal} queryCount={queryCount} />
            <LogsGraphContainer>{this.chart}</LogsGraphContainer>
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
              fetchMore={this.props.fetchOlderLogsAsync}
              fetchNewer={this.fetchNewer}
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
            />
          </div>
        </div>
        {this.renderImportOverlay()}
      </>
    )
  }

  private handleExpandMessage = () => {
    this.setState({liveUpdating: LiveUpdating.Pause})
  }

  private fetchNewer = (time: string) => {
    this.loadingNewer = true
    this.props.fetchNewerLogsAsync(time)
  }

  private get tableScrollToRow() {
    if (this.liveUpdatingStatus === LiveUpdating.Play) {
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
    const liveUpdating = LiveUpdating.Pause

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

    let liveUpdating = LiveUpdating.Pause
    if (time === NOW) {
      timeOption = {timeOption: 'now'}
      liveUpdating = LiveUpdating.Play
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

    return {
      columns: forwardData.columns,
      values: [...forwardData.values, ...backwardData.values],
    }
  }

  private get logConfigLink(): string {
    return this.props.logConfigLink
  }

  private get tableColumns(): LogsTableColumn[] {
    const {logConfig} = this.props
    return _.get(logConfig, 'tableColumns', [])
  }

  private startUpdating = () => {
    if (this.interval) {
      clearInterval(this.interval)
    }

    this.interval = setInterval(this.handleInterval, 10000)
    this.setState({liveUpdating: LiveUpdating.Play})
  }

  private handleScrollToTop = () => {
    if (!this.state.liveUpdating) {
      this.startUpdating()
    }
  }

  private handleVerticalScroll = () => {
    if (this.state.liveUpdating) {
      clearInterval(this.interval)
    }
    this.setState({liveUpdating: LiveUpdating.Pause, hasScrolled: true})
  }

  private handleTagSelection = (selection: {tag: string; key: string}) => {
    this.props.addFilter({
      id: uuid.v4(),
      key: selection.key,
      value: selection.tag,
      operator: '==',
    })
    this.fetchNewDataset()
  }

  private handleInterval = () => {
    this.fetchNewDataset()
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
            {({adjustedWidth, adjustedHeight, margins}) => {
              const x = margins.left + adjustedWidth / 2
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
      <LogViewerHeader
        timeRange={timeRange}
        onSetTimeWindow={this.handleSetTimeWindow}
        liveUpdating={this.liveUpdatingStatus}
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

  private get liveUpdatingStatus(): LiveUpdating {
    const {liveUpdating} = this.state

    if (liveUpdating === LiveUpdating.Play) {
      return LiveUpdating.Play
    }

    return LiveUpdating.Pause
  }

  private get severityLevelColors(): SeverityLevelColor[] {
    return _.get(this.props.logConfig, 'severityLevelColors', [])
  }

  private handleChangeLiveUpdatingStatus = async (): Promise<void> => {
    const {liveUpdating} = this.state

    if (liveUpdating === LiveUpdating.Play) {
      this.setState({liveUpdating: LiveUpdating.Pause})
      clearInterval(this.interval)
    } else {
      this.handleChooseRelativeTime(NOW)
    }
  }

  private handleSubmitSearch = async (value: string): Promise<void> => {
    searchToFilters(value).forEach(filter => {
      this.props.addFilter(filter)
    })

    this.fetchSearchDataset(SearchStatus.Loading)
  }

  private handleFilterDelete = (id: string): void => {
    this.props.removeFilter(id)

    this.fetchSearchDataset(SearchStatus.UpdatingFilters)
  }

  private handleFilterChange = async (
    id: string,
    operator: string,
    value: string
  ): Promise<void> => {
    this.props.changeFilter(id, operator, value)
    this.fetchSearchDataset(SearchStatus.UpdatingFilters)
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

    let lower = `now() - ${windowOption}`
    let upper = null

    if (timeOption !== 'now') {
      const numberTimeOption = new Date(timeOption).valueOf()
      const milliseconds = seconds * SECONDS_TO_MS
      lower = moment(numberTimeOption - milliseconds).toISOString()
      upper = moment(numberTimeOption + milliseconds).toISOString()
    }

    const timeBounds: TimeBounds = {
      lower,
      upper,
    }

    await this.props.setTimeBounds(timeBounds)

    this.props.setTimeRangeAsync(this.props.timeRange)

    this.fetchSearchDataset(SearchStatus.UpdatingTimeBounds)
  }

  private handleSetTimeWindow = async (timeWindow: TimeWindow) => {
    await this.props.setTimeWindow(timeWindow)
    this.handleSetTimeBounds()
  }

  private handleChooseSource = (sourceID: string) => {
    this.props.getSource(sourceID)
  }

  private handleChooseNamespace = (namespace: Namespace) => {
    this.props.setNamespaceAsync(namespace)
  }

  private fetchSearchDataset = async (
    searchStatus: SearchStatus
  ): Promise<void> => {
    try {
      this.setState({searchStatus})
      await this.fetchNewDataset()
    } finally {
      this.setState({searchStatus: SearchStatus.Loaded})
    }
  }

  private fetchNewDataset() {
    return this.props.executeQueriesAsync()
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
})

const mapDispatchToProps = {
  getSource: getSourceAndPopulateNamespacesAsync,
  getSources: getSourcesAsync,
  setTimeRangeAsync,
  setTimeBounds,
  setTimeWindow,
  setTimeMarker,
  setNamespaceAsync,
  executeQueriesAsync,
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

export default connect(mapStateToProps, mapDispatchToProps)(LogsPage)
