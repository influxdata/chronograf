import * as React from 'react'
import * as PropTypes from 'prop-types'
import buildInfluxQLQuery from 'utils/influxql'
import classnames from 'classnames'
import VisHeader from 'data_explorer/components/VisHeader'
import VisView from 'data_explorer/components/VisView'
import {GRAPH, TABLE} from 'shared/constants'
import * as _ from 'lodash'

const META_QUERY_REGEX = /^show/i

class Visualization extends React.Component {
  constructor(props) {
    super(props)

    const {activeQueryIndex, queryConfigs} = this.props
    const activeQueryText = this.getQueryText(queryConfigs, activeQueryIndex)

    this.state = activeQueryText.match(META_QUERY_REGEX)
      ? {view: TABLE}
      : {view: GRAPH}
  }

  componentWillReceiveProps(nextProps) {
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

  handleToggleView = view => () => {
    this.setState({view})
  }

  render() {
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
    } = this.props
    const {source: {links: {proxy}}} = this.context
    const {view} = this.state

    const statements = queryConfigs.map(query => {
      const text =
        query.rawText || buildInfluxQLQuery(query.range || timeRange, query)
      return {text, id: query.id, queryConfig: query}
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

  getQueryText(queryConfigs, index) {
    // rawText can be null
    return _.get(queryConfigs, [`${index}`, 'rawText'], '') || ''
  }
}

Visualization.defaultProps = {
  cellName: '',
  cellType: '',
}

const {arrayOf, func, number, shape, string} = PropTypes

Visualization.contextTypes = {
  source: shape({
    links: shape({
      proxy: string.isRequired,
    }).isRequired,
  }).isRequired,
}

Visualization.propTypes = {
  cellName: string,
  cellType: string,
  autoRefresh: number.isRequired,
  templates: arrayOf(shape()),
  timeRange: shape({
    upper: string,
    lower: string,
  }).isRequired,
  queryConfigs: arrayOf(shape({})).isRequired,
  activeQueryIndex: number,
  height: string,
  heightPixels: number,
  editQueryStatus: func.isRequired,
  views: arrayOf(string).isRequired,
  axes: shape({
    y: shape({
      bounds: arrayOf(string),
    }),
  }),
  resizerBottomHeight: number,
  errorThrown: func.isRequired,
  manualRefresh: number,
}

export default Visualization
