import _ from 'lodash'
import moment from 'moment'
import classnames from 'classnames'
import React, {Component, MouseEvent, CSSProperties} from 'react'
import {Grid, AutoSizer, InfiniteLoader} from 'react-virtualized'

import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import ExpandableMessage from 'src/logs/components/expandable_message/ExpandableMessage'
import LogsMessage from 'src/logs/components/logs_message/LogsMessage'
import LoadingStatus from 'src/logs/components/loading_status/LoadingStatus'
import {getDeep} from 'src/utils/wrappers'

import {colorForSeverity, getBrighterColor} from 'src/logs/utils/colors'
import {
  ROW_HEIGHT,
  calculateRowCharWidth,
  calculateMessageHeight,
  getColumnFromData,
  getValueFromData,
  getValuesFromData,
  isClickable,
  formatColumnValue,
  header,
  getColumnWidth,
  getMessageWidth,
  getColumnsFromData,
  getMinTableWidth,
} from 'src/logs/utils/table'
import {
  getValidMessageFilters,
  filtersToPattern,
} from 'src/logs/utils/matchSections'

import {
  SeverityFormatOptions,
  SeverityColorOptions,
  SeverityLevelOptions,
  DEFAULT_TIME_FORMAT,
} from 'src/logs/constants'

import {TimeRange, NotificationAction} from 'src/types'
import {
  TableData,
  LogsTableColumn,
  SeverityFormat,
  SeverityLevelColor,
  RowHeightHandler,
  SearchStatus,
  Filter,
} from 'src/types/logs'
import {INITIAL_LIMIT} from 'src/logs/actions'

interface Props {
  queryCount: number
  filters: Filter[]
  data: TableData
  isTruncated: boolean
  onScrollVertical: () => void
  onScrolledToTop: () => void
  onTagSelection: (selection: {tag: string; key: string}) => void
  fetchMore: () => void
  fetchNewer: () => void
  hasScrolled: boolean
  count: number
  timeRange: TimeRange
  tableColumns: LogsTableColumn[]
  severityFormat: SeverityFormat
  severityLevelColors: SeverityLevelColor[]
  scrollToRow?: number
  tableInfiniteData: {
    forward: TableData
    backward: TableData
  }
  onExpandMessage: () => void
  onChooseCustomTime: (time: string) => void
  notify: NotificationAction
  searchStatus: SearchStatus
  upper: number | undefined
  lower: number | undefined
}

interface State {
  scrollLeft: number
  scrollTop: number
  currentMessageWidth: number
  isMessageVisible: boolean
  visibleColumnsCount: number
  searchPattern: string
}

const calculateScrollTop = scrollToRow => {
  return scrollToRow * ROW_HEIGHT
}

class LogsTable extends Component<Props, State> {
  public static getDerivedStateFromProps(props, state): State {
    const {
      scrollToRow,
      data,
      tableColumns,
      severityFormat,
      filters,
      searchStatus,
    } = props
    const currentMessageWidth = getMessageWidth(
      data,
      tableColumns,
      severityFormat
    )

    let scrollTop = _.get(state, 'scrollTop', 0)
    let scrollLeft = _.get(state, 'scrollLeft', 0)

    if (_.isNumber(scrollToRow)) {
      scrollTop = calculateScrollTop(scrollToRow)
    }

    if (searchStatus === SearchStatus.Clearing) {
      scrollLeft = 0
    }

    let isMessageVisible: boolean = false
    const visibleColumnsCount = props.tableColumns.filter(c => {
      if (c.internalName === 'message') {
        isMessageVisible = c.visible
      }
      return c.visible
    }).length

    const validFilters = getValidMessageFilters(filters)
    const searchPattern = filtersToPattern(validFilters)

    return {
      ...state,
      searchPattern,
      isQuerying: false,
      scrollTop,
      scrollLeft,
      currentMessageWidth,
      isMessageVisible,
      visibleColumnsCount,
      scrollToRow,
    }
  }

  private currentWidth: number
  private grid: Grid | null
  private headerGrid: React.RefObject<Grid>

  constructor(props: Props) {
    super(props)

    this.grid = null
    this.headerGrid = React.createRef()

    let isMessageVisible: boolean = false
    const visibleColumnsCount = props.tableColumns.filter(c => {
      if (c.internalName === 'message') {
        isMessageVisible = c.visible
      }
      return c.visible
    }).length

    this.currentWidth = null
    this.state = {
      searchPattern: null,
      scrollTop: 0,
      scrollLeft: 0,
      currentMessageWidth: 0,
      isMessageVisible,
      visibleColumnsCount,
    }
  }

  public componentDidUpdate() {
    const {searchStatus} = this.props

    if (searchStatus === SearchStatus.NoResults) {
      return
    }

    if (this.grid) {
      this.grid.recomputeGridSize()
    }

    if (this.headerGrid.current) {
      this.headerGrid.current.recomputeGridSize()
    }
  }

  public componentDidMount() {
    window.addEventListener('resize', this.handleWindowResize)
    if (this.grid) {
      this.grid.recomputeGridSize()
    }

    if (this.headerGrid.current) {
      this.headerGrid.current.recomputeGridSize()
    }
  }

  public componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize)
  }

  public render() {
    const columnCount = Math.max(getColumnsFromData(this.props.data).length, 0)

    if (this.isLoadingTableData) {
      return this.loadingStatus
    }

    return (
      <div className="logs-viewer--table-container">
        <AutoSizer>
          {({width}) => (
            <Grid
              ref={this.headerGrid}
              height={ROW_HEIGHT}
              rowHeight={ROW_HEIGHT}
              rowCount={1}
              width={width}
              scrollLeft={this.state.scrollLeft}
              cellRenderer={this.headerRenderer}
              columnCount={columnCount}
              columnWidth={this.getColumnWidth}
              style={{overflow: 'hidden'}}
            />
          )}
        </AutoSizer>
        <InfiniteLoader
          isRowLoaded={this.isRowLoaded}
          loadMoreRows={this.loadMoreBelowRows}
          rowCount={this.rowCount() + INITIAL_LIMIT}
        >
          {({registerChild, onRowsRendered}) => (
            <AutoSizer>
              {({width, height}) => (
                <FancyScrollbar
                  style={{
                    width,
                    height: height - ROW_HEIGHT,
                    marginTop: `${ROW_HEIGHT}px`,
                  }}
                  setScrollTop={this.handleScrollbarScroll}
                  scrollTop={this.state.scrollTop}
                  scrollLeft={this.state.scrollLeft}
                  autoHide={false}
                >
                  <Grid
                    {...this.gridProperties(
                      width,
                      height,
                      onRowsRendered,
                      columnCount,
                      registerChild
                    )}
                    style={{
                      height: this.calculateTotalHeight(),
                      width: Math.max(this.minTableWidth, width),
                      overflow: 'hidden',
                    }}
                  />
                </FancyScrollbar>
              )}
            </AutoSizer>
          )}
        </InfiniteLoader>
        {this.scrollLoadingIndicator}
      </div>
    )
  }

  private gridProperties = (
    width: number,
    height: number,
    onRowsRendered: (params: {startIndex: number; stopIndex: number}) => void,
    columnCount: number,
    registerChild: (g: Grid) => void
  ) => {
    this.currentWidth = width

    const {scrollToRow} = this.props
    const {scrollTop, scrollLeft} = this.state

    let rowHeight: number | RowHeightHandler = ROW_HEIGHT

    if (!this.props.isTruncated) {
      rowHeight = this.calculateRowHeight
    }

    const result: any = {
      width,
      height,
      rowHeight,
      rowCount: this.rowCount(),
      scrollLeft,
      scrollTop,
      cellRenderer: this.cellRenderer,
      onSectionRendered: this.handleRowRender(onRowsRendered),
      columnCount,
      columnWidth: this.getColumnWidth,
      overscanRowCount: 50,
      ref: (ref: Grid) => {
        registerChild(ref)
        this.grid = ref
      },
    }

    if (_.isNumber(scrollToRow)) {
      result.scrollToRow = scrollToRow
    }

    return result
  }

  private handleScrollbarScroll = (e: MouseEvent<HTMLElement>): void => {
    e.stopPropagation()
    e.preventDefault()
    const {scrollTop, scrollLeft} = e.currentTarget

    this.handleScroll({
      scrollTop,
      scrollLeft,
    })
  }

  private handleScroll = scrollInfo => {
    const {scrollTop, scrollLeft} = scrollInfo
    const previousTop = this.state.scrollTop
    const previousLeft = this.state.scrollLeft

    if (scrollTop < 200 && scrollTop <= previousTop) {
      this.loadMoreAboveRows()
    }

    if (scrollTop === 0 && previousTop !== 0) {
      this.props.onScrolledToTop()
    } else if (scrollTop !== previousTop) {
      this.props.onScrollVertical()
    }

    if (scrollLeft !== previousLeft || scrollTop !== previousTop) {
      this.setState({scrollLeft, scrollTop})
    }
  }

  private handleRowRender = onRowsRendered => {
    return ({rowStartIndex, rowStopIndex}) => {
      onRowsRendered({startIndex: rowStartIndex, stopIndex: rowStopIndex})
    }
  }

  private loadMoreAboveRows = async () => {
    await this.props.fetchNewer()
  }

  private loadMoreBelowRows = async () => {
    await this.props.fetchMore()
  }

  private rowCount = (): number => {
    const data = this.props.tableInfiniteData
    return (
      getDeep<number>(data, 'forward.values.length', 0) +
      getDeep<number>(data, 'backward.values.length', 0)
    )
  }

  private isRowLoaded = ({index}) => {
    return index < this.rowCount() - 1
  }

  private handleWindowResize = () => {
    this.setState({
      currentMessageWidth: getMessageWidth(
        this.props.data,
        this.props.tableColumns,
        this.props.severityFormat
      ),
    })
  }

  private getColumnWidth = ({index}: {index: number}): number => {
    const {severityFormat} = this.props
    const column = getColumnFromData(this.props.data, index)
    const {
      currentMessageWidth,
      isMessageVisible,
      visibleColumnsCount,
    } = this.state

    switch (column) {
      case 'message':
        return currentMessageWidth
      default:
        let columnKey = column
        if (column === 'severity') {
          columnKey = `${column}_${severityFormat}`
        }
        const width = getColumnWidth(columnKey)
        if (!isMessageVisible) {
          const inc = currentMessageWidth / visibleColumnsCount
          return width + inc
        }
        return width
    }
  }

  private get rowCharLimit(): number {
    return calculateRowCharWidth(this.state.currentMessageWidth)
  }

  private calculateTotalHeight = (): number => {
    const data = getValuesFromData(this.props.data)

    if (this.props.isTruncated) {
      return data.length * ROW_HEIGHT
    }

    return _.reduce(
      data,
      (acc, __, index) => {
        return (
          acc +
          calculateMessageHeight(index, this.props.data, this.rowCharLimit)
        )
      },
      0
    )
  }

  private calculateRowHeight = ({index}: {index: number}): number => {
    return calculateMessageHeight(index, this.props.data, this.rowCharLimit)
  }

  private headerRenderer = ({key, style, columnIndex}) => {
    const column = getColumnFromData(this.props.data, columnIndex)
    const classes = 'logs-viewer--cell logs-viewer--cell-header'

    let columnKey: string = column

    if (column === 'severity') {
      columnKey = this.getSeverityColumn(column)
    }

    return (
      <div className={classes} style={style} key={key}>
        {header(columnKey, this.props.tableColumns)}
      </div>
    )
  }

  private getSeverityColumn(column: string): string {
    const {severityFormat} = this.props
    if (severityFormat === SeverityFormatOptions.dot) {
      return SeverityFormatOptions.dot
    }
    return column
  }

  private getSeverityDotText(text: string): JSX.Element {
    const {severityFormat} = this.props
    if (severityFormat === SeverityFormatOptions.dotText) {
      return <span className="logs-viewer--severity-text">{text}</span>
    }
  }

  private cellRenderer = ({key, style, rowIndex, columnIndex}) => {
    const {severityFormat, severityLevelColors} = this.props

    const column = getColumnFromData(this.props.data, columnIndex)
    const value = getValueFromData(this.props.data, rowIndex, columnIndex)

    let formattedValue: string | JSX.Element
    const isDotNeeded =
      severityFormat === SeverityFormatOptions.dot ||
      severityFormat === SeverityFormatOptions.dotText

    let title: string

    if (column === 'severity' && isDotNeeded) {
      title = value
      const colorLevel =
        severityLevelColors.find(lc => lc.level === value) ||
        severityLevelColors[0]
      formattedValue = (
        <>
          <div
            className={`logs-viewer--dot ${value}-severity`}
            title={value}
            data-index={rowIndex}
            style={this.severityDotStyle(colorLevel.color, colorLevel.level)}
          />
          {this.getSeverityDotText(value)}
        </>
      )
    } else {
      formattedValue = formatColumnValue(column, value, this.rowCharLimit)
      title = formattedValue
    }

    if (column === 'message') {
      formattedValue = this.renderMessage(formattedValue as string)
    }

    if (column === 'timestamp') {
      return (
        <div
          className="logs-viewer--cell"
          title={`Jump to '${value}'`}
          key={key}
          style={style}
          data-index={rowIndex}
        >
          <div
            data-tag-key={column}
            data-tag-value={value}
            onClick={this.handleTimestampClick(`${formattedValue}`)}
            data-index={rowIndex}
            className="logs-viewer--clickable"
          >
            {formattedValue}
          </div>
        </div>
      )
    }

    if (isClickable(column)) {
      return (
        <div
          className="logs-viewer--cell"
          title={`Filter by '${title}'`}
          key={key}
          style={style}
          data-index={rowIndex}
        >
          <div
            data-tag-key={column}
            data-tag-value={value}
            onClick={this.handleTagClick}
            data-index={rowIndex}
            className="logs-viewer--clickable"
          >
            {formattedValue}
          </div>
        </div>
      )
    }

    const wrapMessage = column === 'message' && !this.props.isTruncated

    return (
      <div
        className={classnames(`logs-viewer--cell  ${column}--cell`, {
          'message-wrap': wrapMessage,
        })}
        key={key}
        style={style}
        data-index={rowIndex}
      >
        {formattedValue}
      </div>
    )
  }

  private renderMessage = (formattedValue: string): JSX.Element => {
    const {notify} = this.props
    const {searchPattern} = this.state

    if (this.props.isTruncated) {
      return (
        <ExpandableMessage
          notify={notify}
          formattedValue={formattedValue}
          onExpand={this.props.onExpandMessage}
          searchPattern={searchPattern}
          maxWidth={this.currentWidth}
        />
      )
    }

    return (
      <LogsMessage
        notify={notify}
        formattedValue={formattedValue}
        searchPattern={searchPattern}
      />
    )
  }

  private severityDotStyle = (
    colorName: SeverityColorOptions,
    level: SeverityLevelOptions
  ): CSSProperties => {
    const severityColor = colorForSeverity(colorName, level)
    const brightSeverityColor = getBrighterColor(0.5, severityColor)

    return {
      background: `linear-gradient(45deg, ${severityColor}, ${brightSeverityColor}`,
    }
  }

  private handleTimestampClick = (time: string) => () => {
    const {onChooseCustomTime} = this.props
    const formattedTime = moment(time, DEFAULT_TIME_FORMAT).toISOString()
    onChooseCustomTime(formattedTime)
  }

  private handleTagClick = (e: MouseEvent<HTMLElement>) => {
    const {onTagSelection} = this.props
    const target = e.target as HTMLElement

    const selection = {
      tag: target.dataset.tagValue || target.parentElement.dataset.tagValue,
      key: target.dataset.tagKey || target.parentElement.dataset.tagKey,
    }

    onTagSelection(selection)
  }

  private get loadingStatus(): JSX.Element {
    return (
      <LoadingStatus
        status={this.props.searchStatus}
        lower={this.props.lower}
        upper={this.props.upper}
      />
    )
  }

  private get isLoadingTableData(): boolean {
    const {searchStatus} = this.props

    switch (searchStatus) {
      case SearchStatus.Loaded:
        return false
      default:
        return true
    }
  }

  private get isLoadingMore(): boolean {
    return this.props.queryCount > 0
  }

  private get scrollLoadingIndicator(): JSX.Element {
    const className = classnames('logs-viewer--scroll-loader', {
      loading: this.isLoadingMore,
    })

    return (
      <div className={className}>
        <h6>Loading more logs...</h6>
      </div>
    )
  }

  private get minTableWidth(): number {
    return getMinTableWidth(
      this.props.data,
      this.props.tableColumns,
      this.props.severityFormat
    )
  }
}

export default LogsTable
