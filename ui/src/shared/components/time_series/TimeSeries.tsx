// Library
import React, {Component} from 'react'
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
  CellType,
  Status,
  FluxTable,
  QueryType,
} from 'src/types'
import {TimeSeriesServerResponse} from 'src/types/series'
import {GrabDataForDownloadHandler} from 'src/types/layout'

// Utils
import {GlobalAutoRefresher, AutoRefresher} from 'src/utils/AutoRefresher'
import {NoteVisibility} from 'src/types/dashboards'
import {
  extractQueryWarningMessage,
  extractQueryErrorMessage,
} from 'src/shared/parsing'
import {notify} from 'src/shared/actions/notifications'
import {fluxResponseTruncatedError} from 'src/shared/copy/notifications'
import DefaultDebouncer, {Debouncer} from 'src/shared/utils/debouncer'
import {getDeep} from 'src/utils/wrappers'

// Components
import MarkdownCell from 'src/shared/components/MarkdownCell'

export const DEFAULT_TIME_SERIES = [{response: {results: []}}]

interface RenderProps {
  timeSeriesInfluxQL: TimeSeriesServerResponse[]
  timeSeriesFlux: FluxTable[]
  rawFluxData: string
  loading: RemoteDataState
}

interface Props {
  source: Source
  cellType?: CellType
  manualRefresh?: number
  queries: Query[]
  timeRange: TimeRange
  children: (r: RenderProps) => JSX.Element
  autoRefresher?: AutoRefresher
  inView?: boolean
  templates?: Template[]
  editQueryStatus?: (queryID: string, status: Status) => void
  grabDataForDownload?: GrabDataForDownloadHandler
  grabFluxData?: (data: FluxTable[]) => void
  cellNote?: string
  cellNoteVisibility?: NoteVisibility
  onNotify?: typeof notify
}

interface State {
  timeRange: TimeRange
  loading: RemoteDataState
  isFirstFetch: boolean
  rawFluxData: string
  timeSeriesInfluxQL: TimeSeriesServerResponse[]
  timeSeriesFlux: FluxTable[]
}

const GraphLoadingDots = () => (
  <div className="graph-panel__refreshing">
    <div />
    <div />
    <div />
  </div>
)

const QUERIES_DEBOUNCE_MS = 500

class TimeSeries extends Component<Props, State> {
  public static defaultProps = {
    inView: true,
    templates: [],
    autoRefresher: GlobalAutoRefresher,
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

  private latestUUID: string = uuid.v1()
  private isComponentMounted: boolean = false
  private debouncer: Debouncer = new DefaultDebouncer()

  constructor(props: Props) {
    super(props)

    this.state = {
      timeRange: props.timeRange,
      timeSeriesInfluxQL: DEFAULT_TIME_SERIES,
      loading: RemoteDataState.NotStarted,
      isFirstFetch: true,
      timeSeriesFlux: [],
      rawFluxData: '',
    }
  }

  public shouldComponentUpdate(prevProps: Props, prevState: State) {
    const propKeys = [
      'source',
      'queries',
      'timeRange',
      'inView',
      'templates',
      'cellType',
      'manualRefresh',
    ]
    const stateKeys = ['loading', 'timeSeriesInfluxQL', 'timeSeriesFlux']

    const propsUpdated = propKeys.some(
      k => !_.isEqual(this.props[k], prevProps[k])
    )

    const stateUpdated = stateKeys.some(
      k => !_.isEqual(this.state[k], prevState[k])
    )

    return propsUpdated || stateUpdated
  }

  public async componentDidMount() {
    const {autoRefresher} = this.props

    this.isComponentMounted = true
    this.executeQueries()
    autoRefresher.subscribe(this.executeQueries)
  }

  public componentWillUnmount() {
    const {autoRefresher} = this.props

    this.isComponentMounted = false
    autoRefresher.unsubscribe(this.executeQueries)
  }

  public async componentDidUpdate(prevProps: Props) {
    if (this.props.autoRefresher !== prevProps.autoRefresher) {
      prevProps.autoRefresher.unsubscribe(this.executeQueries)
      this.props.autoRefresher.subscribe(this.executeQueries)
    }

    if (!this.isPropsDifferent(prevProps)) {
      return
    }

    // Currently the TimeSeries component is being used to refetch Flux data
    // on every keystroke in the TimeMachineEditor. We debounce calls to
    // fetch the Flux data to a more reasonable interval. Eventually we
    // should switch the TimeMachineEditor to refetch Flux data on an
    // explicit save rather than a keystroke
    this.setState({loading: RemoteDataState.Loading})
    this.debouncer.call(this.executeQueries, QUERIES_DEBOUNCE_MS)
  }

  public render() {
    const {cellNoteVisibility, cellNote, source} = this.props
    const {
      timeSeriesInfluxQL,
      timeSeriesFlux,
      rawFluxData,
      loading,
      isFirstFetch,
    } = this.state

    const hasValues =
      timeSeriesFlux.length ||
      _.some(timeSeriesInfluxQL, s => {
        const results = _.get(s, 'response.results', [])
        const v = _.some(results, r => r.series)
        return v
      })

    if (isFirstFetch && loading === RemoteDataState.Loading) {
      return <div className="graph-empty">{this.spinner}</div>
    }

    if (!hasValues) {
      if (cellNoteVisibility === NoteVisibility.ShowWhenNoData) {
        return <MarkdownCell text={cellNote} />
      }

      if (this.isFluxQuery && !getDeep(source, 'links.flux', null)) {
        return (
          <div className="graph-empty">
            <p>The current source does not support flux</p>
          </div>
        )
      }

      return (
        <div className="graph-empty">
          <p>No Results</p>
        </div>
      )
    }

    return (
      <>
        {this.loadingDots}
        {this.props.children({
          timeSeriesInfluxQL,
          timeSeriesFlux,
          rawFluxData,
          loading,
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

    this.setState({loading: RemoteDataState.Loading})
    this.latestUUID = uuid.v1()

    try {
      if (this.isFluxQuery) {
        const results = await this.executeFluxQuery()

        timeSeriesFlux = results.tables
        rawFluxData = results.csv
        responseUUID = results.uuid
      } else {
        timeSeriesInfluxQL = await this.executeInfluxQLQueries()
        responseUUID = _.get(timeSeriesInfluxQL, '0.response.uuid')
      }

      if (!this.isComponentMounted) {
        return
      }

      if (responseUUID !== this.latestUUID) {
        return
      }

      this.setState({loading: RemoteDataState.Done})
    } catch {
      this.setState({loading: RemoteDataState.Error})
    }

    this.setState({
      timeSeriesInfluxQL,
      timeSeriesFlux,
      rawFluxData,
      isFirstFetch: false,
    })

    if (grabDataForDownload) {
      grabDataForDownload(timeSeriesInfluxQL)
    }

    if (grabFluxData) {
      grabFluxData(timeSeriesFlux)
    }
  }

  private executeFluxQuery = async (): Promise<GetTimeSeriesResult> => {
    const {queries, onNotify, source, timeRange} = this.props

    const script: string = _.get(queries, '0.text', '')
    const results = await fetchFluxTimeSeries(
      source,
      script,
      timeRange,
      this.latestUUID
    )

    if (results.didTruncate && onNotify) {
      onNotify(fluxResponseTruncatedError())
    }

    return results
  }

  private executeInfluxQLQueries = async (): Promise<
    TimeSeriesServerResponse[]
  > => {
    const {queries} = this.props
    const timeSeriesInfluxQL = await Promise.all(
      queries.map(this.executeInfluxQLQuery)
    )

    return timeSeriesInfluxQL
  }

  private executeInfluxQLQuery = async (
    query: Query
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
        this.latestUUID
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

  private isPropsDifferent(prevProps: Props) {
    const isSourceDifferent = !_.isEqual(this.props.source, prevProps.source)

    return (
      this.props.manualRefresh !== prevProps.manualRefresh ||
      this.props.inView !== prevProps.inView ||
      !!this.queryDifference(this.props.queries, prevProps.queries).length ||
      !_.isEqual(this.props.templates, prevProps.templates) ||
      isSourceDifferent
    )
  }

  private queryDifference = (left, right) => {
    const mapper = q => `${q.text}`
    const l = left.map(mapper)
    const r = right.map(mapper)
    return _.difference(_.union(l, r), _.intersection(l, r))
  }
}

export default TimeSeries
