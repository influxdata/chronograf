// Library
import React, {Component} from 'react'
import _ from 'lodash'
import uuid from 'uuid'

// API
import {fetchTimeSeries} from 'src/shared/apis/query'

// Types
import {Template, Source, Query, RemoteDataState, TimeRange} from 'src/types'
import {TimeSeriesServerResponse, TimeSeriesResponse} from 'src/types/series'
import {GrabDataForDownloadHandler} from 'src/types/layout'

// Utils
import AutoRefresh from 'src/utils/AutoRefresh'
import {CellNoteVisibility} from 'src/types/dashboards'

// Components
import MarkdownCell from 'src/shared/components/MarkdownCell'

export const DEFAULT_TIME_SERIES = [{response: {results: []}}]

interface RenderProps {
  timeSeries: TimeSeriesServerResponse[]
  loading: RemoteDataState
}

interface Props {
  source: Source
  queries: Query[]
  timeRange: TimeRange
  children: (r: RenderProps) => JSX.Element
  inView?: boolean
  templates?: Template[]
  editQueryStatus?: () => void
  grabDataForDownload?: GrabDataForDownloadHandler
  cellNote?: string
  cellNoteVisibility?: CellNoteVisibility
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
  }

  public static getDerivedStateFromProps(props: Props, state: State) {
    let {isFirstFetch, timeRange} = state

    const oldUpper = _.get(state, 'timeRange.upper', null)
    const oldLower = _.get(state, 'timeRange.lower', null)
    const newUpper = _.get(props, 'timeRange.upper', null)
    const newLower = _.get(props, 'timeRange.lower', null)

    if (oldUpper !== newUpper || oldLower !== newLower) {
      isFirstFetch = true
      timeRange = props.timeRange
    }

    return {
      isFirstFetch,
      timeRange,
    }
  }

  private latestUUID: string = uuid.v1()

  constructor(props: Props) {
    super(props)
    this.state = {
      timeRange: props.timeRange,
      timeSeries: DEFAULT_TIME_SERIES,
      loading: RemoteDataState.NotStarted,
      isFirstFetch: true,
    }
  }

  public async componentDidMount() {
    this.executeQueries()
    AutoRefresh.subscribe(this.executeQueries)
  }

  public componentWillUnmount() {
    AutoRefresh.unsubscribe(this.executeQueries)
  }

  public async componentDidUpdate(prevProps: Props) {
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
        }, 10)
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

      this.setState({
        timeSeries: newSeries,
        loading: RemoteDataState.Done,
      })

      if (grabDataForDownload) {
        grabDataForDownload(newSeries)
      }
    } catch (err) {
      this.setState({
        timeSeries: [],
        loading: RemoteDataState.Error,
      })
    } finally {
      this.setState({isFirstFetch: false})
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
      if (cellNoteVisibility === CellNoteVisibility.ShowWhenNoData) {
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

  private isPropsDifferent(nextProps: Props) {
    const isSourceDifferent = !_.isEqual(this.props.source, nextProps.source)

    return (
      this.props.inView !== nextProps.inView ||
      !!this.queryDifference(this.props.queries, nextProps.queries).length ||
      !_.isEqual(this.props.templates, nextProps.templates) ||
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
