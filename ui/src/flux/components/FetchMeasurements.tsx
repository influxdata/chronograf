// Libraries
import {PureComponent} from 'react'

// Utils
import {measurements as fetchMeasurementsAsync} from 'src/shared/apis/flux/metaQueries'
import parseValuesColumn from 'src/shared/parsing/flux/values'

// Types
import {Source, RemoteDataState} from 'src/types'

interface Props {
  source: Source
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
    this.fetchMeasurements()
  }

  public render() {
    return this.props.children(this.state.measurements, this.state.loading)
  }

  private async fetchMeasurements() {
    const {source, bucket} = this.props
    this.setState({loading: RemoteDataState.Loading})
    try {
      const measurementResults = await fetchMeasurementsAsync(source, bucket)
      const measurements = parseValuesColumn(measurementResults)
      this.setState({measurements, loading: RemoteDataState.Done})
    } catch (error) {
      this.setState({loading: RemoteDataState.Error})
    }
  }
}

export default FetchMeasurements
