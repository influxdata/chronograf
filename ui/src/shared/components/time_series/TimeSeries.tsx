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
  Service,
  Query,
  RemoteDataState,
  TimeRange,
  CellType,
  Status,
  FluxTable,
} from 'src/types'
import {TimeSeriesServerResponse} from 'src/types/series'
import {GrabDataForDownloadHandler} from 'src/types/layout'

// Utils
import {GlobalAutoRefresher, AutoRefresher} from 'src/utils/AutoRefresher'
import {NoteVisibility} from 'src/types/dashboards'
import {getDeep} from 'src/utils/wrappers'
import {
  extractQueryWarningMessage,
  extractQueryErrorMessage,
} from 'src/shared/parsing'

// Components
import MarkdownCell from 'src/shared/components/MarkdownCell'

export const DEFAULT_TIME_SERIES = [{response: {results: []}}]

interface RenderProps {
  timeSeries: TimeSeriesServerResponse[]
  timeSeriesFlux: FluxTable[]
  loading: RemoteDataState
}

interface Props {
  source: Source
  service?: Service
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
}

interface State {
  timeRange: TimeRange
  loading: RemoteDataState
  isFirstFetch: boolean
  timeSeries: TimeSeriesServerResponse[]
  timeSeriesFlux: FluxTable[]
}

const GraphLoadingDots = () => (
  <div className="graph-panel__refreshing">
    <div />
    <div />
    <div />
  </div>
)

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

  constructor(props: Props) {
    super(props)
    this.state = {
      timeRange: props.timeRange,
      timeSeries: DEFAULT_TIME_SERIES,
      loading: RemoteDataState.NotStarted,
      isFirstFetch: true,
      timeSeriesFlux: [],
    }
  }

  public shouldComponentUpdate(prevProps: Props, prevState: State) {
    const list = [
      'source',
      'queries',
      'timeRange',
      'inView',
      'templates',
      'cellType',
      'manualRefresh',
    ]
    const should =
      this.state.loading !== prevState.loading ||
      _.some(list, key => {
        return !_.isEqual(this.props[key], prevProps[key])
      })
    return should
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

    if (this.isComponentMounted) {
      this.executeQueries()
    }
  }

  public setIsLoading(): Promise<void> {
    return new Promise(resolve => {
      this.setState({loading: RemoteDataState.Loading}, () => {
        window.setTimeout(() => {
          resolve()
        }, 0)
      })
    })
  }

  public executeQueries = async () => {
    const {inView, queries, grabDataForDownload, grabFluxData} = this.props

    if (!inView) {
      return
    }

    if (!queries.length) {
      return this.setState({timeSeries: DEFAULT_TIME_SERIES})
    }

    await this.setIsLoading()

    try {
      this.latestUUID = uuid.v1()

      let timeSeries: TimeSeriesServerResponse[] = []
      let timeSeriesFlux: FluxTable[] = []
      if (this.isFluxSource) {
        const results = await this.executeFluxQuery(queries)
        timeSeriesFlux = results.tables

        if (_.get(results, 'uuid') !== this.latestUUID) {
          return
        }
      } else {
        timeSeries = await Promise.all(queries.map(this.executeQuery))

        if (getDeep(timeSeries, '0.response.uuid', null) !== this.latestUUID) {
          return
        }
      }

      if (!this.isComponentMounted) {
        return
      }

      this.setState({
        timeSeries,
        timeSeriesFlux,
        loading: RemoteDataState.Done,
        isFirstFetch: false,
      })

      if (grabDataForDownload) {
        grabDataForDownload(timeSeries)
      }
      if (grabFluxData) {
        grabFluxData(timeSeriesFlux)
      }
    } catch (err) {
      if (!this.isComponentMounted) {
        return
      }

      this.setState({
        timeSeries: [],
        timeSeriesFlux: [],
        loading: RemoteDataState.Error,
      })
    }
  }

  public render() {
    const {cellNoteVisibility, cellNote} = this.props
    const {timeSeries, timeSeriesFlux, loading, isFirstFetch} = this.state

    const hasValues =
      timeSeriesFlux.length ||
      _.some(timeSeries, s => {
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

      return (
        <div className="graph-empty">
          <p>No Results</p>
        </div>
      )
    }

    return (
      <>
        {this.loadingDots}
        {this.props.children({timeSeries, timeSeriesFlux, loading})}
      </>
    )
  }

  private get isFluxSource(): boolean {
    // TODO: update when flux not separate service
    const {service} = this.props
    return !!service
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

  private async executeFluxQuery(
    queries: Query[]
  ): Promise<GetTimeSeriesResult> {
    const {service} = this.props

    const script = getDeep<string>(queries, '0.text', '')
    const results = await fetchFluxTimeSeries(service, script, this.latestUUID)

    return results
  }

  private executeQuery = async (
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
