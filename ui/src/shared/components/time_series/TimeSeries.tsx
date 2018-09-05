// Library
import React, {Component} from 'react'
import _ from 'lodash'
import uuid from 'uuid'

// API
import {fetchTimeSeries} from 'src/shared/apis/query'

// Types
import {
  Template,
  Source,
  Query,
  RemoteDataState,
  TimeRange,
  CellType,
} from 'src/types'
import {TimeSeriesServerResponse, TimeSeriesResponse} from 'src/types/series'
import {GrabDataForDownloadHandler} from 'src/types/layout'

// Utils
import {GlobalAutoRefresher, AutoRefresher} from 'src/utils/AutoRefresher'
import {NoteVisibility} from 'src/types/dashboards'

// Components
import MarkdownCell from 'src/shared/components/MarkdownCell'

export const DEFAULT_TIME_SERIES = [{response: {results: []}}]

interface RenderProps {
  timeSeries: TimeSeriesServerResponse[]
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
  editQueryStatus?: () => void
  grabDataForDownload?: GrabDataForDownloadHandler
  cellNote?: string
  cellNoteVisibility?: NoteVisibility
}

interface State {
  timeRange: TimeRange
  loading: RemoteDataState
  isFirstFetch: boolean
  timeSeries: TimeSeriesServerResponse[]
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

    return (
      this.state.loading !== prevState.loading ||
      _.some(list, key => {
        return !_.isEqual(this.props[key], prevProps[key])
      })
    )
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

    this.executeQueries()
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
    const {
      source,
      inView,
      queries,
      templates,
      editQueryStatus,
      grabDataForDownload,
    } = this.props

    if (!inView) {
      return
    }

    if (!queries.length) {
      return this.setState({timeSeries: DEFAULT_TIME_SERIES})
    }

    await this.setIsLoading()

    const TEMP_RES = 300

    try {
      this.latestUUID = uuid.v1()

      const timeSeries = await fetchTimeSeries(
        source,
        queries,
        TEMP_RES,
        templates,
        this.latestUUID,
        editQueryStatus
      )

      const comparer = _.get(timeSeries, '0', {uuid: null})
      if (comparer.uuid !== this.latestUUID) {
        return
      }

      const newSeries = timeSeries.map((response: TimeSeriesResponse) => ({
        response,
      }))

      if (!this.isComponentMounted) {
        return
      }

      this.setState({
        timeSeries: newSeries,
        loading: RemoteDataState.Done,
        isFirstFetch: false,
      })

      if (grabDataForDownload) {
        grabDataForDownload(newSeries)
      }
    } catch (err) {
      if (!this.isComponentMounted) {
        return
      }

      this.setState({
        timeSeries: [],
        loading: RemoteDataState.Error,
      })
    }
  }

  public render() {
    const {cellNoteVisibility, cellNote} = this.props
    const {timeSeries, loading, isFirstFetch} = this.state

    const hasValues = _.some(timeSeries, s => {
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
        {this.props.children({timeSeries, loading})}
      </>
    )
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
