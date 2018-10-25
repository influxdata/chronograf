// Libraries
import {PureComponent} from 'react'
import _ from 'lodash'

// Utils
import {
  measurements as fetchMeasurementsAsync,
  fieldsByMeasurement as fetchFieldsByMeasurementAsync,
  tagKeys as fetchTagKeysAsync,
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
  children: (tree: CategoryTree) => JSX.Element
}

interface State {
  measurements: string[]
  fields: string[]
  fieldsByMeasurements: {[measurement: string]: string[]}
  tagKeys: string[]
}

export interface CategoryTree {
  measurements: {[m: string]: string[]}
  tagKeys: string[]
  fields: string[]
}

@ErrorHandling
class SchemaExplorerTree extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      measurements: [],
      fields: [],
      fieldsByMeasurements: {},
      tagKeys: [],
    }
  }

  public async componentDidMount() {
    await this.fetchMeasurements()
    await this.fetchFields()
    await this.fetchTagKeys()
  }

  public render() {
    return this.props.children(this.tree)
  }

  private async fetchMeasurements() {
    const {source, bucket} = this.props
    const measurementResults = await fetchMeasurementsAsync(source, bucket)
    const measurements = parseValuesColumn(measurementResults)

    this.setState({measurements})
  }

  private async fetchTagKeys() {
    const {source, bucket} = this.props
    const tagKeysResults = await fetchTagKeysAsync(source, bucket, [])

    const tagKeys = parseValuesColumn(tagKeysResults)

    this.setState({tagKeys})
  }

  private async fetchFields() {
    const {source, bucket} = this.props
    const fieldsResults = await fetchFieldsByMeasurementAsync(source, bucket)

    const {fields, fieldsByMeasurements} = parseFieldsByMeasurements(
      fieldsResults
    )

    this.setState({fields, fieldsByMeasurements})
  }

  private get tree(): CategoryTree {
    const {fields, tagKeys} = this.state

    return {
      measurements: this.measurementsTree,
      fields,
      tagKeys,
    }
  }

  private get measurementsTree() {
    const {measurements, fieldsByMeasurements} = this.state
    const measurementsWithNoFields = _.difference(
      measurements,
      Object.keys(fieldsByMeasurements)
    )

    return measurementsWithNoFields.reduce((acc, m) => {
      acc[m] = []
      return acc
    }, fieldsByMeasurements)
  }
}

export default SchemaExplorerTree
