import * as React from 'react'
import * as _ from 'lodash'
import * as classnames from 'classnames'

import buildInfluxQLQuery from 'utils/influxql'
import VisHeader from 'data_explorer/components/VisHeader'
import VisView from 'data_explorer/components/VisView'
import {GRAPH, TABLE} from 'shared/constants'

import {editQueryStatus as editQueryStatusAction} from 'data_explorer/actions/view'
import {Axes, QueryConfig, Source, Template, TimeRange} from 'src/types'

const META_QUERY_REGEX = /^show/i

export interface VisualizationProps {
  source: Source
  cellName?: string
  cellType?: string
  autoRefresh: number
  templates?: Template[]
  timeRange: TimeRange
  queryConfigs: QueryConfig[]
  activeQueryIndex: number
  height?: string
  heightPixels?: number
  editQueryStatus: typeof editQueryStatusAction
  views: string[]
  axes?: Axes
  resizerBottomHeight?: number
  errorThrown: (error: string) => void
  manualRefresh: number
}

export interface VisualizationState {
  view: string
}

class Visualization extends React.Component<
  VisualizationProps,
  VisualizationState
> {
  public static defaultProps = {
    cellName: '',
    cellType: '',
  }

  constructor(props: VisualizationProps) {
    super(props)

    const {activeQueryIndex, queryConfigs} = this.props
    const activeQueryText = this.getQueryText(queryConfigs, activeQueryIndex)

    this.state = activeQueryText.match(META_QUERY_REGEX)
      ? {view: TABLE}
      : {view: GRAPH}
  }

  private handleToggleView = view => () => {
    this.setState({view})
  }

  private getQueryText = (queryConfigs, index) =>
    _.get(queryConfigs, [`${index}`, 'rawText'], '') || ''

  public componentWillReceiveProps(nextProps: VisualizationProps) {
    const {activeQueryIndex, queryConfigs} = nextProps
    const nextQueryText = this.getQueryText(queryConfigs, activeQueryIndex)
    const queryText = this.getQueryText(
      this.props.queryConfigs,
      this.props.activeQueryIndex
    )

    if (queryText === nextQueryText) {
      return
    }

    if (nextQueryText.match(META_QUERY_REGEX)) {
      return this.setState({view: TABLE})
    }

    this.setState({view: GRAPH})
  }

  public render() {
    const {
      axes,
      views,
      height,
      cellType,
      cellName,
      timeRange,
      templates,
      autoRefresh,
      heightPixels,
      queryConfigs,
      manualRefresh,
      editQueryStatus,
      activeQueryIndex,
      resizerBottomHeight,
      errorThrown,
      source: {links: {proxy}},
    } = this.props
    const {view} = this.state

    const statements = queryConfigs.map(q => {
      const text = q.rawText || buildInfluxQLQuery(q.range || timeRange, q)
      return {text, id: q.id, queryConfig: q}
    })

    const queries = statements.filter(s => s.text !== null).map(s => {
      return {host: [proxy], text: s.text, id: s.id, queryConfig: s.queryConfig}
    })

    const activeQuery = queries[activeQueryIndex]
    const defaultQuery = queries[0]
    const query = activeQuery || defaultQuery

    return (
      <div className="graph" style={{height}}>
        <VisHeader
          views={views}
          view={view}
          onToggleView={this.handleToggleView}
          name={cellName}
          query={query}
          errorThrown={errorThrown}
        />
        <div
          className={classnames({
            'graph-container': view === GRAPH,
            'table-container': view === TABLE,
          })}
        >
          <VisView
            view={view}
            axes={axes}
            query={query}
            queries={queries}
            cellType={cellType}
            templates={templates}
            autoRefresh={autoRefresh}
            heightPixels={heightPixels}
            manualRefresh={manualRefresh}
            editQueryStatus={editQueryStatus}
            resizerBottomHeight={resizerBottomHeight}
          />
        </div>
      </div>
    )
  }
}

export default Visualization
