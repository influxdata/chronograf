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
  searchTerm?: string
}

@ErrorHandling
class TransformToolbarFunctions extends PureComponent<Props> {
  public render() {
    return this.props.children(this.sortedFunctions)
  }

  private get sortedFunctions() {
    return this.sortFunctions(this.filterFunctions())
  }

  private filterFunctions() {
    const {searchTerm, funcs} = this.props
    if (!searchTerm) {
      return funcs
    }
    return funcs.filter(func =>
      func.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  private sortFunctions(functions: FluxToolbarFunction[]) {
    const grouped = _.groupBy(functions, 'category')
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
