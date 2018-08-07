// Libraries
import React, {PureComponent} from 'react'

// Components
import ProgressConnector from 'src/reusable_ui/components/wizard/ProgressConnector'

// Types
import {Step} from 'src/types/wizard'
import {ConnectorState, StepStatus} from 'src/reusable_ui/constants/wizard'

import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  steps: Step[]
  currentStepIndex: number
  handleJump: (jumpIndex: number) => () => void
}

@ErrorHandling
class WizardProgressBar extends PureComponent<Props> {
  public render() {
    return <div className="wizard-progress-bar">{this.WizardProgress}</div>
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
          className="wizard-progress-button"
          onClick={handleJump(i)}
        >
          <div className="wizard-progress-title">{step.title}</div>
          <span className={`icon ${currentStep || stepStatus}`} />
        </div>
      )

      // PROGRESS BAR CONNECTOR
      let connectorStatus
      if (i > 0 && steps[i - 1].stepStatus === StepStatus.Complete) {
        connectorStatus = ConnectorState.Some

        if (stepStatus === StepStatus.Complete) {
          connectorStatus = ConnectorState.Full
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
