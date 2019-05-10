// Libraries
import React, {PureComponent, ChangeEvent} from 'react'
import {connect} from 'react-redux'
import _ from 'lodash'
import classnames from 'classnames'
import uuid from 'uuid'

// Components
import DygraphLegendSort from 'src/shared/components/DygraphLegendSort'

// Actions
import * as actions from 'src/dashboards/actions'

// Utils
import {makeLegendStyles} from 'src/shared/graphs/helpers'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

// Constants
import {NO_CELL} from 'src/shared/constants'

// Types
import {SeriesLegendData} from 'src/types/dygraphs'
import {DygraphClass} from 'src/types'

// 加入自定义legend小数点精度
import {DecimalPlaces} from 'src/types/dashboards'
import {toFixed} from 'src/shared/utils/decimalPlaces'

interface Props {
  hoverTime: number
  dygraph: DygraphClass
  cellID: string
  onHide: () => void
  onShow: (e: MouseEvent) => void
  activeCellID: string
  setActiveCell: (cellID: string) => void
  onMouseEnter: () => void
  // sup 增加精度 以及对百分号的判断
  decimalPlaces: DecimalPlaces
  suffix: string
  prefix: string
}

interface LegendData {
  x: number
  series: SeriesLegendData[]
  xHTML: string
}

interface State {
  legend: LegendData
  sortType: string
  isAscending: boolean
  filterText: string
  isFilterVisible: boolean
  legendStyles: object
  pageX: number | null
  cellID: string
}

@ErrorHandling
class DygraphLegend extends PureComponent<Props, State> {
  private legendRef: HTMLElement | null = null

  constructor(props: Props) {
    super(props)

    this.props.dygraph.updateOptions({
      legendFormatter: this.legendFormatter,
      highlightCallback: this.highlightCallback,
      unhighlightCallback: this.unhighlightCallback,
    })

    this.state = {
      legend: {
        x: null,
        series: [],
        xHTML: '',
      },
      sortType: 'numeric',
      isAscending: false,
      filterText: '',
      isFilterVisible: false,
      legendStyles: {},
      pageX: null,
      cellID: null,
    }
  }

  public componentWillUnmount() {
    if (
      !this.props.dygraph.graphDiv ||
      !this.props.dygraph.visibility().find(bool => bool === true)
    ) {
      this.setState({filterText: ''})
    }
  }

  public render() {
    const {onMouseEnter} = this.props
    const {legend, filterText, isAscending, isFilterVisible} = this.state
    // sup
    const {decimalPlaces} = this.props
    const {prefix,suffix} = this.props

    return (
      <div
        className={`dygraph-legend ${this.hidden}`}
        ref={el => (this.legendRef = el)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={this.handleHide}
        style={this.styles}
      >
        <div className="dygraph-legend--header">
          <div className="dygraph-legend--timestamp">{legend.xHTML}</div>
          <DygraphLegendSort
            isAscending={isAscending}
            isActive={this.isAphaSort}
            top="A"
            bottom="Z"
            onSort={this.handleSortLegend('alphabetic')}
          />
          <DygraphLegendSort
            isAscending={isAscending}
            isActive={this.isNumSort}
            top="0"
            bottom="9"
            onSort={this.handleSortLegend('numeric')}
          />
          <button
            className={classnames('btn btn-square btn-xs', {
              'btn-default': !isFilterVisible,
              'btn-primary': isFilterVisible,
            })}
            onClick={this.handleToggleFilter}
          >
            <span className="icon search" />
          </button>
        </div>
        {isFilterVisible && (
          <input
            className="dygraph-legend--filter form-control input-xs"
            type="text"
            value={filterText}
            onChange={this.handleLegendInputChange}
            placeholder="Filter items..."
            autoFocus={true}
          />
        )}
        <div className="dygraph-legend--contents">
          {this.filtered.map(({label, color, y, isHighlighted}) => {
            // sup
            let yString = ''
            if (suffix === '%') {
              yString = toFixed(y * 100, decimalPlaces)
            } else {
              yString = toFixed(y, decimalPlaces)
            }
            yString = this.formatToLocale(+yString)
            yString = `${prefix}${yString}${suffix}`

            const seriesClass = isHighlighted
              ? 'dygraph-legend--row highlight'
              : 'dygraph-legend--row'
            return (
              <div key={uuid.v4()} className={seriesClass}>
                <span style={{color}}>{label}</span>
                <figure>{yString || 'no value'}</figure>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  private handleHide = (): void => {
    this.props.onHide()
    this.props.setActiveCell(NO_CELL)
  }

  private handleToggleFilter = (): void => {
    this.setState({
      isFilterVisible: !this.state.isFilterVisible,
      filterText: '',
    })
  }

  private handleLegendInputChange = (
    e: ChangeEvent<HTMLInputElement>
  ): void => {
    const {dygraph} = this.props
    const {legend} = this.state
    const filterText = e.target.value

    legend.series.map((__, i) => {
      if (!legend.series[i]) {
        return dygraph.setVisibility(i, true)
      }

      dygraph.setVisibility(i, !!legend.series[i].label.match(filterText))
    })

    this.setState({filterText})
  }

  private handleSortLegend = (sortType: string) => () => {
    this.setState({sortType, isAscending: !this.state.isAscending})
  }

  private highlightCallback = (e: MouseEvent) => {
    if (this.props.activeCellID !== this.props.cellID) {
      this.props.setActiveCell(this.props.cellID)
    }

    this.setState({pageX: e.pageX})
    this.props.onShow(e)
  }

  private legendFormatter = (legend: LegendData) => {
    if (!legend.x) {
      return ''
    }

    const {legend: prevLegend} = this.state
    const highlighted = legend.series.find(s => s.isHighlighted)
    const prevHighlighted = prevLegend.series.find(s => s.isHighlighted)

    const yVal = highlighted && highlighted.y
    const prevY = prevHighlighted && prevHighlighted.y

    if (legend.x === prevLegend.x && yVal === prevY) {
      return ''
    }

    this.setState({legend})
    return ''
  }

  // sup
  private formatToLocale(n: number): string {
    const maximumFractionDigits = 20
    return n.toLocaleString(undefined, {maximumFractionDigits})
  }

  private unhighlightCallback = (e: MouseEvent) => {
    const {top, bottom, left, right} = this.legendRef.getBoundingClientRect()

    const mouseY = e.clientY
    const mouseX = e.clientX

    const mouseBuffer = 5
    const mouseInLegendY = mouseY <= bottom && mouseY >= top - mouseBuffer
    const mouseInLegendX = mouseX <= right && mouseX >= left
    const isMouseHoveringLegend = mouseInLegendY && mouseInLegendX

    if (!isMouseHoveringLegend) {
      this.handleHide()
    }
  }

  private get filtered(): SeriesLegendData[] {
    const {legend, sortType, isAscending, filterText} = this.state
    const withValues = legend.series.filter(s => !_.isNil(s.y))
    const sorted = _.sortBy(
      withValues,
      ({y, label}) => (sortType === 'numeric' ? y : label)
    )

    const ordered = isAscending ? sorted : sorted.reverse()
    return ordered.filter(s => s.label.match(filterText))
  }

  private get isAphaSort(): boolean {
    return this.state.sortType === 'alphabetic'
  }

  private get isNumSort(): boolean {
    return this.state.sortType === 'numeric'
  }

  private get isVisible(): boolean {
    const {cellID, activeCellID} = this.props

    return cellID === activeCellID
  }

  private get hidden(): string {
    if (this.isVisible) {
      return ''
    }

    return 'hidden'
  }

  private get styles() {
    const {
      dygraph,
      dygraph: {graphDiv},
      hoverTime,
    } = this.props

    const legendHoverX = Math.max(dygraph.toDomXCoord(hoverTime), 0)
    return makeLegendStyles(graphDiv, this.legendRef, legendHoverX)
  }
}

const mapDispatchToProps = {
  setActiveCell: actions.setActiveCell,
}

const mapStateToProps = ({dashboardUI}) => ({
  activeCellID: dashboardUI.activeCellID,
  hoverTime: +dashboardUI.hoverTime,
})


export default connect(mapStateToProps, mapDispatchToProps)(DygraphLegend)
