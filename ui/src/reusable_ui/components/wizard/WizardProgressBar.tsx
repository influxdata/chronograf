import React, {PureComponent} from 'react'
import ProgressConnector from 'src/reusable_ui/components/wizard/ProgressConnector'

import 'src/reusable_ui/components/wizard/WizardProgressBar.scss'

// import {} from 'src/types'

enum statusStates {
  None = 'none',
  Some = 'some',
  Full = 'full',
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
      let currentStep = ''

      // STEP STATUS
      if (i === currentStepIndex) {
        currentStep = 'circle-thick current'
      }

      const stepEle = (
        <span
          key={`stepEle${i}`}
          className={`icon ${currentStep || stepStatus}`}
        />
      )

      // CONNECTION ELE
      let connectorStatus
      if (i > 0 && steps[i - 1].stepStatus === StepStatus.Complete) {
        connectorStatus = statusStates.Some

        if (stepStatus === StepStatus.Complete) {
          connectorStatus = statusStates.Full
        }
      }

      const connectorEle =
        i === 0 ? null : (
          <ProgressConnector
            key={`connectorEle${i}`}
            status={connectorStatus}
          />
        )

      return [...acc, connectorEle, stepEle]
    }, [])
    return <>{progressBar}</>
  }
}

export default WizardProgressBar
