// Libraries
import React, {PureComponent} from 'react'

// Components
import TransformToolbarFunctions from 'src/flux/components/flux_functions_toolbar/TransformToolbarFunctions'
import FunctionCategory from 'src/flux/components/flux_functions_toolbar/FunctionCategory'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'

// Constants
import {functions as FUNCTIONS} from 'src/flux/constants'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

@ErrorHandling
class FluxFunctionsToolbar extends PureComponent {
  public render() {
    return (
      <div className="flux-functions-toolbar">
        <FancyScrollbar>
          <TransformToolbarFunctions funcs={FUNCTIONS}>
            {sortedFunctions => {
              return Object.entries(sortedFunctions).map(
                ([category, funcs]) => {
                  return (
                    <FunctionCategory
                      key={category}
                      category={category}
                      funcs={funcs}
                    />
                  )
                }
              )
            }}
          </TransformToolbarFunctions>
        </FancyScrollbar>
      </div>
    )
  }
}

export default FluxFunctionsToolbar
