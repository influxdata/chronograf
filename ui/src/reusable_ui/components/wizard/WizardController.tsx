import React, {PureComponent, ReactElement} from 'react'
import _ from 'lodash'
import WizardProgressBar from 'src/reusable_ui/components/wizard/WizardProgressBar'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {Step} from 'src/types/wizard'
import {WizardStepProps} from 'src/reusable_ui/components/wizard/WizardStep'
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
  jumpStep: number
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
        let isErrored
        if (typeof child.props.isErrored === 'boolean') {
          isErrored = child.props.isErrored
        }
        if (typeof child.props.isErrored === 'function') {
          isErrored = child.props.isErrored()
        }
        let stepStatus = StepStatus.Incomplete
        if (isComplete) {
          stepStatus = StepStatus.Complete
        }
        if (isErrored) {
          stepStatus = StepStatus.Error
        }

        if (currentStepIndex === -1 && !isComplete) {
          currentStepIndex = i
        }
        return {
          title: child.props.title,
          stepStatus,
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
    const {jumpStep} = this.props
    const currentStepIndex = _.isNull(jumpStep) ? -1 : jumpStep
    this.state = {
      steps: [],
      currentStepIndex,
    }
  }

  public render() {
    const {steps, currentStepIndex} = this.state
    const currentChild = this.CurrentChild

    return (
      <div className="wizard-controller">
        <div className="progress-header">
          <h3 className="wizard-step-title">{currentChild.props.title}</h3>
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
        <div className="wizard-tip-text">
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
        <button
          className="btn btn-xs btn-primary btn-link wizard-skip-link"
          onClick={handleSkip}
        >
          {skipLinkText}
        </button>
      )
    }
    return null
  }
}

export default WizardController
