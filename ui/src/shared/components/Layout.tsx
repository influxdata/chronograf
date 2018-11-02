// Libraries
import React, {Component} from 'react'
import _ from 'lodash'

// Components
import WidgetCell from 'src/shared/components/WidgetCell'
import LayoutCell from 'src/shared/components/LayoutCell'
import RefreshingGraph from 'src/shared/components/RefreshingGraph'

// Utils
import {buildQueriesForLayouts} from 'src/utils/buildQueriesForLayouts'
import {getDeep} from 'src/utils/wrappers'

// Constants
import {IS_STATIC_LEGEND} from 'src/shared/constants'

// Types
import {TimeRange, Cell, Template, Source, QueryType} from 'src/types'
import {TimeSeriesServerResponse} from 'src/types/series'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {GrabDataForDownloadHandler} from 'src/types/layout'
import {VisType} from 'src/types/flux'

interface Props {
  cell: Cell
  timeRange: TimeRange
  templates: Template[]
  source: Source
  sources: Source[]
  host: string
  isEditable: boolean
  manualRefresh: number
  onZoom: () => void
  onDeleteCell: () => void
  onCloneCell: () => void
  onSummonOverlayTechnologies: () => void
}

interface State {
  cellData: TimeSeriesServerResponse[]
  cellFluxData: string
  visType: VisType
}

@ErrorHandling
class Layout extends Component<Props, State> {
  public state = {
    cellData: [],
    cellFluxData: '',
    visType: VisType.Graph,
  }

  public render() {
    const {
      cell,
      templates,
      isEditable,
      onCloneCell,
      onDeleteCell,
      onSummonOverlayTechnologies,
    } = this.props
    const {cellData, cellFluxData} = this.state

    return (
      <LayoutCell
        cell={cell}
        cellData={cellData}
        cellFluxData={cellFluxData}
        templates={templates}
        visType={this.visType}
        isEditable={isEditable}
        onCloneCell={onCloneCell}
        onDeleteCell={onDeleteCell}
        isFluxQuery={this.isFluxQuery}
        toggleVisType={this.toggleVisType}
        onSummonOverlayTechnologies={onSummonOverlayTechnologies}
      >
        {this.visualization}
      </LayoutCell>
    )
  }

  private get isFluxQuery(): boolean {
    const {cell} = this.props
    const type = getDeep<string>(cell, 'queries.0.type', '')
    return type === 'flux'
  }

  private get fluxVis(): JSX.Element {
    const {
      cell,
      onZoom,
      timeRange,
      manualRefresh,
      templates,
      source,
    } = this.props
    const {cellFluxData, visType} = this.state
    const showRawFluxData = visType === VisType.Table

    return (
      <RefreshingGraph
        onZoom={onZoom}
        queryType={QueryType.Flux}
        timeFormat={cell.timeFormat}
        axes={cell.axes}
        type={cell.type}
        inView={cell.inView}
        colors={cell.colors}
        tableOptions={cell.tableOptions}
        fieldOptions={cell.fieldOptions}
        decimalPlaces={cell.decimalPlaces}
        timeRange={timeRange}
        templates={templates}
        manualRefresh={manualRefresh}
        staticLegend={IS_STATIC_LEGEND(cell.legend)}
        grabDataForDownload={this.grabDataForDownload}
        grabFluxData={this.grabFluxData}
        queries={cell.queries}
        source={source}
        cellNote={cell.note}
        cellNoteVisibility={cell.noteVisibility}
        rawData={cellFluxData}
        showRawFluxData={showRawFluxData}
        visType={this.visType}
      />
    )
  }

  private get influxQLVis(): JSX.Element {
    const {
      cell,
      host,
      source,
      sources,
      onZoom,
      timeRange,
      manualRefresh,
      templates,
    } = this.props

    if (cell.isWidget) {
      return <WidgetCell cell={cell} timeRange={timeRange} source={source} />
    }

    return (
      <RefreshingGraph
        onZoom={onZoom}
        queryType={QueryType.InfluxQL}
        timeFormat={cell.timeFormat}
        axes={cell.axes}
        type={cell.type}
        inView={cell.inView}
        colors={cell.colors}
        tableOptions={cell.tableOptions}
        fieldOptions={cell.fieldOptions}
        decimalPlaces={cell.decimalPlaces}
        timeRange={timeRange}
        templates={templates}
        manualRefresh={manualRefresh}
        staticLegend={IS_STATIC_LEGEND(cell.legend)}
        grabDataForDownload={this.grabDataForDownload}
        queries={buildQueriesForLayouts(cell, timeRange, host)}
        source={this.getSource(cell, source, sources, source)}
        cellNote={cell.note}
        cellNoteVisibility={cell.noteVisibility}
      />
    )
  }

  private get visualization(): JSX.Element {
    if (this.isFluxQuery) {
      return this.fluxVis
    }
    return this.influxQLVis
  }

  private get visType(): VisType {
    return this.state.visType
  }

  private toggleVisType = (): void => {
    const newVisType =
      this.state.visType === VisType.Graph ? VisType.Table : VisType.Graph

    this.setState({visType: newVisType})
  }

  private grabDataForDownload: GrabDataForDownloadHandler = cellData => {
    this.setState({cellData})
  }

  private grabFluxData = (cellFluxData: string) => {
    this.setState({cellFluxData})
  }

  private getSource = (cell, source, sources, defaultSource) => {
    const s = _.get(cell, ['queries', '0', 'source'], null)

    if (!s) {
      return source
    }

    return sources.find(src => src.links.self === s) || defaultSource
  }
}

export default Layout
