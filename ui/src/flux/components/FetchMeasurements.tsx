// Libraries
import {PureComponent} from 'react'

// Utils
import {fetchMeasurements} from 'src/shared/apis/flux/metaQueries'

// Types
import {Source, RemoteDataState, TimeRange} from 'src/types'

interface Props {
  source: Source
  timeRange: TimeRange
  bucket: string
  children: (measurements, measurementsLoading) => JSX.Element
}

interface State {
  measurements: string[]
  loading: RemoteDataState
}

class FetchMeasurements extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      measurements: [],
      loading: RemoteDataState.NotStarted,
    }
  }
  public componentDidMount() {
    this.fetchData()
  }

  public render() {
    return this.props.children(this.state.measurements, this.state.loading)
  }

  private async fetchData() {
    const {source, timeRange, bucket} = this.props
    this.setState({loading: RemoteDataState.Loading})
    try {
      const measurements = await fetchMeasurements(source, timeRange, bucket)
      this.setState({measurements, loading: RemoteDataState.Done})
    } catch (error) {
      this.setState({loading: RemoteDataState.Error})
    }
  }
}

export default FetchMeasurements
