import React, {PureComponent, ReactElement} from 'react'
import WizardProgressBar from 'src/reusable_ui/components/wizard/WizardProgressBar'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {WizardStepProps, Step} from 'src/types/wizard'
import {StepStatus} from 'src/reusable_ui/constants/wizard'

import 'src/reusable_ui/components/wizard/WizardController.scss'

interface State {
  steps: Step[]
  currentStepIndex: number
}

interface Props {
  children: Array<ReactElement<WizardStepProps>>
  handleSkip?: () => void
  skipLinkText?: string
}

@ErrorHandling
class WizardController extends PureComponent<Props, State> {
  public static defaultProps: Partial<Props> = {
    skipLinkText: 'skip',
  }

  public static getDerivedStateFromProps(props: Props, state: State) {
    let {currentStepIndex} = state
    const {children} = props

    const childSteps = React.Children.map(
      children,
      (child: ReactElement<WizardStepProps>, i) => {
        const isComplete = child.props.isComplete()
        if (currentStepIndex === -1 && !isComplete) {
          currentStepIndex = i
        }
        return {
          title: child.props.title,
          stepStatus: isComplete ? StepStatus.Complete : StepStatus.Incomplete,
        }
      }
    )
    if (currentStepIndex === -1) {
      currentStepIndex = childSteps.length - 1
    }

    return {steps: childSteps, currentStepIndex}
  }

  constructor(props: Props) {
    super(props)
    this.state = {
      steps: [],
      currentStepIndex: -1,
    }
  }

  public render() {
    const {steps, currentStepIndex} = this.state
    const currentChild = this.CurrentChild

    return (
      <div className="wizard-cloak">
        <div className="progress-header">
          <h2 className="step-title">{currentChild.props.title}</h2>
          <WizardProgressBar
            handleJump={this.jumpToStep}
            steps={steps}
            currentStepIndex={currentStepIndex}
          />
          {this.tipText}
        </div>
        {currentChild}
        {this.skipLink}
      </div>
    )
  }

  private incrementStep = () => {
    this.setState(prevState => {
      return {
        currentStepIndex: prevState.currentStepIndex + 1,
      }
    })
  }

  private decrementStep = () => {
    this.setState(prevState => {
      return {
        currentStepIndex: prevState.currentStepIndex - 1,
      }
    })
  }

  private jumpToStep = (jumpIndex: number) => () => {
    this.setState({
      currentStepIndex: jumpIndex,
    })
  }

  private get CurrentChild(): JSX.Element {
    const {children, handleSkip} = this.props
    const {currentStepIndex, steps} = this.state
    const lastStep = currentStepIndex === steps.length - 1

    const advance = lastStep ? handleSkip : this.incrementStep
    const retreat = currentStepIndex === 0 ? null : this.decrementStep

    let currentChild
    if (React.Children.count(children) === 1) {
      currentChild = children
    } else {
      currentChild = children[currentStepIndex]
    }

    return React.cloneElement<WizardStepProps>(currentChild, {
      increment: advance,
      decrement: retreat,
      lastStep,
    })
  }

  private get tipText() {
    const {currentStepIndex} = this.state
    const {children} = this.props

    let currentChild
    if (React.Children.count(children) === 1) {
      currentChild = children
    } else {
      currentChild = children[currentStepIndex]
    }

    const {
      props: {tipText},
    } = currentChild

    if (tipText) {
      return (
        <div className="tip-text">
          <p>{tipText}</p>
        </div>
      )
    }
    return null
  }

  private get skipLink() {
    const {handleSkip, skipLinkText} = this.props

    if (handleSkip) {
      return (
        <p className="skip-link">
          <a onClick={handleSkip}> {skipLinkText}</a>
        </p>
      )
    }
    return null
  }
}

export default WizardController
