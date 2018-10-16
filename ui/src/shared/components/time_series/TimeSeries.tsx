// Library
import React, {PureComponent} from 'react'
import _ from 'lodash'
import uuid from 'uuid'
// API
import {executeQuery} from 'src/shared/apis/query'
import {
  getTimeSeries as fetchFluxTimeSeries,
  GetTimeSeriesResult,
} from 'src/flux/apis'

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

// Utils
import {
  extractQueryWarningMessage,
  extractQueryErrorMessage,
} from 'src/shared/parsing'
import {notify} from 'src/shared/actions/notifications'
import {fluxResponseTruncatedError} from 'src/shared/copy/notifications'
import {getDeep} from 'src/utils/wrappers'

export const DEFAULT_TIME_SERIES = [{response: {results: []}}]

interface RenderProps {
  timeSeriesInfluxQL: TimeSeriesServerResponse[]
  timeSeriesFlux: FluxTable[]
  rawFluxData: string
  loading: RemoteDataState
  uuid: string
}

interface Props {
  source: Source
  uuid: string
  queries: Query[]
  timeRange: TimeRange
  children: (r: RenderProps) => JSX.Element
  inView?: boolean
  templates?: Template[]
  editQueryStatus?: (queryID: string, status: Status) => void
  grabDataForDownload?: GrabDataForDownloadHandler
  grabFluxData?: (data: FluxTable[]) => void
  onNotify?: typeof notify
}

interface State {
  timeRange: TimeRange
  loading: RemoteDataState
  isFirstFetch: boolean
  rawFluxData: string
  timeSeriesInfluxQL: TimeSeriesServerResponse[]
  timeSeriesFlux: FluxTable[]
  latestUUID: string
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
    editQueryStatus: () => ({
      type: 'NOOP',
      payload: {},
    }),
  }

  public static getDerivedStateFromProps(props: Props, state: State) {
    const oldUpper = _.get(state, 'timeRange.upper', null)
    const oldLower = _.get(state, 'timeRange.lower', null)
    const newUpper = _.get(props, 'timeRange.upper', null)
    const newLower = _.get(props, 'timeRange.lower', null)

    if (oldUpper !== newUpper || oldLower !== newLower) {
      return {
        isFirstFetch: true,
        timeRange: props.timeRange,
      }
    }

    return null
  }

  constructor(props: Props) {
    super(props)

    this.state = {
      timeRange: props.timeRange,
      timeSeriesInfluxQL: DEFAULT_TIME_SERIES,
      loading: RemoteDataState.NotStarted,
      isFirstFetch: true,
      timeSeriesFlux: [],
      rawFluxData: '',
      latestUUID: null,
    }
  }

  public async componentDidMount() {
    this.executeQueries()
  }

  public async componentDidUpdate(prevProps: Props) {
    const prevQueries = _.map(prevProps.queries, q => q.text)
    const currQueries = _.map(this.props.queries, q => q.text)
    const queriesDifferent = !_.isEqual(prevQueries, currQueries)

    if (
      this.props.uuid !== prevProps.uuid ||
      queriesDifferent ||
      this.state.isFirstFetch
    ) {
      this.executeQueries()
    }
  }

  public render() {
    const {
      timeSeriesInfluxQL,
      timeSeriesFlux,
      rawFluxData,
      loading,
      isFirstFetch,
      latestUUID,
    } = this.state

    if (isFirstFetch && loading === RemoteDataState.Loading) {
      return <div className="graph-empty">{this.spinner}</div>
    }

    return (
      <>
        {this.loadingDots}
        {this.props.children({
          timeSeriesInfluxQL,
          timeSeriesFlux,
          rawFluxData,
          loading,
          uuid: latestUUID,
        })}
      </>
    )
  }

  private get isFluxQuery(): boolean {
    const {queries} = this.props
    return getDeep<string>(queries, '0.type', '') === QueryType.Flux
  }

  private get loadingDots(): JSX.Element {
    const {loading} = this.state

    if (loading === RemoteDataState.Loading) {
      return <GraphLoadingDots />
    }

    return null
  }

  private get spinner(): JSX.Element {
    const {loading} = this.state

    if (loading === RemoteDataState.Loading) {
      return <h3 className="graph-spinner" />
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
      latestUUID,
      isFirstFetch: false,
    })

    try {
      if (this.isFluxQuery) {
        const results = await this.executeFluxQuery(latestUUID)

        timeSeriesFlux = results.tables
        rawFluxData = results.csv
        responseUUID = results.uuid
      } else {
        timeSeriesInfluxQL = await this.executeInfluxQLQueries(latestUUID)
        responseUUID = _.get(timeSeriesInfluxQL, '0.response.uuid')
      }

      if (responseUUID !== this.state.latestUUID) {
        return
      }

      loading = RemoteDataState.Done
    } catch {
      loading = RemoteDataState.Error
    }

    this.setState({
      timeSeriesInfluxQL,
      timeSeriesFlux,
      rawFluxData,
      loading,
    })

    if (grabDataForDownload) {
      grabDataForDownload(timeSeriesInfluxQL)
    }

    if (grabFluxData) {
      grabFluxData(timeSeriesFlux)
    }
  }

  private executeFluxQuery = async (
    latestUUID: string
  ): Promise<GetTimeSeriesResult> => {
    const {queries, onNotify, source, timeRange} = this.props

    const script: string = _.get(queries, '0.text', '')
    const results = await fetchFluxTimeSeries(
      source,
      script,
      timeRange,
      latestUUID
    )

    if (results.didTruncate && onNotify) {
      onNotify(fluxResponseTruncatedError())
    }

    return results
  }

  private executeInfluxQLQueries = async (
    latestUUID: string
  ): Promise<TimeSeriesServerResponse[]> => {
    const {queries} = this.props
    const timeSeriesInfluxQL = await Promise.all(
      queries.map(query => this.executeInfluxQLQuery(query, latestUUID))
    )

    return timeSeriesInfluxQL
  }

  private executeInfluxQLQuery = async (
    query: Query,
    latestUUID: string
  ): Promise<TimeSeriesServerResponse> => {
    const {source, templates, editQueryStatus} = this.props
    const TEMP_RES = 300 // FIXME

    editQueryStatus(query.id, {loading: true})

    try {
      const response = await executeQuery(
        source,
        query,
        templates,
        TEMP_RES,
        latestUUID
      )

      const warningMessage = extractQueryWarningMessage(response)

      if (warningMessage) {
        editQueryStatus(query.id, {warn: warningMessage})
      } else {
        editQueryStatus(query.id, {success: 'Success!'})
      }

      return {response}
    } catch (error) {
      editQueryStatus(query.id, {error: extractQueryErrorMessage(error)})

      throw error
    }
  }
}

export default TimeSeries
