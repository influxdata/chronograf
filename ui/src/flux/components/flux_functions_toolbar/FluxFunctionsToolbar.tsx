// Libraries
import React, {PureComponent} from 'react'
import {Subscribe} from 'unstated'

// Components
import TransformToolbarFunctions from 'src/flux/components/flux_functions_toolbar/TransformToolbarFunctions'
import FunctionCategory from 'src/flux/components/flux_functions_toolbar/FunctionCategory'
import SearchBar from 'src/flux/components/flux_functions_toolbar/SearchBar'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'

// Constants
import {FUNCTIONS} from 'src/flux/constants/functions'

// Utils
import {TimeMachineContainer} from 'src/shared/utils/TimeMachineContainer'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface PassedProps {
  onInsertFluxFunction: (functionName: string, text: string) => void
}

interface ConnectedProps {
  script: string
  onUpdateScript: (script: string) => void
}

type Props = PassedProps & ConnectedProps

interface State {
  searchTerm: string
}

@ErrorHandling
class FluxFunctionsToolbar extends PureComponent<Props, State> {
  public constructor(props: Props) {
    super(props)
    this.state = {searchTerm: ''}
  }

  public render() {
    const {searchTerm} = this.state
    return (
      <div className="flux-functions-toolbar">
        <SearchBar onSearch={this.handleSearch} />
        <FancyScrollbar>
          <div className="flux-functions-toolbar--list">
            <TransformToolbarFunctions
              funcs={FUNCTIONS}
              searchTerm={searchTerm}
            >
              {sortedFunctions => {
                return Object.entries(sortedFunctions).map(
                  ([category, funcs]) => {
                    return (
                      <FunctionCategory
                        key={category}
                        category={category}
                        funcs={funcs}
                        onClickFunction={this.handleClickFunction}
                      />
                    )
                  }
                )
              }}
            </TransformToolbarFunctions>
          </div>
        </FancyScrollbar>
      </div>
    )
  }

  private handleClickFunction = (
    fluxFunction: string,
    funcExample: string
  ): void => {
    this.props.onInsertFluxFunction(fluxFunction, funcExample)
  }

  private handleSearch = (searchTerm: string): void => {
    this.setState({searchTerm})
  }
}

const ConnectedFluxFunctionsToolbar = (props: PassedProps) => (
  <Subscribe to={[TimeMachineContainer]}>
    {(container: TimeMachineContainer) => (
      <FluxFunctionsToolbar
        {...props}
        script={container.state.draftScript}
        onUpdateScript={container.handleUpdateDraftScript}
      />
    )}
  </Subscribe>
)

export default ConnectedFluxFunctionsToolbar
