// Libraries
import {PureComponent} from 'react'

// Utils
import {fetchFieldsByMeasurement} from 'src/shared/apis/flux/metaQueries'

// Types
import {Source, RemoteDataState, TimeRange} from 'src/types'

interface Props {
  source: Source
  timeRange: TimeRange
  bucket: string
  children: (fields, fieldsByMeasurement, fieldsLoading) => JSX.Element
}

interface State {
  fields: string[]
  fieldsByMeasurements: {[measurement: string]: string[]}
  loading: RemoteDataState
}

class FetchFields extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      fields: [],
      fieldsByMeasurements: {},
      loading: RemoteDataState.NotStarted,
    }
  }

  public componentDidMount() {
    this.fetchFields()
  }

  public render() {
    return this.props.children(
      this.state.fields,
      this.state.fieldsByMeasurements,
      this.state.loading
    )
  }

  private async fetchFields() {
    const {source, timeRange, bucket} = this.props
    this.setState({loading: RemoteDataState.Loading})
    try {
      const {fields, fieldsByMeasurements} = await fetchFieldsByMeasurement(
        source,
        timeRange,
        bucket
      )

      this.setState({
        fields,
        fieldsByMeasurements,
        loading: RemoteDataState.Done,
      })
    } catch (error) {
      this.setState({loading: RemoteDataState.Error})
    }
  }
}

export default FetchFields
