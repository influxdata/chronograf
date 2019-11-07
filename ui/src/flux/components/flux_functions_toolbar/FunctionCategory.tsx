// Libraries
import React, {PureComponent} from 'react'

// Components
import ToolbarFunction from 'src/flux/components/flux_functions_toolbar/ToolbarFunction'

// Types
import {FluxToolbarFunction} from 'src/types/flux'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  category: string
  funcs: FluxToolbarFunction[]
  onClickFunction: (funcName: FluxToolbarFunction) => void
}

@ErrorHandling
class FunctionCategory extends PureComponent<Props> {
  public render() {
    const {category, funcs, onClickFunction} = this.props
    return (
      <dl className="flux-functions-toolbar--category">
        <dt>{category}</dt>
        {funcs.map(func => (
          <ToolbarFunction
            onClickFunction={onClickFunction}
            key={func.name}
            func={func}
          />
        ))}
      </dl>
    )
  }
}

export default FunctionCategory
