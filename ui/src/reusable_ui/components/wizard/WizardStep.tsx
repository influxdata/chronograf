// Libraries
import React, {PureComponent, ReactNode} from 'react'

// Components
import WizardButtonBar from 'src/reusable_ui/components/wizard/WizardButtonBar'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'

import {ErrorHandling} from 'src/shared/decorators/errors'
import {NextReturn} from 'src/types/wizard'

type BooleanFunction = () => boolean
type NextReturnFunction = () => NextReturn
type AsyncNextReturnFunction = () => Promise<NextReturn>

export interface WizardStepProps {
  children: ReactNode
  title: string
  isComplete: () => boolean
  isErrored?: boolean | BooleanFunction
  onPrevious?: () => void
  onNext: NextReturnFunction | AsyncNextReturnFunction
  isSkippableStep?: boolean
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
    isSkippableStep: true,
    isErrored: false,
  }

  private scrollMaxHeight = window.innerHeight * 0.45

  public render() {
    const {children, decrement, nextLabel, previousLabel, lastStep} = this.props

    return (
      <>
        <div className="wizard-step--container">
          <div className="wizard-step--shadow" />
          <FancyScrollbar
            autoHide={false}
            autoHeight={true}
            maxHeight={this.scrollMaxHeight}
          >
            <div className="wizard-step--child">{children}</div>
          </FancyScrollbar>
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
    const {onNext, increment, isSkippableStep} = this.props
    let payload
    let error = false

    if (onNext) {
      const response = await onNext()
      error = response.error
      payload = response.payload
    }

    if (increment) {
      if (isSkippableStep || (!isSkippableStep && error === false)) {
        increment()
      }
    }

    return payload
  }
}

export default WizardStep
