import React, {PureComponent} from 'react'
import ProgressConnector from 'src/reusable_ui/components/wizard/ProgressConnector'

import {Step, connectorState, StepStatus} from 'src/types/wizard'

import 'src/reusable_ui/components/wizard/WizardProgressBar.scss'

interface Props {
  steps: Step[]
  currentStepIndex: number
  handleJump: (jumpIndex: number) => () => void
}

class WizardProgressBar extends PureComponent<Props> {
  public render() {
    return <div className="progress-bar">{this.WizardProgress}</div>
  }

  private get WizardProgress(): JSX.Element {
    const {steps, currentStepIndex, handleJump} = this.props
    const progressBar = steps.reduce((acc, step, i) => {
      const {stepStatus} = step
      let currentStep = ''

      // STEP STATUS
      if (i === currentStepIndex) {
        currentStep = 'circle-thick current'
      }

      const stepEle = (
        <div
          key={`stepEle${i}`}
          className="progress-button"
          onClick={handleJump(i)}
        >
          <div className="progress-title">{step.title}</div>
          <span className={`icon ${currentStep || stepStatus}`} />
        </div>
      )

      // CONNECTION ELE
      let connectorStatus
      if (i > 0 && steps[i - 1].stepStatus === StepStatus.Complete) {
        connectorStatus = connectorState.Some

        if (stepStatus === StepStatus.Complete) {
          connectorStatus = connectorState.Full
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
