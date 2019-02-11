// Libraries
import React, {PureComponent} from 'react'
import _ from 'lodash'
import uuid from 'uuid'

// APIs
import {executeQueries as executeInfluxQLQueries} from 'src/shared/apis/query'
import {executeQuery as executeFluxQuery} from 'src/shared/apis/flux/query'

// Utils
import {
  extractQueryWarningMessage,
  extractQueryErrorMessage,
} from 'src/shared/parsing'
import {notify} from 'src/shared/actions/notifications'
import {fluxResponseTruncatedError} from 'src/shared/copy/notifications'
import {getDeep} from 'src/utils/wrappers'
import {restartable} from 'src/shared/utils/restartable'
import {renderTemplatesInScript} from 'src/flux/helpers/templates'
import {parseResponse} from 'src/shared/parsing/flux/response'
import DefaultDebouncer, {Debouncer} from 'src/shared/utils/debouncer'
import {DEFAULT_X_PIXELS} from 'src/shared/constants'

// Types
import {
  Template,
  Source,
  Query,
  RemoteDataState,
  TimeRange,
  Status,
  FluxTable,
  QueryType,
} from 'src/types'
import {TimeSeriesServerResponse} from 'src/types/series'
import {GrabDataForDownloadHandler} from 'src/types/layout'

export const DEFAULT_TIME_SERIES = [{response: {results: []}}]
const EXECUTE_QUERIES_DEBOUNCE_MS = 400

interface RenderProps {
  timeSeriesInfluxQL: TimeSeriesServerResponse[]
  timeSeriesFlux: FluxTable[]
  rawFluxData: string
  loading: RemoteDataState
  isInitialFetch: boolean
  uuid: string
  errorMessage: string
}

interface Props {
  source: Source
  uuid: string
  queries: Query[]
  timeRange: TimeRange
  xPixels?: number
  children: (r: RenderProps) => JSX.Element
  inView?: boolean
  templates?: Template[]
  fluxASTLink?: string
  editQueryStatus?: (queryID: string, status: Status) => void
  grabDataForDownload?: GrabDataForDownloadHandler
  grabFluxData?: (data: string) => void
  onNotify?: typeof notify
}

interface State {
  loading: RemoteDataState
  fetchCount: number
  rawFluxData: string
  timeSeriesInfluxQL: TimeSeriesServerResponse[]
  timeSeriesFlux: FluxTable[]
  latestUUID: string
  errorMessage: string
}

const GraphLoadingDots = () => (
  <div className="graph-panel__refreshing">
    <div />
    <div />
    <div />
  </div>
)

class TimeSeries extends PureComponent<Props, State> {
  public static defaultProps = {
    inView: true,
    templates: [],
    xPixels: DEFAULT_X_PIXELS,
    editQueryStatus: () => ({
      type: 'NOOP',
      payload: {},
    }),
  }

  private executeFluxQuery = restartable(executeFluxQuery)
  private executeInfluxQLQueries = restartable(executeInfluxQLQueries)
  private debouncer: Debouncer = new DefaultDebouncer()

  constructor(props: Props) {
    super(props)

    this.state = {
      timeSeriesInfluxQL: DEFAULT_TIME_SERIES,
      loading: RemoteDataState.NotStarted,
      fetchCount: 0,
      timeSeriesFlux: [],
      rawFluxData: '',
      latestUUID: null,
      errorMessage: '',
    }
  }

  public componentDidMount() {
    this.executeQueries()
  }

  public componentWillUnmount() {
    this.debouncer.cancelAll()
  }

  public async componentDidUpdate(prevProps: Props) {
    const prevQueries = _.map(prevProps.queries, q => q.text)
    const currQueries = _.map(this.props.queries, q => q.text)
    const queriesDifferent = !_.isEqual(prevQueries, currQueries)

    const prevTemplates = _.get(prevProps, 'templates')
    const newTemplates = _.get(this.props, 'templates')
    // templates includes dashTime and upperDashTime which capture zoomedTimeRange
    const templatesDifferent = !_.isEqual(prevTemplates, newTemplates)

    const oldLower = _.get(prevProps, 'timeRange.lower')
    const oldUpper = _.get(prevProps, 'timeRange.upper')
    const newLower = _.get(this.props, 'timeRange.lower')
    const newUpper = _.get(this.props, 'timeRange.upper')
    const timeRangeChanged = oldLower !== newLower || oldUpper !== newUpper

    const shouldExecuteQueries =
      queriesDifferent ||
      timeRangeChanged ||
      templatesDifferent ||
      this.props.uuid !== prevProps.uuid ||
      this.state.fetchCount === 0 ||
      this.props.xPixels !== prevProps.xPixels

    if (shouldExecuteQueries) {
      this.debouncer.call(this.executeQueries, EXECUTE_QUERIES_DEBOUNCE_MS)
    }
  }

  public render() {
    const {
      timeSeriesInfluxQL,
      timeSeriesFlux,
      rawFluxData,
      loading,
      latestUUID,
      errorMessage,
    } = this.state

    return (
      <>
        {this.loadingDots}
        {this.props.children({
          timeSeriesInfluxQL,
          timeSeriesFlux,
          rawFluxData,
          isInitialFetch: this.isInitialFetch,
          loading,
          uuid: latestUUID,
          errorMessage,
        })}
      </>
    )
  }

  private get isFluxQuery(): boolean {
    const {queries} = this.props

    return getDeep<string>(queries, '0.type', '') === QueryType.Flux
  }

  private get isInitialFetch(): boolean {
    const {fetchCount} = this.state
    const isInitialFetch = fetchCount === 1

    return isInitialFetch
  }

  private get loadingDots(): JSX.Element {
    const {loading} = this.state

    if (loading === RemoteDataState.Loading && !this.isInitialFetch) {
      return <GraphLoadingDots />
    }

    return null
  }

  private executeQueries = async () => {
    const {inView, queries, grabDataForDownload, grabFluxData} = this.props

    if (!inView) {
      return
    }

    if (!queries.length) {
      this.setState({
        timeSeriesInfluxQL: DEFAULT_TIME_SERIES,
        timeSeriesFlux: [],
      })

      return
    }

    let timeSeriesInfluxQL: TimeSeriesServerResponse[] = []
    let timeSeriesFlux: FluxTable[] = []
    let rawFluxData = ''
    let responseUUID: string
    let loading: RemoteDataState = null

    const latestUUID = uuid.v1()

    this.setState({
      loading: RemoteDataState.Loading,
      fetchCount: this.state.fetchCount + 1,
    })

    let errorMessage = ''

    try {
      if (this.isFluxQuery) {
        const results = await this.executeTemplatedFluxQuery(latestUUID)

        timeSeriesFlux = results.tables
        rawFluxData = results.csv
        responseUUID = results.uuid
      } else {
        timeSeriesInfluxQL = await this.executeInfluxQLWithStatus(latestUUID)
        responseUUID = _.get(timeSeriesInfluxQL, '0.response.uuid')
      }

      loading = RemoteDataState.Done
    } catch (err) {
      loading = RemoteDataState.Error
      errorMessage = err.toString()
    }

    this.setState({
      timeSeriesInfluxQL,
      timeSeriesFlux,
      rawFluxData,
      loading,
      latestUUID: responseUUID,
      errorMessage,
    })

    if (grabDataForDownload) {
      grabDataForDownload(timeSeriesInfluxQL)
    }

    if (grabFluxData) {
      grabFluxData(rawFluxData)
    }
  }

  private executeTemplatedFluxQuery = async (latestUUID: string) => {
    const {queries, onNotify, source, timeRange, fluxASTLink} = this.props

    const script: string = _.get(queries, '0.text', '')

    const renderedScript = await renderTemplatesInScript(
      script,
      timeRange,
      fluxASTLink
    )

    const results = await this.executeFluxQuery(
      source,
      renderedScript,
      latestUUID
    )

    if (results.didTruncate && onNotify) {
      onNotify(fluxResponseTruncatedError(results.rowCount))
    }

    return {...results, tables: parseResponse(results.csv)}
  }

  private executeInfluxQLWithStatus = async (
    latestUUID: string
  ): Promise<TimeSeriesServerResponse[]> => {
    const {source, templates, editQueryStatus, queries} = this.props

    for (const query of queries) {
      editQueryStatus(query.id, {loading: true})
    }

    const results = await this.executeInfluxQLQueries(
      source,
      queries,
      templates,
      latestUUID
    )

    for (let i = 0; i < queries.length; i++) {
      const {value, error} = results[i]
      const query = queries[i]

      let queryStatus

      if (error) {
        queryStatus = {error: extractQueryErrorMessage(error)}
      } else {
        const warningMessage = extractQueryWarningMessage(value)

        if (warningMessage) {
          queryStatus = {warn: warningMessage}
        } else {
          queryStatus = {success: 'Success!'}
        }
      }

      editQueryStatus(query.id, queryStatus)
    }

    const validQueryResults = results
      .filter(result => !result.error)
      .map(result => ({
        response: result.value,
      }))

    return validQueryResults
  }
}

export default TimeSeries
