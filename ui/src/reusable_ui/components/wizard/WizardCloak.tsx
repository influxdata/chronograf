import React, {PureComponent, ReactNode} from 'react'
import WizardProgressBar from 'src/reusable_ui/components/wizard/WizardProgressBar'

// import {} from 'src/types'

enum StepStatus {
  Incomplete = 'INCOMPLETE',
  Complete = 'COMPLETE',
  Error = 'ERROR',
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
  children: ReactNode
}

class WizardCloak extends PureComponent<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      steps: [
        {title: 'First Step', stepStatus: StepStatus.Complete},
        {title: 'Second Step', stepStatus: StepStatus.Error},
        {title: 'Third Step', stepStatus: StepStatus.Incomplete},
      ],
      currentStepIndex: 0,
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
