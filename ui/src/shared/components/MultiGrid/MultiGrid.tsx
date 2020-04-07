import * as React from 'react'
import _ from 'lodash'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import {Grid, AutoSizer} from 'react-virtualized'

const SCROLLBAR_SIZE_BUFFER = 20
const ROW_HEIGHT = 30

type HeightWidthFunction = (arg: {index: number}) => number

export interface PropsMultiGrid {
  width: number
  height: number
  columnCount?: number
  classNameBottomLeftGrid?: string
  classNameBottomRightGrid?: string
  classNameTopLeftGrid?: string
  classNameTopRightGrid?: string
  fixedColumnCount?: number
  fixedRowCount?: number
  scrollToRow?: number
  scrollToColumn?: number
  rowCount?: number
  rowHeight?: number | HeightWidthFunction
  columnWidth?: number | HeightWidthFunction
  onScroll?: (arg: object) => {}
  cellRenderer?: (arg: object) => JSX.Element
  onMount?: (mg: MultiGrid) => void
  externalScroll: boolean
}

interface State {
  scrollToRow: number
  scrollLeft: number
  scrollTop: number
  scrollbarSize: number
  showHorizontalScrollbar: boolean
  showVerticalScrollbar: boolean
}

class MultiGrid extends React.PureComponent<PropsMultiGrid, State> {
  public static defaultProps = {
    classNameBottomLeftGrid: '',
    classNameBottomRightGrid: '',
    classNameTopLeftGrid: '',
    classNameTopRightGrid: '',
    fixedColumnCount: 0,
    fixedRowCount: 0,
    scrollToColumn: -1,
    scrollToRow: -1,
    styleBottomLeftGrid: {},
    styleBottomRightGrid: {},
    styleTopLeftGrid: {},
    styleTopRightGrid: {},
  }

  public static getDerivedStateFromProps(nextProps: PropsMultiGrid) {
    const {scrollToRow, rowCount, height} = nextProps

    const scrollTop = scrollToRow * ROW_HEIGHT
    const maxScrollTop = (rowCount + 1) * ROW_HEIGHT - (height + ROW_HEIGHT)
    const visibleRowsCount = Math.floor(height / ROW_HEIGHT)
    const maxRow = rowCount - visibleRowsCount / 2

    // hovering on this grid
    if (scrollTop < 0) {
      return {scrollToRow}
    }

    if (scrollToRow > maxRow) {
      return {scrollToRow: rowCount}
    }

    if (scrollTop > maxScrollTop) {
      return {scrollTop: maxScrollTop}
    }

    // hovering on another cell
    return {
      scrollToRow: scrollToRow - 1,
      scrollTop: Math.max(scrollToRow * ROW_HEIGHT - ROW_HEIGHT, 0),
    }
  }

  private bottomLeftGrid: Grid
  private bottomRightGrid: Grid
  private topLeftGrid: Grid
  private topRightGrid: Grid
  private leftGridWidth: number | null = 0
  private topGridHeight: number | null = 0
  private topRightGridStyle: object | null
  private containerTopStyle: object | null
  private containerBottomStyle: object | null
  private containerOuterStyle: object | null
  private topLeftGridStyle: object | null

  constructor(props: PropsMultiGrid, context) {
    super(props, context)

    this.state = {
      scrollToRow: props.scrollToRow,
      scrollLeft: 0,
      scrollTop: 0,
      scrollbarSize: 0,
      showHorizontalScrollbar: false,
      showVerticalScrollbar: false,
    }
  }

  public recomputeGridSize({columnIndex = 0, rowIndex = 0} = {}) {
    const {fixedColumnCount, fixedRowCount} = this.props

    const adjustedColumnIndex = Math.max(0, columnIndex - fixedColumnCount)
    const adjustedRowIndex = Math.max(0, rowIndex - fixedRowCount)

    if (this.bottomLeftGrid) {
      this.bottomLeftGrid.recomputeGridSize({
        columnIndex,
        rowIndex: adjustedRowIndex,
      })
    }
    if (this.bottomRightGrid) {
      this.bottomRightGrid.recomputeGridSize({
        columnIndex: adjustedColumnIndex,
        rowIndex: adjustedRowIndex,
      })
    }

    if (this.topLeftGrid) {
      this.topLeftGrid.recomputeGridSize({
        columnIndex,
        rowIndex,
      })
    }

    if (this.topRightGrid) {
      this.topRightGrid.recomputeGridSize({
        columnIndex: adjustedColumnIndex,
        rowIndex,
      })
    }

    this.leftGridWidth = null
    this.topGridHeight = null
    this.maybeCalculateCachedStyles(true)
  }

  public componentDidMount() {
    if (this.props.onMount) {
      this.props.onMount(this)
    }
  }

  public componentDidUpdate() {
    if (this.topRightGrid) {
      this.topRightGrid.forceUpdate()
    }
  }

  public render() {
    const {onScroll, ...rest} = this.props

    this.prepareForRender()

    if (this.props.width === 0 || this.props.height === 0) {
      return null
    }

    const {scrollLeft, scrollTop} = this.state

    return (
      <div style={this.containerOuterStyle}>
        <div style={this.containerTopStyle}>
          {this.renderTopLeftGrid(rest)}
          {this.renderTopRightGrid({
            ...rest,
            ...onScroll,
            scrollLeft,
          })}
        </div>
        <div style={this.containerBottomStyle}>
          {this.renderBottomLeftGrid({
            ...rest,
            onScroll,
            scrollTop,
          })}
          {this.renderBottomRightGrid({
            ...rest,
            onScroll,
            scrollLeft,
            scrollTop,
          })}
        </div>
      </div>
    )
  }

  public cellRendererBottomLeftGrid = ({rowIndex, ...rest}) => {
    const {cellRenderer, fixedRowCount, rowCount} = this.props

    if (rowIndex === rowCount - fixedRowCount) {
      return (
        <div
          key={rest.key}
          style={{
            ...rest.style,
            height: SCROLLBAR_SIZE_BUFFER,
          }}
        />
      )
    } else {
      return cellRenderer({
        ...rest,
        style: {
          ...rest.style,
        },
        parent: this,
        rowIndex: rowIndex + fixedRowCount,
      })
    }
  }

  private getLeftGridWidth(props: PropsMultiGrid) {
    const {fixedColumnCount, columnWidth} = props

    if (this.leftGridWidth == null) {
      if (typeof columnWidth === 'function') {
        let leftGridWidth = 0

        for (let index = 0; index < fixedColumnCount; index++) {
          leftGridWidth += columnWidth({index})
        }

        this.leftGridWidth = leftGridWidth
      } else {
        this.leftGridWidth = columnWidth * fixedColumnCount
      }
    }

    return this.leftGridWidth
  }

  private getRightGridWidth(props: PropsMultiGrid) {
    const {width} = props
    return width - this.getLeftGridWidth(props)
  }

  private getTopGridHeight(props: PropsMultiGrid) {
    const {fixedRowCount, rowHeight} = props

    if (this.topGridHeight == null) {
      if (typeof rowHeight === 'function') {
        let topGridHeight = 0

        for (let index = 0; index < fixedRowCount; index++) {
          topGridHeight += rowHeight({index})
        }

        this.topGridHeight = topGridHeight
      } else {
        this.topGridHeight = rowHeight * fixedRowCount
      }
    }

    return this.topGridHeight
  }

  private onScrollbarsScroll = (e: React.MouseEvent<HTMLElement>) => {
    const {scrollTop} = e.target as HTMLElement
    const {scrollLeft} = this.state

    this.onScroll({scrollTop, scrollLeft})
  }

  private onGridScroll = ({scrollLeft}) => {
    const {scrollTop} = this.state

    this.onScroll({scrollTop, scrollLeft})
  }

  private onScroll = scrollInfo => {
    const {onScroll, externalScroll} = this.props
    const {scrollLeft, scrollTop} = scrollInfo

    if (externalScroll) {
      return
    }

    this.setState({scrollLeft, scrollTop})

    if (onScroll) {
      onScroll(scrollInfo)
    }
  }

  private renderBottomLeftGrid(props) {
    const {fixedColumnCount, fixedRowCount, rowCount, columnWidth} = props
    const {scrollToRow} = this.state

    if (!fixedColumnCount) {
      return null
    }

    const calculatedRowCount = Math.max(rowCount - fixedRowCount, 0)

    return (
      <AutoSizer>
        {({width, height}) => (
          <FancyScrollbar
            style={{
              width,
              height: this.props.height - ROW_HEIGHT,
            }}
            autoHide={true}
            scrollTop={this.state.scrollTop}
            scrollLeft={this.state.scrollLeft}
            setScrollTop={this.onScrollbarsScroll}
          >
            <Grid
              {...props}
              scrollToRow={scrollToRow}
              cellRenderer={this.cellRendererBottomLeftGrid}
              className={this.props.classNameBottomLeftGrid}
              columnCount={fixedColumnCount}
              height={height}
              ref={this.bottomLeftGridRef}
              rowCount={calculatedRowCount}
              rowHeight={ROW_HEIGHT}
              columnWidth={columnWidth}
              style={{
                overflowY: 'hidden',
                height: calculatedRowCount * ROW_HEIGHT,
                position: 'absolute',
              }}
              tabIndex={null}
              width={width}
            />
          </FancyScrollbar>
        )}
      </AutoSizer>
    )
  }

  private renderBottomRightGrid(props) {
    const {
      columnCount,
      fixedColumnCount,
      fixedRowCount,
      rowCount,
      scrollLeft,
      scrollTop,
    } = props

    const {scrollToRow} = this.state

    const calculatedRowCount = Math.max(0, rowCount - fixedRowCount)

    const leftWidth = this.getLeftGridWidth(props)

    let passingProps = _.omit(props, ['scrollToColumn'])
    if (props.externalScroll) {
      passingProps = _.omit(props, ['scrollToColumn', 'scrollTop'])
    }

    return (
      <AutoSizer>
        {({width, height}) => (
          <FancyScrollbar
            style={{
              marginLeft: leftWidth,
              width: this.props.width - leftWidth,
              height: this.props.height - ROW_HEIGHT,
            }}
            autoHide={true}
            scrollTop={scrollTop}
            scrollLeft={scrollLeft}
            setScrollTop={this.onScrollbarsScroll}
          >
            <Grid
              {...passingProps}
              cellRenderer={this.cellRendererBottomRightGrid}
              className={this.props.classNameBottomRightGrid}
              columnCount={Math.max(0, columnCount - fixedColumnCount)}
              columnWidth={this.columnWidthRightGrid}
              overscanRowCount={100}
              height={height}
              ref={this.bottomRightGridRef}
              onScroll={this.onGridScroll}
              rowCount={calculatedRowCount}
              rowHeight={ROW_HEIGHT}
              scrollToRow={scrollToRow - fixedRowCount}
              style={{
                overflowY: 'hidden',
                height: calculatedRowCount * ROW_HEIGHT + SCROLLBAR_SIZE_BUFFER,
              }}
              width={width - leftWidth}
            />
          </FancyScrollbar>
        )}
      </AutoSizer>
    )
  }

  private renderTopLeftGrid(props) {
    const {fixedColumnCount, fixedRowCount} = props

    if (!fixedColumnCount || !fixedRowCount) {
      return null
    }

    return (
      <Grid
        {...props}
        className={this.props.classNameTopLeftGrid}
        columnCount={fixedColumnCount}
        height={this.getTopGridHeight(props)}
        ref={this.topLeftGridRef}
        rowCount={fixedRowCount}
        style={this.topLeftGridStyle}
        tabIndex={null}
        width={this.getLeftGridWidth(props)}
      />
    )
  }

  private renderTopRightGrid(props) {
    const {columnCount, fixedColumnCount, fixedRowCount, scrollLeft} = props

    if (!fixedRowCount) {
      return null
    }

    const width = this.getRightGridWidth(props)
    const height = this.getTopGridHeight(props)

    return (
      <Grid
        {...props}
        cellRenderer={this.cellRendererTopRightGrid}
        className={this.props.classNameTopRightGrid}
        columnCount={Math.max(0, columnCount - fixedColumnCount)}
        columnWidth={this.columnWidthRightGrid}
        height={height}
        onScroll={this.onGridScroll}
        ref={this.topRightGridRef}
        rowCount={fixedRowCount}
        scrollLeft={scrollLeft}
        style={this.topRightGridStyle}
        tabIndex={null}
        width={width}
      />
    )
  }

  private topLeftGridRef = ref => {
    this.topLeftGrid = ref
  }

  private topRightGridRef = ref => {
    this.topRightGrid = ref
  }

  /**
   * Avoid recreating inline styles each render; this bypasses Grid's shallowCompare.
   * This method recalculates styles only when specific props change.
   */
  private maybeCalculateCachedStyles(resetAll) {
    const {height, width} = this.props

    if (resetAll) {
      this.containerOuterStyle = {
        height,
        overflow: 'visible', // Let :focus outline show through
        width,
      }
    }

    if (resetAll) {
      this.containerTopStyle = {
        height: this.getTopGridHeight(this.props),
        position: 'relative',
        width,
      }

      this.containerBottomStyle = {
        height: height - this.getTopGridHeight(this.props),
        overflow: 'visible', // Let :focus outline show through
        position: 'relative',
        width,
      }
    }

    if (resetAll) {
      this.topLeftGridStyle = {
        left: 0,
        overflowX: 'hidden',
        overflowY: 'hidden',
        position: 'absolute',
        top: 0,
      }
    }

    if (resetAll) {
      this.topRightGridStyle = {
        left: this.getLeftGridWidth(this.props),
        overflowX: 'hidden',
        overflowY: 'hidden',
        position: 'absolute',
        top: 0,
      }
    }
  }

  private bottomLeftGridRef = ref => {
    this.bottomLeftGrid = ref
  }

  private bottomRightGridRef = ref => {
    this.bottomRightGrid = ref
  }

  private cellRendererBottomRightGrid = ({columnIndex, rowIndex, ...rest}) => {
    const {cellRenderer, fixedColumnCount, fixedRowCount} = this.props

    return cellRenderer({
      ...rest,
      columnIndex: columnIndex + fixedColumnCount,
      parent: this,
      rowIndex: rowIndex + fixedRowCount,
    })
  }

  private cellRendererTopRightGrid = ({columnIndex, ...rest}) => {
    const {cellRenderer, columnCount, fixedColumnCount} = this.props

    if (columnIndex === columnCount - fixedColumnCount) {
      return (
        <div
          key={rest.key}
          style={{
            ...rest.style,
            width: SCROLLBAR_SIZE_BUFFER,
          }}
        />
      )
    } else {
      return cellRenderer({
        ...rest,
        columnIndex: columnIndex + fixedColumnCount,
        parent: this,
      })
    }
  }

  private columnWidthRightGrid = ({index}) => {
    const {columnCount, fixedColumnCount, columnWidth} = this.props
    const {scrollbarSize, showHorizontalScrollbar} = this.state

    // An extra cell is added to the count
    // This gives the smaller Grid extra room for offset,
    // In case the main (bottom right) Grid has a scrollbar
    // If no scrollbar, the extra space is overflow:hidden anyway
    if (showHorizontalScrollbar && index === columnCount - fixedColumnCount) {
      return scrollbarSize
    }

    return _.isFunction(columnWidth)
      ? columnWidth({index: index + fixedColumnCount})
      : columnWidth
  }

  private prepareForRender() {
    this.maybeCalculateCachedStyles(false)
  }
}

export default MultiGrid
