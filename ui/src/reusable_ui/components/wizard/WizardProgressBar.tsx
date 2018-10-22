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
    const progressBar = steps.reduce((acc, step, index) => {
      const {stepStatus} = step
      let currentStep = ''

      const isCurrentStep = index === currentStepIndex
      const isNotErrored = stepStatus !== StepStatus.Error
      const isAtEndOfWizard = currentStepIndex === steps.length - 1
      const isCompleted = stepStatus === StepStatus.Complete
      const isLastStep = index === steps.length - 1
      const previousIsComplete =
        steps[index - 1] && steps[index - 1].stepStatus === StepStatus.Complete

      // STEP STATUS
      if (isCurrentStep && isNotErrored) {
        currentStep = 'circle-thick current'
      }

      if (isLastStep && previousIsComplete) {
        currentStep = 'checkmark'
      }

      const stepEle = (
        <div
          key={`stepEle${index}`}
          className="wizard-progress-button"
          onClick={handleJump(index)}
        >
          <div className="wizard-progress-title">{step.title}</div>
          <span className={`icon ${currentStep || stepStatus}`} />
        </div>
      )

      // PROGRESS BAR CONNECTOR
      let connectorStatus = ConnectorState.None

      if (isCurrentStep && isNotErrored) {
        connectorStatus = ConnectorState.Some
      }

      if (isAtEndOfWizard || isLastStep || isCompleted) {
        connectorStatus = ConnectorState.Full
      }

      const connectorEle = isLastStep ? null : (
        <ProgressConnector
          key={`connectorEle${index}`}
          status={connectorStatus}
        />
      )

      return [...acc, stepEle, connectorEle]
    }, [])
    return <>{progressBar}</>
  }
}

export default WizardProgressBar
