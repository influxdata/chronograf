import React, {PureComponent} from 'react'
import ProgressConnector from 'src/reusable_ui/components/wizard/ProgressConnector'
import {ErrorHandling} from 'src/shared/decorators/errors'

import {Step} from 'src/types/wizard'
import {ConnectorState, StepStatus} from 'src/reusable_ui/constants/wizard'

import 'src/reusable_ui/components/wizard/WizardProgressBar.scss'

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
      if (i === currentStepIndex && stepStatus !== StepStatus.Error) {
        currentStep = 'circle-thick current'
      }

      if (
        i === steps.length - 1 &&
        steps[i - 1].stepStatus === StepStatus.Complete
      ) {
        currentStep = 'checkmark'
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
      let connectorStatus = ConnectorState.None

      if (i > 0 && steps[i - 1].stepStatus === StepStatus.Complete) {
        connectorStatus = ConnectorState.Some

        if (i === steps.length - 1 || stepStatus === StepStatus.Complete) {
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
