import React, {PropTypes, Component} from 'react'
import classnames from 'classnames'
import VisHeader from 'src/data_explorer/components/VisHeader'
import VisView from 'src/data_explorer/components/VisView'
import buildQuery from 'src/utils/buildQuery'
import {GRAPH, TABLE} from 'shared/constants'

const META_QUERY_REGEX = /^show/i

class Visualization extends Component {
  constructor(props) {
    super(props)

    const {queryConfig} = this.props
    const queryText = queryConfig.rawText || ''

    this.state = queryText.match(META_QUERY_REGEX)
      ? {view: TABLE}
      : {view: GRAPH}
  }

  componentWillReceiveProps(nextProps) {
    const {queryConfig} = nextProps
    const nextQueryText = queryConfig.rawText || ''
    const queryText = this.props.queryConfig.rawText || ''

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
      queryConfig,
      editQueryStatus,
      isInDataExplorer,
      resizerBottomHeight,
      errorThrown,
    } = this.props
    const {source: {links: {proxy}}} = this.context
    const {view} = this.state

    const query = buildQuery(proxy, queryConfig, timeRange)

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
            templates={templates}
            cellType={cellType}
            autoRefresh={autoRefresh}
            heightPixels={heightPixels}
            editQueryStatus={editQueryStatus}
            isInDataExplorer={isInDataExplorer}
            resizerBottomHeight={resizerBottomHeight}
          />
        </div>
      </div>
    )
  }
}

Visualization.defaultProps = {
  cellName: '',
  cellType: '',
}

const {arrayOf, bool, func, number, shape, string} = PropTypes

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
  isInDataExplorer: bool,
  timeRange: shape({
    upper: string,
    lower: string,
  }).isRequired,
  queryConfig: shape({}).isRequired,
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
}

export default Visualization
