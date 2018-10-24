// Libraries
import {PureComponent} from 'react'

// Utils
import {
  measurements as fetchMeasurementsAsync,
  fieldsByMeasurement as fetchFieldsByMeasurementAsync,
} from 'src/shared/apis/flux/metaQueries'
import parseValuesColumn, {
  parseFieldsByMeasurements,
} from 'src/shared/parsing/flux/values'

// Components
import {ErrorHandling} from 'src/shared/decorators/errors'

// Types
import {Source} from 'src/types'

interface Props {
  bucket: string
  source: Source
  children: () => JSX.Element
}

interface State {
  measurements: string[]
  fields: string[]
  fieldsByMeasurements: {[measurement: string]: string[]}
}

@ErrorHandling
class SchemaExplorerTree extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      measurements: [],
      fields: [],
      fieldsByMeasurements: {},
    }
  }

  public async componentDidMount() {
    await this.fetchMeasurements()
    await this.fetchFields()
    console.log('tree', this.tree)
  }

  public render() {
    return this.props.children()
  }

  private async fetchMeasurements() {
    const {source, bucket} = this.props
    const measurementResults = await fetchMeasurementsAsync(source, bucket)
    const parsedMeasurements = parseValuesColumn(measurementResults)

    this.setState({measurements: parsedMeasurements})
    console.log('parsed measurements: ', parsedMeasurements)
  }

  private async fetchTags() {}

  private async fetchFields() {
    const {source, bucket} = this.props
    const fieldsResults = await fetchFieldsByMeasurementAsync(source, bucket)

    const {fields, fieldsByMeasurements} = parseFieldsByMeasurements(
      fieldsResults
    )

    this.setState({fields, fieldsByMeasurements}, () => {
      console.log(this.state.fieldsByMeasurements)
    })
  }

  private get tree() {
    return {
      measurements: this.measurementsTree,
    }
  }

  private get measurementsTree() {
    const {measurements} = this.state

    return measurements.reduce((acc, m) => {
      acc[m] = 'field'
      return acc
    }, {})
  }
}

export default SchemaExplorerTree
