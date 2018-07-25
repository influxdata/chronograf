// Libraries
import React, {Component, CSSProperties} from 'react'
import ReactGridLayout, {
  WidthProvider,
  Layout as LayoutType,
} from 'react-grid-layout'

// Components
import Authorized, {EDITOR_ROLE} from 'src/auth/Authorized'
import Layout from 'src/shared/components/Layout'
const GridLayout = WidthProvider(ReactGridLayout)
import StyleInterceptor from 'src/shared/components/LayoutSizeInterceptor'

// Utils
import {fastMap} from 'src/utils/fast'

// Constants
import {
  // TODO: get these const values dynamically
  STATUS_PAGE_ROW_COUNT,
  PAGE_HEADER_HEIGHT,
  PAGE_CONTAINER_MARGIN,
  LAYOUT_MARGIN,
  DASHBOARD_LAYOUT_ROW_HEIGHT,
} from 'src/shared/constants'

// Types
import {TimeRange, Cell, Template, Source} from 'src/types'

import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  source: Source
  cells: Cell[]
  timeRange: TimeRange
  templates: Template[]
  sources: Source[]
  host: string
  autoRefresh: number
  manualRefresh: number
  isStatusPage: boolean
  isEditable: boolean
  onZoom?: () => void
  onCloneCell?: () => void
  onDeleteCell?: () => void
  onSummonOverlayTechnologies?: () => void
  onPositionChange?: (cells: Cell[]) => void
}

interface State {
  rowHeight: number
  isResizing: boolean
  resizingCellID: string
}

export interface ResizeContextType {
  isResizing: boolean
  resizingCellID: string
}

export const ResizeContext = React.createContext()

@ErrorHandling
class LayoutRenderer extends Component<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      rowHeight: this.calculateRowHeight(),
      resizingCellID: '',
      isResizing: false,
    }
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
      autoRefresh,
      manualRefresh,
      onDeleteCell,
      onCloneCell,
      onSummonOverlayTechnologies,
    } = this.props

    const {rowHeight, isResizing, resizingCellID} = this.state
    const isDashboard = !!this.props.onPositionChange

    return (
      <ResizeContext.Provider value={{isResizing, resizingCellID}}>
        <Authorized
          requiredRole={EDITOR_ROLE}
          propsOverride={{
            isDraggable: false,
            isResizable: false,
            draggableHandle: null,
          }}
        >
          <GridLayout
            layout={cells}
            cols={12}
            rowHeight={rowHeight}
            margin={[LAYOUT_MARGIN, LAYOUT_MARGIN]}
            containerPadding={[0, 0]}
            useCSSTransforms={false}
            onLayoutChange={this.handleLayoutChange}
            draggableHandle={'.dash-graph--draggable'}
            isDraggable={isDashboard}
            isResizable={isDashboard}
            onResizeStart={this.handleResizeStart}
            onResizeStop={this.handleResizeStop}
          >
            {fastMap(cells, cell => (
              <StyleInterceptor
                key={cell.i}
                onInterceptStyle={this.interceptStyle}
              >
                <Authorized
                  requiredRole={EDITOR_ROLE}
                  propsOverride={{
                    isEditable: false,
                  }}
                >
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
                    autoRefresh={autoRefresh}
                    onDeleteCell={onDeleteCell}
                    onCloneCell={onCloneCell}
                    manualRefresh={manualRefresh}
                    onSummonOverlayTechnologies={onSummonOverlayTechnologies}
                  />
                </Authorized>
              </StyleInterceptor>
            ))}
          </GridLayout>
        </Authorized>
      </ResizeContext.Provider>
    )
  }

  private interceptStyle = (style: CSSProperties): void => {
    console.log('style', style)
  }

  private handleResizeStart = (_: LayoutType[], oldItem: LayoutType): void => {
    this.setState({isResizing: true, resizingCellID: oldItem.i})
  }

  private handleResizeStop = (): void => {
    this.setState({isResizing: false, resizingCellID: ''})
  }

  private handleLayoutChange = layout => {
    if (!this.props.onPositionChange) {
      return
    }

    let changed = false

    const newCells = this.props.cells.map(cell => {
      const l = layout.find(ly => ly.i === cell.i)

      if (
        cell.x !== l.x ||
        cell.y !== l.y ||
        cell.h !== l.h ||
        cell.w !== l.w
      ) {
        changed = true
      }

      const newLayout = {
        x: l.x,
        y: l.y,
        h: l.h,
        w: l.w,
      }

      return {
        ...cell,
        ...newLayout,
      }
    })

    if (changed) {
      this.props.onPositionChange(newCells)
    }
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
}

export default LayoutRenderer
