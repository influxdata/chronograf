// Libraries
import React, {Component, CSSProperties, MouseEvent} from 'react'
import {connect} from 'react-redux'
import {filter, isEqual} from 'lodash'
import NanoDate from 'nano-date'
import ReactResizeDetector from 'react-resize-detector'
import memoizeOne from 'memoize-one'
import format from 'date-fns/format'

// Components
import D from 'src/external/dygraph'
import DygraphLegend from 'src/shared/components/DygraphLegend'
import StaticLegend from 'src/shared/components/StaticLegend'
import Annotations from 'src/shared/components/Annotations'
import Crosshair from 'src/shared/components/Crosshair'

// Utils
import getRange, {getStackedRange} from 'src/shared/parsing/getRangeForDygraph'
import {getDeep} from 'src/utils/wrappers'
import {numberValueFormatter} from 'src/utils/formatting'

// Constants
import {
  AXES_SCALE_OPTIONS,
  DEFAULT_AXIS,
} from 'src/dashboards/constants/cellEditor'
import {buildDefaultYLabel} from 'src/shared/presenters'
import {NULL_HOVER_TIME} from 'src/shared/constants/tableGraph'
import {
  LINE_COLORS,
  LABEL_WIDTH,
  CHAR_PIXELS,
  barPlotter,
} from 'src/shared/graphs/helpers'
import {getLineColorsHexes} from 'src/shared/constants/graphColorPalettes'
const {LOG, BASE_10, BASE_2} = AXES_SCALE_OPTIONS

import {ErrorHandling} from 'src/shared/decorators/errors'
// 加入自定义legend小数点精度
import {DecimalPlaces} from 'src/types/dashboards'

// Types
import {
  Axes,
  Query,
  CellType,
  RuleValues,
  TimeRange,
  DygraphData,
  DygraphClass,
  DygraphSeries,
} from 'src/types'
import {LineColor} from 'src/types/colors'


const Dygraphs = D as any

const getRangeMemoizedY = memoizeOne(getRange)

const DEFAULT_DYGRAPH_OPTIONS = {
  rightGap: 0,
  axisLineWidth: 2,
  gridLineWidth: 1,
  colors: LINE_COLORS,
  animatedZooms: true,
  highlightCircleSize: 3,
  labelsSeparateLines: false,
  hideOverlayOnMouseOut: false,
  highlightSeriesBackgroundAlpha: 1.0,
  highlightSeriesBackgroundColor: 'rgb(41, 41, 51)',
}

interface Props {
  type: CellType
  cellID: string
  queries: Query[]
  timeSeries: DygraphData
  labels: string[]
  options: dygraphs.Options
  containerStyle: object // TODO
  dygraphSeries: DygraphSeries
  timeRange: TimeRange
  colors: LineColor[]
  handleSetHoverTime: (t: string) => void
  ruleValues?: RuleValues
  axes?: Axes
  isGraphFilled?: boolean
  staticLegend?: boolean
  onZoom?: (timeRange: TimeRange) => void
  mode?: string
  underlayCallback?: () => void
  // 增加精度sup
  decimalPlaces: DecimalPlaces
}

interface State {
  staticLegendHeight: number
  xAxisRange: [number, number]
  isMouseInLegend: boolean
}

@ErrorHandling
class Dygraph extends Component<Props, State> {
  public static defaultProps: Partial<Props> = {
    axes: {
      x: {
        bounds: [null, null],
        tradingHours1: [null,null],
        tradingHours2: [null,null],
        ...DEFAULT_AXIS,
      },
      y: {
        bounds: [null, null],
        tradingHours1: [null,null],
        tradingHours2: [null,null],
        ...DEFAULT_AXIS,
      },
    },
    containerStyle: {},
    isGraphFilled: true,
    onZoom: () => {},
    staticLegend: false,
    handleSetHoverTime: () => {},
    underlayCallback: () => {},
  }

  private graphRef: React.RefObject<HTMLDivElement>
  private dygraph: DygraphClass
  private dygraphOptions?: dygraphs.Options

  constructor(props: Props) {
    super(props)

    this.state = {
      staticLegendHeight: 0,
      xAxisRange: [0, 0],
      isMouseInLegend: false,
    }

    this.graphRef = React.createRef<HTMLDivElement>()
  }

  public componentDidMount() {
    const options = this.collectDygraphOptions()
    const initialOptions = {...DEFAULT_DYGRAPH_OPTIONS, ...options}

    this.dygraph = new Dygraphs(
      this.graphRef.current,
      this.timeSeries,
      initialOptions
    )

    this.dygraphOptions = options
    this.setState({xAxisRange: this.dygraph.xAxisRange()})
  }

  public componentWillUnmount() {
    if (this.dygraph) {
      this.dygraph.destroy()
      delete this.dygraph
    }
  }

  public componentDidUpdate(prevProps: Props) {
    const dygraph = this.dygraph
    const options = this.collectDygraphOptions()
    const optionsChanged = this.haveDygraphOptionsChanged(options)
    const timeRangeChanged = !isEqual(prevProps.timeRange, this.props.timeRange)
    const staticLegendChanged =
      prevProps.staticLegend !== this.props.staticLegend

    if (optionsChanged) {
      dygraph.updateOptions(options)
      this.dygraphOptions = options
    }

    if (dygraph.isZoomed('x') && timeRangeChanged) {
      dygraph.resetZoom()
    }

    if (staticLegendChanged || optionsChanged) {
      setTimeout(this.resize, 0)
    }
  }

  public render() {
    const {staticLegendHeight, xAxisRange} = this.state
    // sup
    const {staticLegend, cellID,decimalPlaces} = this.props
    const {
      axes: {
        y: {prefix, suffix},
      },
    } = this.props

    return (
      <div
        className="dygraph-child"
        onMouseMove={this.handleShowLegend}
        onMouseLeave={this.handleHideLegend}
      >
        {this.dygraph && (
          <div className="dygraph-addons">
            {this.areAnnotationsVisible && (
              <Annotations
                dygraph={this.dygraph}
                dWidth={this.dygraph.getArea().w}
                staticLegendHeight={staticLegendHeight}
                xAxisRange={xAxisRange}
              />
            )}
            <DygraphLegend
              cellID={cellID}
              dygraph={this.dygraph}
              onHide={this.handleHideLegend}
              onShow={this.handleShowLegend}
              onMouseEnter={this.handleMouseEnterLegend}
              decimalPlaces={decimalPlaces}
              suffix={suffix}
              prefix={prefix}
            />
            <Crosshair
              dygraph={this.dygraph}
              staticLegendHeight={staticLegendHeight}
            />
          </div>
        )}
        {staticLegend && (
          <StaticLegend
            dygraphSeries={this.colorDygraphSeries}
            dygraph={this.dygraph}
            height={staticLegendHeight}
            onUpdateHeight={this.handleUpdateStaticLegendHeight}
          />
        )}
        {this.nestedGraph &&
          React.cloneElement(this.nestedGraph, {
            staticLegendHeight,
          })}
        <div
          id={`graph-ref-${cellID}`}
          className="dygraph-child-container"
          ref={this.graphRef}
          style={this.dygraphStyle}
        >
          <ReactResizeDetector
            resizableElementId={`graph-ref-${cellID}`}
            handleWidth={true}
            handleHeight={true}
            onResize={this.resize}
          />
        </div>
      </div>
    )
  }

  private get nestedGraph(): JSX.Element {
    const {children} = this.props

    if (children) {
      if (children[0]) {
        return children[0]
      }

      return children as JSX.Element
    }

    return null
  }

  private get dygraphStyle(): CSSProperties {
    const {containerStyle, staticLegend} = this.props
    const {staticLegendHeight} = this.state

    if (staticLegend) {
      const cellVerticalPadding = 16

      return {
        ...containerStyle,
        zIndex: 2,
        height: `calc(100% - ${staticLegendHeight + cellVerticalPadding}px)`,
      }
    }

    return {...containerStyle, zIndex: 2}
  }

  private get labelWidth() {
    const {
      axes: {y},
    } = this.props

    return (
      LABEL_WIDTH +
      y.prefix.length * CHAR_PIXELS +
      y.suffix.length * CHAR_PIXELS
    )
  }

  private get timeSeries() {
    const {timeSeries} = this.props
    // Avoid 'Can't plot empty data set' errors by falling back to a default
    // dataset that's valid for Dygraph.
    // for (let i = 0; i < timeSeries.length; i++) {
    //   const d = timeSeries[i][0]
    //   // tslint:disable-next-line:no-console
    //   console.log(format(d, 'YYYY-MM-DD HH:mm:ss'),Date.parse(d.toString()))
    // }
    return timeSeries && timeSeries.length ? timeSeries : [[0]]
  }

  private get colorDygraphSeries() {
    const {dygraphSeries, colors} = this.props
    const numSeries = Object.keys(dygraphSeries).length
    const dygraphSeriesKeys = Object.keys(dygraphSeries).sort()
    const lineColors = getLineColorsHexes(colors, numSeries)
    const coloredDygraphSeries = {}

    for (const seriesName in dygraphSeries) {
      if (dygraphSeries.hasOwnProperty(seriesName)) {
        const series = dygraphSeries[seriesName]
        const color = lineColors[dygraphSeriesKeys.indexOf(seriesName)]
        coloredDygraphSeries[seriesName] = {...series, color}
      }
    }

    return coloredDygraphSeries
  }

  private get areAnnotationsVisible() {
    return !!this.dygraph
  }

  private getYRange = (timeSeries: DygraphData): [number, number] => {
    const {
      options,
      axes: {y},
      ruleValues,
    } = this.props

    if (options.stackedGraph) {
      return getStackedRange(y.bounds)
    }

    let range = getRangeMemoizedY(timeSeries, y.bounds, ruleValues)

    const [min, max] = range

    // Bug in Dygraph calculates a negative range for logscale when min range is 0
    if (y.scale === LOG && min <= 0) {
      range = [0.01, max]
    }

    return range
  }

  private handleZoom = (lower: number, upper: number) => {
    const {onZoom} = this.props

    if (this.dygraph.isZoomed('x')) {
      return onZoom({
        lower: this.formatTimeRange(lower),
        upper: this.formatTimeRange(upper),
      })
    }

    return onZoom({lower: null, upper: null})
  }

  private handleDraw = () => {
    if (!this.dygraph) {
      return
    }

    const {xAxisRange} = this.state
    const newXAxisRange = this.dygraph.xAxisRange()
    if (!isEqual(xAxisRange, newXAxisRange)) {
      this.setState({xAxisRange: newXAxisRange})
    }
  }

  private formatYVal = (yval: number, __, opts: (name: string) => number) => {
    const {
      axes: {
        y: {prefix, suffix},
      },
    } = this.props

    return numberValueFormatter(yval, opts, prefix, suffix)
  }

  private eventToTimestamp = ({
    pageX: pxBetweenMouseAndPage,
  }: MouseEvent<HTMLDivElement>): string => {
    const pxBetweenGraphAndPage = this.graphRef.current.getBoundingClientRect()
      .left
    const graphXCoordinate = pxBetweenMouseAndPage - pxBetweenGraphAndPage
    const timestamp = this.dygraph.toDataXCoord(graphXCoordinate)
    const [xRangeStart] = this.dygraph.xAxisRange()
    const clamped = Math.max(xRangeStart, timestamp)
    //console.log('sup',format(xRangeStart, 'YYYY-MM-DD HH:mm:ss'),format(timestamp, 'YYYY-MM-DD HH:mm:ss'))
    return String(clamped)
  }

  private handleHideLegend = () => {
    this.setState({isMouseInLegend: false})
    this.props.handleSetHoverTime(NULL_HOVER_TIME)
  }

  private handleShowLegend = (e: MouseEvent<HTMLDivElement>): void => {
    const {isMouseInLegend} = this.state

    if (isMouseInLegend) {
      return
    }

    const newTime = this.eventToTimestamp(e)
    this.props.handleSetHoverTime(newTime)
  }

  private collectDygraphOptions(): dygraphs.Options {
    const {
      labels,
      axes: {y},
      type,
      underlayCallback,
      isGraphFilled,
    } = this.props

    const {
      colorDygraphSeries,
      handleDraw,
      handleZoom,
      timeSeries,
      labelWidth,
      formatYVal,
    } = this

    const options = {
      labels,
      underlayCallback,
      file: timeSeries,
      zoomCallback: handleZoom,
      drawCallback: handleDraw,
      fillGraph: isGraphFilled,
      logscale: y.scale === LOG,
      ylabel: this.getLabel('y'),
      series: colorDygraphSeries,
      plotter: type === CellType.Bar ? barPlotter : null,
      axes: {
        y: {
          axisLabelWidth: labelWidth,
          labelsKMB: y.base === BASE_10,
          labelsKMG2: y.base === BASE_2,
          axisLabelFormatter: formatYVal,
          valueRange: this.getYRange(timeSeries),
        },
      },
      ...this.props.options,
    }
    // console.log('sup',options)
    return options
  }

  private haveDygraphOptionsChanged(nextOptions: dygraphs.Options): boolean {
    const options = this.dygraphOptions
    const pred = (__, key) => key !== 'file'

    // Peform a deep comparison of the current options and next options, but
    // check the `file` property of each object by reference rather than by
    // logical identity since it can be quite large (it contains all the time
    // series data)
    return (
      !isEqual(filter(options, pred), filter(nextOptions, pred)) ||
      options.file !== nextOptions.file
    )
  }

  private getLabel = (axis: string): string => {
    const {axes, queries} = this.props
    const label = getDeep<string>(axes, `${axis}.label`, '')
    const queryConfig = getDeep(queries, '0.queryConfig', false)

    if (label || !queryConfig) {
      return label
    }

    return buildDefaultYLabel(queryConfig)
  }

  private resize = () => {
    if (this.dygraph) {
      this.dygraph.resizeElements_()
      this.dygraph.predraw_()
      this.dygraph.resize()
    }
  }

  private formatTimeRange = (date: number): string => {
    if (!date) {
      return ''
    }

    const nanoDate = new NanoDate(date)

    return nanoDate.toISOString()
  }

  private handleUpdateStaticLegendHeight = (staticLegendHeight: number) => {
    this.setState({staticLegendHeight})
  }

  private handleMouseEnterLegend = () => {
    this.setState({isMouseInLegend: true})
  }
}

const mapStateToProps = ({annotations: {mode}}) => ({
  mode,
})

export default connect(mapStateToProps, null)(Dygraph)
