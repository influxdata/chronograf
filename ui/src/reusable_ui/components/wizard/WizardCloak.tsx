import React, {PureComponent, ReactElement, ReactNode} from 'react'
import WizardProgressBar from 'src/reusable_ui/components/wizard/WizardProgressBar'

interface WizardStepProps {
  children: ReactNode
  title: string
  isComplete: () => boolean
  onPrevious: () => void
  onNext: () => void
  increment?: () => void
  decrement?: () => void
}

enum StepStatus {
  Incomplete = 'circle-thick',
  Complete = 'checkmark',
  Error = 'remove',
}

interface Step {
  title: string
  stepStatus: StepStatus
}

interface State {
  steps: Step[]
  currentStepIndex: number
}

interface Props {
  children: Array<ReactElement<WizardStepProps>>
  toggleVisibility: (isVisible: boolean) => () => void
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

    return (
      <div>
        <WizardProgressBar steps={steps} currentStepIndex={currentStepIndex} />
        {this.CurrentChild}
      </div>
    )
  }

  private incrementStep = () => {
    const {currentStepIndex} = this.state

    this.setState({
      currentStepIndex: currentStepIndex + 1,
    })
  }

  private decrementStep = () => {
    const {currentStepIndex} = this.state

    this.setState({
      currentStepIndex: currentStepIndex - 1,
    })
  }

  private get CurrentChild(): JSX.Element {
    const {children, toggleVisibility} = this.props
    const {currentStepIndex, steps} = this.state

    const advance =
      currentStepIndex === steps.length - 1
        ? toggleVisibility(false)
        : this.incrementStep

    const retreat = currentStepIndex === 0 ? null : this.decrementStep

    return React.cloneElement<WizardStepProps>(children[currentStepIndex], {
      increment: advance,
      decrement: retreat,
    })
  }
}

export default WizardCloak
