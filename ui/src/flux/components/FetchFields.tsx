// Libraries
import {PureComponent} from 'react'

// Utils
import {fieldsByMeasurement as fetchFieldsByMeasurementAsync} from 'src/shared/apis/flux/metaQueries'
import {parseFieldsByMeasurements} from 'src/shared/parsing/flux/values'

// Types
import {Source, RemoteDataState} from 'src/types'

interface Props {
  source: Source
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
    const {source, bucket} = this.props
    this.setState({loading: RemoteDataState.Loading})
    try {
      const fieldsResults = await fetchFieldsByMeasurementAsync(source, bucket)

      const {fields, fieldsByMeasurements} = parseFieldsByMeasurements(
        fieldsResults
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
