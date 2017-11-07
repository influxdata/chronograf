import * as React from 'react'
import * as PropTypes from 'prop-types'
import {withRouter} from 'react-router-dom'
import {connect} from 'react-redux'
import {bindActionCreators, compose} from 'redux'

import {getSources} from 'shared/apis'
import {showDatabases} from 'shared/apis/metaQuery'

import {loadSources as loadSourcesAction} from 'shared/actions/sources'
import {errorThrown as errorThrownAction} from 'shared/actions/errors'

import {DEFAULT_HOME_PAGE} from 'shared/constants'
import {RouterSourceID, Source} from 'src/types'
import {Dispatch} from 'src/types/redux'

export interface CheckSourcesProps {
  sources: Source[]
  loadSources: (sources: Source[]) => void
  errorThrown: (error: string, altText: string) => void
  children: React.ReactChildren
}

type CheckSourcesPropsRouter = CheckSourcesProps & RouterSourceID

export interface CheckSourcesState {
  isFetching: boolean
}

// Acts as a 'router middleware'. The main `App` component is responsible for
// getting the list of data nodes, but not every page requires them to function.
// Routes that do require data nodes can be nested under this component.
class CheckSources extends React.Component<
  CheckSourcesPropsRouter,
  CheckSourcesState
> {
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

  public state = {
    isFetching: true,
  }

  public getChildContext = () => {
    const {sources, match: {params: {sourceID}}} = this.props
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
    nextProps: CheckSourcesPropsRouter,
    nextState: CheckSourcesState
  ) {
    const {history, location, match, errorThrown, sources} = nextProps
    const {isFetching} = nextState
    const source = sources.find(s => s.id === match.params.sourceID)
    const defaultSource = sources.find(s => s.default === true)

    if (!isFetching && !source) {
      const rest = location.pathname.match(/\/sources\/\d+?\/(.+)/)
      const restString = rest === null ? DEFAULT_HOME_PAGE : rest[1]

      if (defaultSource) {
        return history.push(`/sources/${defaultSource.id}/${restString}`)
      }

      if (sources[0]) {
        return history.push(`/sources/${sources[0].id}/${restString}`)
      }

      return history.push(`/sources/new?redirectPath=${location.pathname}`)
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
    const {match, sources, children} = this.props
    const {isFetching} = this.state

    console.log(match)

    const source = sources.find(s => s.id === match.params.sourceID)

    console.log(source)

    if (isFetching || !source) {
      return <div className="page-spinner" />
    }

    if (!children) {
      console.error('CheckSources error')
      return <div />
    }

    return (
      // tslint:disable-next-line:no-any
      React.cloneElement(children as React.ReactElement<any>, {
        ...this.props,
        source,
      })
    )
  }
}

const mapStateToProps = ({sources}) => ({
  sources,
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  loadSources: bindActionCreators(loadSourcesAction, dispatch),
  errorThrown: bindActionCreators(errorThrownAction, dispatch),
})

// https://github.com/ReactTraining/react-router/blob/master/packages/react-router/docs/api/withRouter.md#important-note
export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(CheckSources)
