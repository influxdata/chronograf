import React, {PureComponent} from 'react'
import ProgressConnector from 'src/reusable_ui/components/wizard/ProgressConnector'

// import {} from 'src/types'

enum statusStates {
  None = 'none',
  Some = 'some',
  Full = 'full',
}

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
      const {stepStatus} = step
      let stepEle

      switch (stepStatus) {
        case StepStatus.Complete:
          stepEle = <span key={`stepEle${i}`} className="icon checkmark" />
          break
        case StepStatus.Error:
          stepEle = <span key={`stepEle${i}`} className="icon stop" />
          break
        default:
          stepEle = <span key={`stepEle${i}`} className="icon circle" />
      }

      const connectorEle =
        i === 0 ? null : (
          <ProgressConnector
            key={`connectorEle${i}`}
            status={statusStates.Full}
          />
        )

      return [...acc, connectorEle, stepEle]
    }, [])
    return <>{progressBar}</>
  }
}

export default WizardProgressBar
