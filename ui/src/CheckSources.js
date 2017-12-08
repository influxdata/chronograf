import React, {Component, PropTypes} from 'react'
import {withRouter} from 'react-router'
import {connect} from 'react-redux'
import {bindActionCreators, compose} from 'redux'

import {getSources} from 'shared/apis'
import {showDatabases} from 'shared/apis/metaQuery'

import {loadSources as loadSourcesAction} from 'shared/actions/sources'
import {errorThrown as errorThrownAction} from 'shared/actions/errors'

import {DEFAULT_HOME_PAGE} from 'shared/constants'

// Acts as a 'router middleware'. The main `App` component is responsible for
// getting the list of data nodes, but not every page requires them to function.
// Routes that do require data nodes can be nested under this component.
const {arrayOf, func, node, shape, string} = PropTypes
class CheckSources extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isFetching: true,
    }
  }

  getChildContext() {
    const {sources, params: {sourceID}} = this.props
    return {source: sources.find(s => s.id === sourceID)}
  }

  async componentWillMount() {
    const {loadSources, errorThrown} = this.props

    try {
      const {data: {sources}} = await getSources()
      loadSources(sources)
      this.setState({isFetching: false})
    } catch (error) {
      errorThrown(error, 'Unable to connect to Chronograf server')
      this.setState({isFetching: false})
    }
  }

  async componentWillUpdate(nextProps, nextState) {
    const {router, location, params, errorThrown, sources} = nextProps
    const {isFetching} = nextState
    const source = sources.find(s => s.id === params.sourceID)
    const defaultSource = sources.find(s => s.default === true)

    if (!isFetching && !source) {
      const rest = location.pathname.match(/\/sources\/\d+?\/(.+)/)
      const restString = rest === null ? DEFAULT_HOME_PAGE : rest[1]

      if (defaultSource) {
        return router.push(`/sources/${defaultSource.id}/${restString}`)
      } else if (sources[0]) {
        return router.push(`/sources/${sources[0].id}/${restString}`)
      }

      return router.push(`/sources/new?redirectPath=${location.pathname}`)
    }

    if (!isFetching && !location.pathname.includes('/manage-sources')) {
      // Do simple query to proxy to see if the source is up.
      try {
        await showDatabases(source.links.proxy)
      } catch (error) {
        errorThrown(error, 'Unable to connect to source')
      }
    }
  }

  render() {
    const {params, sources} = this.props
    const {isFetching} = this.state
    const source = sources.find(s => s.id === params.sourceID)

    if (isFetching || !source) {
      return <div className="page-spinner" />
    }

    return (
      this.props.children &&
      React.cloneElement(this.props.children, {
        ...this.props,
        source,
      })
    )
  }
}

CheckSources.propTypes = {
  sources: arrayOf(
    shape({
      links: shape({
        proxy: string.isRequired,
        self: string.isRequired,
        kapacitors: string.isRequired,
        queries: string.isRequired,
        permissions: string.isRequired,
        users: string.isRequired,
        databases: string.isRequired,
      }).isRequired,
    })
  ),
  children: node,
  params: shape({
    sourceID: string,
  }).isRequired,
  router: shape({
    push: func.isRequired,
  }).isRequired,
  location: shape({
    pathname: string.isRequired,
  }).isRequired,
  loadSources: func.isRequired,
  errorThrown: func.isRequired,
}

CheckSources.childContextTypes = {
  source: shape({
    links: shape({
      proxy: string.isRequired,
      self: string.isRequired,
      kapacitors: string.isRequired,
      queries: string.isRequired,
      permissions: string.isRequired,
      users: string.isRequired,
      databases: string.isRequired,
    }).isRequired,
  }),
}

const mapStateToProps = ({sources}) => ({
  sources,
})

const mapDispatchToProps = dispatch => ({
  loadSources: bindActionCreators(loadSourcesAction, dispatch),
  errorThrown: bindActionCreators(errorThrownAction, dispatch),
})

// https://github.com/ReactTraining/react-router/blob/master/packages/react-router/docs/api/withRouter.md#important-note
export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(CheckSources)
