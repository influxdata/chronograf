// Libraries
import React, {PureComponent, ReactElement} from 'react'

// Components
import WizardProgressBar from 'src/reusable_ui/components/wizard/WizardProgressBar'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {Step} from 'src/types/wizard'
import {WizardStepProps} from 'src/reusable_ui/components/wizard/WizardStep'
import {StepStatus} from 'src/reusable_ui/constants/wizard'
import {getDeep} from 'src/utils/wrappers'
import _ from 'lodash'

interface State {
  steps: Step[]
  currentStepIndex: number
}

interface Props {
  children: Array<ReactElement<WizardStepProps>>
  handleFinish?: () => void
  skipLinkText?: string
  jumpStep?: number
  switchLinkText?: string
  handleSwitch?: () => void
  isUsingAuth: boolean
  isJumpingAllowed: boolean
}

@ErrorHandling
class WizardController extends PureComponent<Props, State> {
  public static defaultProps: Partial<Props> = {
    skipLinkText: 'Skip',
    jumpStep: -1,
  }

  public static getDerivedStateFromProps(props: Props, state: State) {
    let {currentStepIndex} = state
    const {children} = props
    const childSteps = React.Children.map(
      children,
      (child: ReactElement<WizardStepProps>, i) => {
        const isComplete = child.props.isComplete()
        let isErrored
        if (_.isBoolean(child.props.isErrored)) {
          isErrored = child.props.isErrored
        }
        if (_.isFunction(child.props.isErrored)) {
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
    this.state = {
      steps: [],
      currentStepIndex: _.isNull(jumpStep) ? -1 : jumpStep,
    }
  }

  public render() {
    const {steps, currentStepIndex} = this.state
    const {isUsingAuth} = this.props
    const currentChild = this.CurrentChild
    const {isSkippableStep} = currentChild.props
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
        {isUsingAuth ? this.switchLink : null}
        {isSkippableStep ? this.skipLink : null}
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
    const {isJumpingAllowed} = this.props
    if (isJumpingAllowed) {
      this.setState({
        currentStepIndex: jumpIndex,
      })
    }
  }

  private get CurrentChild(): JSX.Element {
    const {children, handleFinish} = this.props
    const {currentStepIndex, steps} = this.state
    const lastStep = currentStepIndex === steps.length - 1

    const advance = lastStep ? handleFinish : this.incrementStep
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

    const tipText = getDeep(currentChild, 'props.tipText', '')

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
    const {skipLinkText} = this.props
    const {currentStepIndex} = this.state

    return (
      <button
        className="btn btn-xs btn-primary btn-link wizard-skip-link"
        onClick={this.jumpToStep(currentStepIndex + 1)}
      >
        {skipLinkText}
      </button>
    )
  }

  private get switchLink() {
    const {handleSwitch, switchLinkText} = this.props

    if (handleSwitch) {
      return (
        <button
          className="btn btn-xs btn-primary btn-link wizard-skip-link"
          onClick={handleSwitch}
        >
          {switchLinkText}
        </button>
      )
    }
    return null
  }
}

export default WizardController
