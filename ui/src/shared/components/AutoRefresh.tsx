import * as React from 'react'
import * as _ from 'lodash'

import {fetchTimeSeriesAsync} from 'shared/actions/timeSeries'
import {removeUnselectedTemplateValues} from 'dashboards/constants'

import {AutoRefresh as AutoRefreshType, Template, TextQuery} from 'src/types'
import {RawResponse} from 'src/types/timeSeries'
import * as FuncTypes from 'src/types/funcs'

export interface AutoRefreshProps {
  autoRefresh: AutoRefreshType
  templates: Template[]
  queries: TextQuery[]
  editQueryStatus: FuncTypes.editQueryStatus
  grabDataForDownload: FuncTypes.grabDataForDownload
}

export interface AutoRefreshState {
  lastQuerySuccessful: boolean
  timeSeries: RawResponse[]
  resolution: number | null
  isFetching: boolean
}

const AutoRefresh = ComposedComponent =>
  class Wrapper extends React.Component<AutoRefreshProps, AutoRefreshState> {
    public state = {
      lastQuerySuccessful: false,
      timeSeries: [],
      resolution: null,
      isFetching: true,
    }

    public intervalID = null

    public componentDidMount() {
      const {queries, templates, autoRefresh} = this.props
      this.executeQueries(queries, templates)
      if (autoRefresh) {
        this.intervalID = setInterval(
          () => this.executeQueries(queries, templates),
          autoRefresh
        )
      }
    }

    public componentWillReceiveProps(nextProps: AutoRefreshProps) {
      const queriesDidUpdate = this.queryDifference(
        this.props.queries,
        nextProps.queries
      ).length

      const tempVarsDidUpdate = !_.isEqual(
        this.props.templates,
        nextProps.templates
      )

      const shouldRefetch = queriesDidUpdate || tempVarsDidUpdate

      if (shouldRefetch) {
        this.executeQueries(nextProps.queries, nextProps.templates)
      }

      if (this.props.autoRefresh !== nextProps.autoRefresh || shouldRefetch) {
        clearInterval(this.intervalID)

        if (nextProps.autoRefresh) {
          this.intervalID = setInterval(
            () => this.executeQueries(nextProps.queries, nextProps.templates),
            nextProps.autoRefresh
          )
        }
      }
    }

    public queryDifference = (left, right) => {
      const leftStrs = left.map(q => `${q.host}${q.text}`)
      const rightStrs = right.map(q => `${q.host}${q.text}`)
      return _.difference(
        _.union(leftStrs, rightStrs),
        _.intersection(leftStrs, rightStrs)
      )
    }

    public executeQueries = async (
      queries: TextQuery[],
      templates: Template[] = []
    ) => {
      const {editQueryStatus, grabDataForDownload} = this.props
      const {resolution} = this.state

      if (!queries.length) {
        this.setState({timeSeries: []})
        return
      }

      this.setState({isFetching: true})

      const timeSeriesPromises = queries.map(query => {
        const {host, database, rp} = query

        const templatesWithResolution = templates.map(temp => {
          if (temp.tempVar === ':interval:') {
            if (resolution) {
              return {...temp, resolution}
            }
            return {...temp, resolution: 1000}
          }
          return {...temp}
        })

        return fetchTimeSeriesAsync(
          {
            source: host,
            db: database,
            rp,
            query,
            tempVars: removeUnselectedTemplateValues(templatesWithResolution),
            resolution,
          },
          editQueryStatus
        )
      })

      try {
        const timeSeries: RawResponse[] = await Promise.all(timeSeriesPromises)
        const newSeries = timeSeries.map(response => ({response}))
        const lastQuerySuccessful = this._resultsForQuery(newSeries)

        this.setState({
          timeSeries: newSeries,
          lastQuerySuccessful,
          isFetching: false,
        })

        if (grabDataForDownload) {
          grabDataForDownload(timeSeries)
        }
      } catch (err) {
        console.error(err)
      }
    }

    public componentWillUnmount() {
      clearInterval(this.intervalID)
      this.intervalID = false
    }

    public setResolution = resolution => {
      this.setState({resolution})
    }

    public render() {
      const {timeSeries} = this.state

      if (this.state.isFetching && this.state.lastQuerySuccessful) {
        return this.renderFetching(timeSeries)
      }

      if (
        !this._resultsForQuery(timeSeries) ||
        !this.state.lastQuerySuccessful
      ) {
        return this.renderNoResults()
      }

      return (
        <ComposedComponent
          {...this.props}
          data={timeSeries}
          setResolution={this.setResolution}
        />
      )
    }

    /**
     * Graphs can potentially show mulitple kinds of spinners based on whether
     * a graph is being fetched for the first time, or is being refreshed.
     */
    public renderFetching = data => {
      const isFirstFetch = !Object.keys(this.state.timeSeries).length
      return (
        <ComposedComponent
          {...this.props}
          data={data}
          setResolution={this.setResolution}
          isFetchingInitially={isFirstFetch}
          isRefreshing={!isFirstFetch}
        />
      )
    }

    public renderNoResults = () => {
      return (
        <div className="graph-empty">
          <p data-test="data-explorer-no-results">No Results</p>
        </div>
      )
    }

    public _resultsForQuery = data =>
      data.length
        ? data.every(({response}) =>
            _.get(response, 'results', []).every(
              result =>
                Object.keys(result).filter(k => k !== 'statement_id').length !==
                0
            )
          )
        : false
  }

export default AutoRefresh
