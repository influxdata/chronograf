import React, {PureComponent} from 'react'

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

interface Props {
  steps: Step[]
  currentStepIndex: number
}

class WizardProgressBar extends PureComponent<Props> {
  public render() {
    const {steps, currentStepIndex} = this.props

    return <div className="progress-bar">ProgressBar</div>
  }
}

export default WizardProgressBar
