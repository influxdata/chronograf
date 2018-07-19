import React, {PureComponent, ReactElement, ReactNode} from 'react'
import WizardProgressBar from 'src/reusable_ui/components/wizard/WizardProgressBar'
import WizardStep from 'src/reusable_ui/components/wizard/WizardStep'

// import {} from 'src/types'

interface WizardStepProps {
  children: ReactNode
  title: string
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
  constructor(props) {
    super(props)

    const childSteps = React.Children.map(
      props.children,
      (child: ReactElement<WizardStepProps>, i) => {
        return {
          title: child.props.title,
          stepStatus: StepStatus.Incomplete,
        }
      }
    )

    this.state = {
      steps: childSteps,
      currentStepIndex: 2,
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

  private get CurrentChild(): JSX.Element {
    const {children} = this.props
    const {currentStepIndex} = this.state

    return children[currentStepIndex]
  }
}

export default WizardCloak
