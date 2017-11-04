import * as React from 'react'
import * as PropTypes from 'prop-types'
import {withRouter} from 'react-router-dom'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import {getSources} from 'shared/apis'
import {showDatabases} from 'shared/apis/metaQuery'

import {loadSources as loadSourcesAction} from 'shared/actions/sources'
import {errorThrown as errorThrownAction} from 'shared/actions/errors'

import {DEFAULT_HOME_PAGE} from 'shared/constants'
import {Router, Source} from 'src/types'

export interface CheckSourcesProps {
  sources: Source[]
  params: {
    sourceID: string
  }
  router: Router
  location: Location
  loadSources: (sources: Source[]) => void
  errorThrown: (error: string, altText: string) => void
  children: React.ReactChildren
}

export interface CheckSourcesState {
  isFetching: boolean
}

// Acts as a 'router middleware'. The main `App` component is responsible for
// getting the list of data nodes, but not every page requires them to function.
// Routes that do require data nodes can be nested under this component.
class CheckSources extends React.Component<
  CheckSourcesProps,
  CheckSourcesState
> {
  public static state = {
    isFetching: true,
  }

  public static childContextTypes = {
    source: PropTypes.shape({
      links: PropTypes.shape({
        proxy: PropTypes.string.isRequired,
        self: PropTypes.string.isRequired,
        kapacitors: PropTypes.string.isRequired,
        queries: PropTypes.string.isRequired,
        permissions: PropTypes.string.isRequired,
        users: PropTypes.string.isRequired,
        databases: PropTypes.string.isRequired,
      }).isRequired,
    }),
  }

  public getChildContext = () => {
    const {sources, params: {sourceID}} = this.props
    return {source: sources.find(s => s.id === sourceID)}
  }

  public async componentWillMount() {
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

  public async componentWillUpdate(
    nextProps: CheckSourcesProps,
    nextState: CheckSourcesState
  ) {
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

  public render() {
    const {params, sources} = this.props
    const {isFetching} = this.state
    const source = sources.find(s => s.id === params.sourceID)

    if (isFetching || !source) {
      return <div className="page-spinner" />
    }

    return (
      this.props.children &&
      // tslint:disable-next-line:no-any
      React.cloneElement(this.props.children as React.ReactElement<any>, {
        ...this.props,
        source,
      })
    )
  }
}

const mapStateToProps = ({sources}) => ({
  sources,
})

const mapDispatchToProps = dispatch => ({
  loadSources: bindActionCreators(loadSourcesAction, dispatch),
  errorThrown: bindActionCreators(errorThrownAction, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(
  withRouter(CheckSources)
)
