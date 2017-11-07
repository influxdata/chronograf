import * as React from 'react'
import * as PropTypes from 'prop-types'
import * as _ from 'lodash'
import ReactGridLayout, {WidthProvider} from 'react-grid-layout'
import Resizeable from 'react-resizable'

import Layout from 'shared/components/Layout'
import {
  AutoRefresh,
  Cell,
  ManualRefresh,
  Source,
  Template,
  TimeRange,
} from 'src/types'

import {
  // TODO: get these const values dynamically
  STATUS_PAGE_ROW_COUNT,
  PAGE_HEADER_HEIGHT,
  PAGE_CONTAINER_MARGIN,
  LAYOUT_MARGIN,
  DASHBOARD_LAYOUT_ROW_HEIGHT,
} from 'shared/constants'

const GridLayout = WidthProvider(ReactGridLayout)

export interface LayoutRendererProps {
  autoRefresh: AutoRefresh
  manualRefresh?: ManualRefresh
  timeRange: TimeRange
  cells: Cell[]
  templates: Template[]
  host: string
  source: Source
  sources: Source[]
  onPositionChange: (newCells: Cell[]) => void
  onEditCell: () => void
  onDeleteCell: () => void
  onSummonOverlayTechnologies: () => void
  synchronizer: () => void
  onCancelEditCell: () => void
  onZoom: () => void
  isStatusPage: boolean
  isEditable: boolean
}

export interface LayoutRendererState {
  rowHeight: number
  resizeCoords: null
}

class LayoutRenderer extends React.Component<
  LayoutRendererProps,
  LayoutRendererState
> {
  constructor(props: LayoutRendererProps) {
    super(props)

    this.state = {
      rowHeight: this.calculateRowHeight(),
      resizeCoords: null,
    }
  }

  private handleLayoutChange = layout => {
    if (!this.props.onPositionChange) {
      return
    }

    const newCells = this.props.cells.map(cell => {
      const l = layout.find(ly => ly.i === cell.i)
      const newLayout = {x: l.x, y: l.y, h: l.h, w: l.w}
      return {...cell, ...newLayout}
    })

    this.props.onPositionChange(newCells)
  }

  // ensures that Status Page height fits the window
  private calculateRowHeight = () => {
    const {isStatusPage} = this.props

    return isStatusPage
      ? (window.innerHeight -
          STATUS_PAGE_ROW_COUNT * LAYOUT_MARGIN -
          PAGE_HEADER_HEIGHT -
          PAGE_CONTAINER_MARGIN -
          PAGE_CONTAINER_MARGIN) /
          STATUS_PAGE_ROW_COUNT
      : DASHBOARD_LAYOUT_ROW_HEIGHT
  }

  private handleCellResize = (__, oldCoords, resizeCoords) => {
    if (_.isEqual(oldCoords, resizeCoords)) {
      return
    }

    this.setState({resizeCoords})
  }

  public render() {
    const {
      host,
      cells,
      source,
      sources,
      onZoom,
      templates,
      timeRange,
      isEditable,
      onEditCell,
      autoRefresh,
      manualRefresh,
      onDeleteCell,
      synchronizer,
      onCancelEditCell,
      onSummonOverlayTechnologies,
    } = this.props

    const {rowHeight, resizeCoords} = this.state
    const isDashboard = !!this.props.onPositionChange

    return (
      <Resizeable onResize={this.handleCellResize}>
        <GridLayout
          layout={cells}
          cols={12}
          rowHeight={rowHeight}
          margin={[LAYOUT_MARGIN, LAYOUT_MARGIN]}
          containerPadding={[0, 0]}
          useCSSTransforms={false}
          onResize={this.handleCellResize}
          onLayoutChange={this.handleLayoutChange}
          draggableHandle={'.dash-graph--name'}
          isDraggable={isDashboard}
          isResizable={isDashboard}
        >
          {cells.map(cell => (
            <div key={cell.i}>
              <Layout
                key={cell.i}
                cell={cell}
                host={host}
                source={source}
                onZoom={onZoom}
                sources={sources}
                templates={templates}
                timeRange={timeRange}
                isEditable={isEditable}
                onEditCell={onEditCell}
                resizeCoords={resizeCoords}
                autoRefresh={autoRefresh}
                manualRefresh={manualRefresh}
                onDeleteCell={onDeleteCell}
                synchronizer={synchronizer}
                onCancelEditCell={onCancelEditCell}
                onSummonOverlayTechnologies={onSummonOverlayTechnologies}
              />
            </div>
          ))}
        </GridLayout>
      </Resizeable>
    )
  }
}

const {arrayOf, bool, func, number, shape, string} = PropTypes

export default LayoutRenderer
