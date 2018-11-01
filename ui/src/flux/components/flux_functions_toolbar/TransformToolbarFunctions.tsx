// Libraries
import {PureComponent} from 'react'
import _ from 'lodash'

// Types
import {FluxToolbarFunction} from 'src/types/flux'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  funcs: FluxToolbarFunction[]
  children: (
    sortedFunctions: {[category: string]: FluxToolbarFunction[]}
  ) => JSX.Element | JSX.Element[]
}

@ErrorHandling
class TransformToolbarFunctions extends PureComponent<Props> {
  public render() {
    return this.props.children(this.sortedFunctions)
  }

  private get sortedFunctions() {
    const {funcs} = this.props
    const grouped = _.groupBy(funcs, 'category')
    const sorted = Object.keys(grouped)
      .sort()
      .reduce((acc, key) => {
        acc[key] = grouped[key]
        return acc
      }, {})
    return sorted
  }
}

export default TransformToolbarFunctions
