import React, {PureComponent, ReactNode} from 'react'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import WizardButtonBar from 'src/reusable_ui/components/wizard/WizardButtonBar'
import {ErrorHandling} from 'src/shared/decorators/errors'

import 'src/reusable_ui/components/wizard/WizardStep.scss'

type booleanFunction = () => boolean

interface NextReturn {
  status: boolean
  payload: any
}

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
        <FancyScrollbar
          className="wizard-step-content"
          maxHeight={400}
          autoHeight={true}
          autoHide={false}
        >
          <div className="wizard-step-child">{children}</div>
        </FancyScrollbar>
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
    let status = true

    if (onNext) {
      const response = await onNext()
      status = response.status
      payload = response.payload
    }

    if (increment) {
      if (!isBlockingStep || (isBlockingStep && status === true)) {
        increment()
      }
    }

    return payload
  }
}

export default WizardStep
