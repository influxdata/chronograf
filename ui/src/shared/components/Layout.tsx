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
import {TimeRange, Cell, Template, Source, Service} from 'src/types'
import {TimeSeriesServerResponse} from 'src/types/series'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {GrabDataForDownloadHandler} from 'src/types/layout'
import {VisType, FluxTable} from 'src/types/flux'

interface Props {
  cell: Cell
  timeRange: TimeRange
  templates: Template[]
  source: Source
  sources: Source[]
  services?: Service[]
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
  cellFluxData: FluxTable[]
  visType: VisType
}

@ErrorHandling
class Layout extends Component<Props, State> {
  public state = {
    cellData: [],
    cellFluxData: [],
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
    const {cellData} = this.state

    return (
      <LayoutCell
        cell={cell}
        cellData={cellData}
        templates={templates}
        visType={this.visType}
        isEditable={isEditable}
        onCloneCell={onCloneCell}
        onDeleteCell={onDeleteCell}
        isFluxSource={this.isFluxService}
        toggleVisType={this.toggleVisType}
        onSummonOverlayTechnologies={onSummonOverlayTechnologies}
      >
        {this.visualization}
      </LayoutCell>
    )
  }

  private get isFluxService(): boolean {
    const {cell} = this.props
    const type = getDeep<string>(cell, 'queries.0.type', '')
    return type === 'flux'
  }

  private get fluxService(): Service {
    const {services, source, cell} = this.props

    const sourceLink = getDeep<string>(cell, 'queries.0.source', '')

    if (services && sourceLink.includes('service')) {
      const service = services.find(s => {
        return s.links.self === sourceLink
      })
      return service
    }

    if (this.isFluxService) {
      return services.find(s => {
        return s.sourceID === source.id
      })
    }
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
    const {cellFluxData} = this.state

    return (
      <RefreshingGraph
        onZoom={onZoom}
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
        queries={cell.queries}
        source={source}
        service={this.fluxService}
        cellNote={cell.note}
        cellNoteVisibility={cell.noteVisibility}
        rawData={cellFluxData}
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
        queries={buildQueriesForLayouts(cell, timeRange, host)}
        source={this.getSource(cell, source, sources, source)}
        cellNote={cell.note}
        cellNoteVisibility={cell.noteVisibility}
      />
    )
  }

  private get visualization(): JSX.Element {
    if (this.isFluxService) {
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

  private grabFluxData = (cellFluxData: FluxTable[]) => {
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
