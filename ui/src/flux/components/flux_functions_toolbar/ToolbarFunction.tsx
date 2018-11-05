// Libraries
import React, {PureComponent, createRef} from 'react'
import {Subscribe} from 'unstated'

// Component
import FunctionTooltip from 'src/flux/components/flux_functions_toolbar/FunctionTooltip'

// Utils
import {TimeMachineContainer} from 'src/shared/utils/TimeMachineContainer'

// Types
import {FluxToolbarFunction} from 'src/types/flux'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface PassedProps {
  func: FluxToolbarFunction
}

interface ConnectedProps {
  script: string
  onUpdateScript: (script: string) => void
}

type Props = PassedProps & ConnectedProps

interface State {
  isActive: boolean
  hoverPosition: {top: number; right: number}
}

@ErrorHandling
class ToolbarFunction extends PureComponent<Props, State> {
  private functionRef = createRef<HTMLDivElement>()

  constructor(props: Props) {
    super(props)

    this.state = {isActive: false, hoverPosition: undefined}
  }
  public render() {
    const {func} = this.props
    return (
      <div
        className="flux-functions-toolbar--function"
        ref={this.functionRef}
        onMouseEnter={this.handleHover}
        onMouseLeave={this.handleStopHover}
      >
        {this.tooltip}
        <dd onClick={this.handleClickFunction}>
          {func.name} {this.helperText}
        </dd>
      </div>
    )
  }

  private get tooltip(): JSX.Element {
    if (this.state.isActive) {
      return (
        <FunctionTooltip
          func={this.props.func}
          onDismiss={this.handleStopHover}
          tipPosition={this.state.hoverPosition}
        />
      )
    }
  }

  private get helperText(): JSX.Element {
    if (this.state.isActive) {
      return (
        <span className="flux-functions-toolbar--helper">Click to Add</span>
      )
    }
  }

  private handleHover = () => {
    const {top, left} = this.functionRef.current.getBoundingClientRect()
    const right = window.innerWidth - left
    this.setState({isActive: true, hoverPosition: {top, right}})
  }

  private handleStopHover = () => {
    this.setState({isActive: false})
  }

  private handleClickFunction = () => {
    const {script, onUpdateScript, func} = this.props

    const updatedScript = `${script}\n  |> ${func.example}`
    onUpdateScript(updatedScript)
  }
}

const ConnectedFunctionsToolbarFunction = (props: PassedProps) => (
  <Subscribe to={[TimeMachineContainer]}>
    {(container: TimeMachineContainer) => (
      <ToolbarFunction
        {...props}
        script={container.state.draftScript}
        onUpdateScript={container.handleUpdateDraftScript}
      />
    )}
  </Subscribe>
)

export default ConnectedFunctionsToolbarFunction
