// Libraries
import React, {PureComponent, createRef} from 'react'

// Component
import FunctionTooltip from 'src/flux/components/flux_functions_toolbar/FunctionTooltip'

// Types
import {FluxToolbarFunction} from 'src/types/flux'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  func: FluxToolbarFunction
  onClickFunction: (funcName: string, funcExample: string) => void
}

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
    const {func, onClickFunction} = this.props

    onClickFunction(func.name, func.example)
  }
}

export default ToolbarFunction
