import React, {Component, PropTypes} from 'react'
import _ from 'lodash'
import {fetchTimeSeriesAsync} from 'shared/actions/timeSeries'

const {arrayOf, element, func, number, oneOfType, shape, string} = PropTypes

const AutoRefresh = ComposedComponent =>
  class wrapper extends Component {
    constructor(props) {
      super(props)
      this.state = {
        lastQuerySuccessful: false,
        timeSeries: [],
      }
    }

    static propTypes = {
      children: element,
      autoRefresh: number.isRequired,
      query: shape({
        host: oneOfType([string, arrayOf(string)]),
        text: string,
      }).isRequired,
      editQueryStatus: func,
    }

    componentDidMount() {
      const {query, autoRefresh} = this.props
      this.executeQuery(query)
      if (autoRefresh) {
        this.intervalID = setInterval(
          () => this.executeQuery(query),
          autoRefresh
        )
      }
    }

    componentWillReceiveProps(nextProps) {
      const queryDidUpdate = this.queryDifference(
        this.props.query,
        nextProps.query
      ).length

      const shouldRefetch = queryDidUpdate

      if (shouldRefetch) {
        this.executeQuery(nextProps.query)
      }

      if (this.props.autoRefresh !== nextProps.autoRefresh || shouldRefetch) {
        clearInterval(this.intervalID)

        if (nextProps.autoRefresh) {
          this.intervalID = setInterval(
            () => this.executeQuery(nextProps.queries),
            nextProps.autoRefresh
          )
        }
      }
    }

    queryDifference = (left, right) => {
      const leftStr = `${left.host}${left.text}`
      const rightStr = `${right.host}${right.text}`
      return _.difference(
        _.union(leftStr, rightStr),
        _.intersection(leftStr, rightStr)
      )
    }

    executeQuery = async query => {
      try {
        const {editQueryStatus} = this.props

        console.log(query)

        if (!query) {
          this.setState({timeSeries: []})
          return
        }

        this.setState({isFetching: true})

        const {host, database, rp} = query

        const timeSeries = await fetchTimeSeriesAsync(
          {
            source: host,
            db: database,
            rp,
            query,
          },
          editQueryStatus
        )
        const newSeries = timeSeries.map(response => ({response}))
        const lastQuerySuccessful = !this._noResultsForQuery(newSeries)

        this.setState({
          timeSeries: newSeries,
          lastQuerySuccessful,
          isFetching: false,
        })
      } catch (error) {
        console.error(error)
      }
    }

    componentWillUnmount() {
      clearInterval(this.intervalID)
      this.intervalID = false
    }

    render() {
      const {timeSeries} = this.state

      if (this.state.isFetching && this.state.lastQuerySuccessful) {
        return this.renderFetching(timeSeries)
      }

      if (
        this._noResultsForQuery(timeSeries) ||
        !this.state.lastQuerySuccessful
      ) {
        return this.renderNoResults()
      }

      return <ComposedComponent {...this.props} data={timeSeries} />
    }

    /**
     * Graphs can potentially show mulitple kinds of spinners based on whether
     * a graph is being fetched for the first time, or is being refreshed.
     */
    renderFetching = data => {
      const isFirstFetch = !Object.keys(this.state.timeSeries).length
      return (
        <ComposedComponent
          {...this.props}
          data={data}
          isFetchingInitially={isFirstFetch}
          isRefreshing={!isFirstFetch}
        />
      )
    }

    renderNoResults = () =>
      <div className="graph-empty">
        <p data-test="data-explorer-no-results">No Results</p>
      </div>

    _noResultsForQuery = data => {
      if (!data.length) {
        return true
      }

      return data.every(datum => {
        return datum.response.results.every(result => {
          return (
            Object.keys(result).filter(k => k !== 'statement_id').length === 0
          )
        })
      })
    }
  }

export default AutoRefresh
