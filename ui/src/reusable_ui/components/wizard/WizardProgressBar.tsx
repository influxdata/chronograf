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
    return <div className="progress-bar">{this.WizardProgress}</div>
  }

  private get WizardProgress(): JSX.Element {
    const {steps, currentStepIndex} = this.props
    const progressBar = steps.reduce((acc, step, i) => {
      const stepEle = <span key={`stepEle${i}`} className="icon checkmark" />

      const connectorEle =
        i === 0 ? null : <span key={`connectorEle${i}`}>connects</span>

      return [...acc, connectorEle, stepEle]
    }, [])
    return <>{progressBar}</>
  }
}

export default WizardProgressBar
