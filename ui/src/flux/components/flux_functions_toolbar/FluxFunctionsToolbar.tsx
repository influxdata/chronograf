// Libraries
import React, {PureComponent} from 'react'
import {Subscribe} from 'unstated'

// Components
import TransformToolbarFunctions from 'src/flux/components/flux_functions_toolbar/TransformToolbarFunctions'
import FunctionCategory from 'src/flux/components/flux_functions_toolbar/FunctionCategory'
import SearchBar from 'src/flux/components/flux_functions_toolbar/SearchBar'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'

// Constants
import {functions as FUNCTIONS} from 'src/flux/constants'

// Utils
import {TimeMachineContainer} from 'src/shared/utils/TimeMachineContainer'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface ConnectedProps {
  script: string
  onUpdateScript: (script: string) => void
}

interface State {
  searchTerm: string
}
@ErrorHandling
class FluxFunctionsToolbar extends PureComponent<ConnectedProps, State> {
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
                        onClickFunction={this.handleUpdateScript}
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

  private handleSearch = (searchTerm: string): void => {
    this.setState({searchTerm})
  }

  private handleUpdateScript = (funcExample: string) => {
    const {script, onUpdateScript} = this.props

    const updatedScript = `${script}\n  |> ${funcExample}`
    onUpdateScript(updatedScript)
  }
}

const ConnectedFluxFunctionsToolbar = () => (
  <Subscribe to={[TimeMachineContainer]}>
    {(container: TimeMachineContainer) => (
      <FluxFunctionsToolbar
        script={container.state.draftScript}
        onUpdateScript={container.handleUpdateDraftScript}
      />
    )}
  </Subscribe>
)

export default ConnectedFluxFunctionsToolbar
