// Libraries
import React, {PureComponent} from 'react'

// Components
import TransformToolbarFunctions from 'src/flux/components/flux_functions_toolbar/TransformToolbarFunctions'
import FunctionCategory from 'src/flux/components/flux_functions_toolbar/FunctionCategory'
import SearchBar from 'src/flux/components/flux_functions_toolbar/SearchBar'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'

// Constants
import {functions as FUNCTIONS} from 'src/flux/constants'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface State {
  searchTerm: string
}
@ErrorHandling
class FluxFunctionsToolbar extends PureComponent<{}, State> {
  public constructor(props) {
    super(props)
    this.state = {searchTerm: ''}
  }
  public render() {
    const {searchTerm} = this.state
    return (
      <div className="flux-functions-toolbar">
        <SearchBar onSearch={this.handleSearch} />
        <FancyScrollbar>
          <TransformToolbarFunctions funcs={FUNCTIONS} searchTerm={searchTerm}>
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

  private handleSearch = (searchTerm: string): void => {
    this.setState({searchTerm})
  }
}

export default FluxFunctionsToolbar
