// Libraries
import React, {PureComponent, ReactNode} from 'react'

// Components
import WizardButtonBar from 'src/reusable_ui/components/wizard/WizardButtonBar'

import {ErrorHandling} from 'src/shared/decorators/errors'
import {NextReturn} from 'src/types/wizard'

type booleanFunction = () => boolean

export interface WizardStepProps {
  children: ReactNode
  title: string
  isComplete: () => boolean
  isErrored?: boolean | booleanFunction
  onPrevious?: () => void
  onNext?: () => NextReturn | Promise<NextReturn>
  isBlockingStep?: boolean
  increment?: () => void
  decrement?: () => void
  tipText?: string
  nextLabel?: string
  previousLabel?: string
  lastStep?: boolean
}

@ErrorHandling
class WizardStep extends PureComponent<WizardStepProps> {
  public static defaultProps: Partial<WizardStepProps> = {
    isBlockingStep: false,
  }
  public render() {
    const {children, decrement, nextLabel, previousLabel, lastStep} = this.props

    return (
      <>
        <div className="wizard-step--container">
          <div className="wizard-step--child">{children}</div>
        </div>
        <WizardButtonBar
          decrement={decrement}
          nextLabel={nextLabel}
          previousLabel={previousLabel}
          onClickPrevious={this.handleClickPrevious}
          onClickNext={this.handleClickNext}
          lastStep={lastStep}
        />
      </>
    )
  }

  private handleClickPrevious = async () => {
    const {onPrevious, decrement} = this.props
    let returnedValue
    if (onPrevious) {
      returnedValue = await onPrevious()
    }
    if (decrement) {
      decrement()
    }
    return returnedValue
  }

  private handleClickNext = async () => {
    const {onNext, increment, isBlockingStep} = this.props
    let payload
    let error = false

    if (onNext) {
      const response = await onNext()
      error = response.error
      payload = response.payload
    }

    if (increment) {
      if (!isBlockingStep || (isBlockingStep && error === false)) {
        increment()
      }
    }

    return payload
  }
}

export default WizardStep
