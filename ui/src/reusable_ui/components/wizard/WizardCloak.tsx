import React, {PureComponent, ReactElement} from 'react'
import WizardProgressBar from 'src/reusable_ui/components/wizard/WizardProgressBar'

import {WizardStepProps, StepStatus, Step} from 'src/types/wizard'

import 'src/reusable_ui/components/wizard/WizardCloak.scss'

interface State {
  steps: Step[]
  currentStepIndex: number
}

interface Props {
  children: Array<ReactElement<WizardStepProps>>
  handleSkip?: () => void
  skipLinkText?: string
}

class WizardCloak extends PureComponent<Props, State> {
  public static getDerivedStateFromProps(props: Props, state: State) {
    let {currentStepIndex} = state
    const childSteps = React.Children.map(
      props.children,
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
    const {skipLinkText, handleSkip} = this.props

    return (
      <div className="wizard-cloak">
        <div className="progress-header">
          <h2 className="step-title">{this.CurrentChild.props.title}</h2>
          <WizardProgressBar
            handleJump={this.jumpToStep}
            steps={steps}
            currentStepIndex={currentStepIndex}
          />
          {this.tipText}
        </div>
        {this.CurrentChild}
        <p className="skip-link">
          <a onClick={handleSkip}> {skipLinkText || 'skip'}</a>
        </p>
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

  private jumpToStep = jumpIndex => () => {
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

    return React.cloneElement<WizardStepProps>(children[currentStepIndex], {
      increment: advance,
      decrement: retreat,
      lastStep,
    })
  }

  private get tipText() {
    const {currentStepIndex} = this.state
    const {
      props: {tipText},
    } = this.props.children[currentStepIndex]

    if (tipText) {
      return (
        <div className="tip-text">
          <p>{tipText}</p>
        </div>
      )
    }
    return null
  }
}

export default WizardCloak
