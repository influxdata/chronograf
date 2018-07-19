import React, {PureComponent, ReactElement, ReactNode} from 'react'
import WizardProgressBar from 'src/reusable_ui/components/wizard/WizardProgressBar'
import WizardStep from 'src/reusable_ui/components/wizard/WizardStep'

interface WizardStepProps {
  children: ReactNode
  title: string
  isComplete: () => boolean
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
  children: ReactElement<WizardStep>
}

class WizardCloak extends PureComponent<Props, State> {
  public static getDerivedStateFromProps(props: Props) {
    let currentStepIndex = -1
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

  public render() {
    const {steps, currentStepIndex} = this.state

    return (
      <div>
        <WizardProgressBar steps={steps} currentStepIndex={currentStepIndex} />
        {this.CurrentChild}
      </div>
    )
  }

  private get CurrentChild(): JSX.Element {
    const {children} = this.props
    const {currentStepIndex} = this.state

    return children[currentStepIndex]
  }
}

export default WizardCloak
